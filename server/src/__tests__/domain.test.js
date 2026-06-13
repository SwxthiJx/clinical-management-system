import { describe, expect, it } from 'vitest';
import { hasPermission } from '../config/permissions.js';
import { assertStatusTransition, getSlotEnd, isInsideAvailability } from '../services/slotService.js';
import { buildAppointmentMessage } from '../services/appointmentNotificationService.js';
import {
  consultationNoteSchema,
  rescheduleAppointmentSchema
} from '../schemas/appointmentSchemas.js';
import { patientMedicalProfileSchema } from '../schemas/userSchemas.js';
import { presentPatientMedicalProfile } from '../services/patientMedicalProfileService.js';
import { presentConsultationNote } from '../services/consultationNoteService.js';
import { buildAdminAnalytics } from '../services/adminAnalyticsService.js';

describe('appointment scheduling rules', () => {
  it('creates a 30-minute slot end', () => {
    const start = new Date('2026-06-15T09:00:00.000Z');
    expect(getSlotEnd(start).toISOString()).toBe('2026-06-15T09:30:00.000Z');
  });

  it('allows only valid status transitions', () => {
    expect(assertStatusTransition('booked', 'completed')).toBe(true);
    expect(assertStatusTransition('booked', 'cancelled')).toBe(true);
    expect(assertStatusTransition('completed', 'cancelled')).toBe(false);
    expect(assertStatusTransition('cancelled', 'booked')).toBe(false);
  });

  it('checks that slots fit entirely inside availability', () => {
    const doctor = {
      availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }]
    };
    const insideStart = new Date(2026, 5, 15, 9, 30);
    const insideEnd = new Date(2026, 5, 15, 10, 0);
    const outsideEnd = new Date(2026, 5, 15, 12, 30);

    expect(isInsideAvailability(doctor, insideStart, insideEnd)).toBe(true);
    expect(isInsideAvailability(doctor, insideStart, outsideEnd)).toBe(false);
  });
});

describe('role permissions', () => {
  it('allows only administrators to read operational data', () => {
    expect(hasPermission({ role: 'admin' }, 'system:read')).toBe(true);
    expect(hasPermission({ role: 'doctor' }, 'system:read')).toBe(false);
    expect(hasPermission({ role: 'patient' }, 'system:read')).toBe(false);
  });

  it('allows each role to reschedule only within its scope', () => {
    expect(hasPermission({ role: 'patient' }, 'appointment:reschedule-own')).toBe(true);
    expect(hasPermission({ role: 'patient' }, 'appointment:reschedule-any')).toBe(false);
    expect(hasPermission({ role: 'doctor' }, 'appointment:reschedule-assigned')).toBe(true);
    expect(hasPermission({ role: 'admin' }, 'appointment:reschedule-any')).toBe(true);
  });

  it('restricts consultation-note writing to assigned doctors', () => {
    expect(hasPermission({ role: 'doctor' }, 'consultation-note:write-assigned')).toBe(true);
    expect(hasPermission({ role: 'patient' }, 'consultation-note:write-assigned')).toBe(false);
    expect(hasPermission({ role: 'admin' }, 'consultation-note:read-any')).toBe(true);
  });

  it('protects medical-profile access by role and scope', () => {
    expect(hasPermission({ role: 'patient' }, 'medical-profile:write-own')).toBe(true);
    expect(hasPermission({ role: 'patient' }, 'medical-profile:read-any')).toBe(false);
    expect(hasPermission({ role: 'doctor' }, 'medical-profile:read-assigned')).toBe(true);
    expect(hasPermission({ role: 'doctor' }, 'medical-profile:write-own')).toBe(false);
    expect(hasPermission({ role: 'admin' }, 'medical-profile:read-any')).toBe(true);
  });
});

describe('admin analytics', () => {
  it('summarizes appointment demand, cancellations, patients, and utilization', () => {
    const doctor = {
      _id: 'doctor-1',
      name: 'Dr. Maya Rao',
      specialty: 'General Medicine',
      availability: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]
    };
    const analytics = buildAdminAnalytics({
      appointments: [
        {
          patient: 'patient-1',
          doctor,
          startTime: new Date('2026-06-08T09:00:00'),
          status: 'booked'
        },
        {
          patient: 'patient-2',
          doctor,
          startTime: new Date('2026-06-08T09:30:00'),
          status: 'cancelled'
        }
      ],
      doctors: [doctor],
      exceptions: [],
      activePatientCount: 9,
      days: 30,
      now: new Date('2026-06-13T12:00:00')
    });

    expect(analytics.summary.appointmentCount).toBe(2);
    expect(analytics.summary.cancellationRate).toBe(50);
    expect(analytics.summary.activePatients).toBe(1);
    expect(analytics.summary.registeredActivePatients).toBe(9);
    expect(analytics.summary.topSpecialty).toBe('General Medicine');
    expect(analytics.doctorUtilization[0].occupiedSlots).toBe(1);
    expect(analytics.popularSpecialties[0].appointmentCount).toBe(2);
  });
});

