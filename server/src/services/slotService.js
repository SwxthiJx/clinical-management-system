import { Appointment } from '../models/Appointment.js';

const SLOT_MINUTES = 30;

function minutesFromTime(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function dateMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function getSlotEnd(startTime) {
  return new Date(startTime.getTime() + SLOT_MINUTES * 60 * 1000);
}

export function isInsideAvailability(doctor, startTime, endTime) {
  const dayOfWeek = startTime.getDay();
  const startMinutes = dateMinutes(startTime);
  const endMinutes = dateMinutes(endTime);

  return doctor.availability.some((window) => {
    if (window.dayOfWeek !== dayOfWeek) return false;
    return startMinutes >= minutesFromTime(window.startTime) && endMinutes <= minutesFromTime(window.endTime);
  });
}

export async function hasAppointmentConflict({ doctorId, startTime, endTime, excludeAppointmentId }) {
  const query = {
    doctor: doctorId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return Boolean(await Appointment.exists(query));
}
