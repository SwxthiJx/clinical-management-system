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

export function hasDoctorPatientRelationship({ doctorId, patientId }) {
  return Appointment.exists({
    doctor: doctorId,
    patient: patientId,
    status: { $in: ['booked', 'completed'] }
  });
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

export function updateNotificationTimestamp(appointmentId, field, value = new Date()) {
  return Appointment.updateOne(
    { _id: appointmentId },
    { $set: { [`notifications.${field}`]: value } }
  );
}

export function claimUpcomingReminder({ now, reminderCutoff, staleClaimCutoff }) {
  return Appointment.findOneAndUpdate(
    {
      status: 'booked',
      startTime: { $gt: now, $lte: reminderCutoff },
      'notifications.reminderSentAt': null,
      $or: [
        { 'notifications.reminderClaimedAt': null },
        { 'notifications.reminderClaimedAt': { $lt: staleClaimCutoff } }
      ]
    },
    { $set: { 'notifications.reminderClaimedAt': now } },
    { new: true, sort: { startTime: 1 } }
  ).populate(population);
}

export function completeReminderClaim(appointmentId, sentAt = new Date()) {
  return Appointment.updateOne(
    { _id: appointmentId },
    {
      $set: { 'notifications.reminderSentAt': sentAt },
      $unset: { 'notifications.reminderClaimedAt': 1 }
    }
  );
}