describe('appointment notifications', () => {
  const appointment = {
    patient: { name: 'Priya Nair', email: 'priya@clinic.local' },
    doctor: { name: 'Dr. Maya Rao', email: 'doctor@clinic.local' },
    startTime: new Date('2026-06-15T03:30:00.000Z'),
    status: 'booked',
    reason: 'Private medical reason'
  };

  it('builds a patient confirmation with appointment details', () => {
    const message = buildAppointmentMessage({
      appointment,
      type: 'confirmation',
      recipientRole: 'patient'
    });

    expect(message.subject).toContain('Appointment confirmed');
    expect(message.text).toContain('Hello Priya Nair');
    expect(message.text).toContain('Doctor: Dr. Maya Rao');
    expect(message.text).toContain('/appointments');
  });

  it('builds a doctor reminder without including the medical reason', () => {
    const message = buildAppointmentMessage({
      appointment,
      type: 'reminder',
      recipientRole: 'doctor'
    });

    expect(message.text).toContain('Hello Dr. Maya Rao');
    expect(message.text).toContain('Patient: Priya Nair');
    expect(message.text).not.toContain(appointment.reason);
  });

  it('includes both previous and new times in a reschedule notification', () => {
    const message = buildAppointmentMessage({
      appointment,
      type: 'reschedule',
      recipientRole: 'patient',
      previousStartTime: new Date('2026-06-14T03:30:00.000Z')
    });

    expect(message.subject).toContain('Appointment rescheduled');
    expect(message.text).toContain('Previous date and time');
    expect(message.text).toContain('Date and time');
  });
});

describe('reschedule validation', () => {
  it('accepts a timezone-aware appointment timestamp', () => {
    const result = rescheduleAppointmentSchema.safeParse({
      body: { startTime: '2026-06-20T09:00:00.000Z' },
      query: {},
      params: { id: '507f1f77bcf86cd799439011' }
    });

    expect(result.success).toBe(true);
  });

  it('rejects unexpected reschedule fields', () => {
    const result = rescheduleAppointmentSchema.safeParse({
      body: { startTime: '2026-06-20T09:00:00.000Z', doctorId: '507f1f77bcf86cd799439012' },
      query: {},
      params: { id: '507f1f77bcf86cd799439011' }
    });

    expect(result.success).toBe(false);
  });
});

describe('consultation note privacy and validation', () => {
  it('removes doctor-only fields from a patient response', () => {
    const presented = presentConsultationNote(
      {
        status: 'finalized',
        assessment: 'Seasonal allergy',
        privateNotes: 'Internal differential',
        createdBy: 'doctor-1',
        updatedBy: 'doctor-1'
      },
      'patient'
    );

    expect(presented.assessment).toBe('Seasonal allergy');
    expect(presented).not.toHaveProperty('privateNotes');
    expect(presented).not.toHaveProperty('createdBy');
    expect(presented).not.toHaveProperty('updatedBy');
  });

  it('accepts a structured note with clinical content', () => {
    const result = consultationNoteSchema.safeParse({
      body: {
        subjective: 'Persistent cough for three days',
        objective: '',
        assessment: 'Upper respiratory infection',
        plan: 'Hydration and rest',
        prescriptions: '',
        followUpInstructions: '',
        followUpDate: '2026-06-25',
        privateNotes: '',
        status: 'draft'
      },
      query: {},
      params: { id: '507f1f77bcf86cd799439011' }
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty consultation note', () => {
    const result = consultationNoteSchema.safeParse({
      body: { status: 'finalized' },
      query: {},
      params: { id: '507f1f77bcf86cd799439011' }
    });

    expect(result.success).toBe(false);
  });
});

describe('patient medical profile validation', () => {
  it('accepts a structured medical profile', () => {
    const result = patientMedicalProfileSchema.safeParse({
      body: {
        age: 34,
        bloodGroup: 'O+',
        allergies: ['Penicillin'],
        conditions: ['Asthma'],
        medications: ['Salbutamol inhaler'],
        emergencyContact: {
          name: 'Anil Nair',
          relationship: 'Spouse',
          phone: '+91 98765 43210'
        }
      },
      query: {},
      params: {}
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid blood groups and excessive ages', () => {
    const result = patientMedicalProfileSchema.safeParse({
      body: {
        age: 145,
        bloodGroup: 'C+',
        allergies: [],
        conditions: [],
        medications: [],
        emergencyContact: { name: '', relationship: '', phone: '' }
      },
      query: {},
      params: {}
    });

    expect(result.success).toBe(false);
  });

  it('removes internal ownership fields from API responses', () => {
    const presented = presentPatientMedicalProfile({
      _id: 'profile-1',
      patient: 'patient-1',
      age: 34,
      bloodGroup: 'O+',
      allergies: [],
      conditions: [],
      medications: [],
      emergencyContact: {},
      updatedBy: 'patient-1',
      __v: 0
    });

    expect(presented).not.toHaveProperty('patient');
    expect(presented).not.toHaveProperty('updatedBy');
    expect(presented).not.toHaveProperty('__v');
  });
});
