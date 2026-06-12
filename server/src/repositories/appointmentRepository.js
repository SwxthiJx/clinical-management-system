import { Appointment } from '../models/Appointment.js';

const population = [
  { path: 'patient', select: 'name email phone' },
  { path: 'doctor', select: 'name email specialty' }
];

export function findAppointments(query) {
  return Appointment.find(query).populate(population).sort({ startTime: 1 }).lean();
}

export function findAppointmentById(id) {
  return Appointment.findById(id);
}

export function findIdempotentAppointment(patientId, idempotencyKey) {
  return Appointment.findOne({ patient: patientId, idempotencyKey }).populate(population);
}

export function createAppointment(data) {
  return Appointment.create(data);
}

export function populateAppointment(appointment) {
  return appointment.populate(population);
}
