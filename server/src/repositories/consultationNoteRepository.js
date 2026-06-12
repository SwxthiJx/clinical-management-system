import { ConsultationNote } from '../models/ConsultationNote.js';

export function findConsultationNoteByAppointment(appointmentId) {
  return ConsultationNote.findOne({ appointment: appointmentId });
}

export function createConsultationNote(data) {
  return ConsultationNote.create(data);
}
