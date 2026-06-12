import { describe, expect, it } from 'vitest';
import { hasPermission } from '../config/permissions.js';
import { assertStatusTransition, getSlotEnd, isInsideAvailability } from '../services/slotService.js';
import { buildAppointmentMessage } from '../services/appointmentNotificationService.js';

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
});
