import { Appointment } from '../models/Appointment.js';
import { ScheduleException } from '../models/ScheduleException.js';

const SLOT_MINUTES = 30;

function minutesFromTime(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function dateMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateAtMinutes(dateString, minutes) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
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

export async function isDateBlocked(doctorId, startTime) {
  return Boolean(await ScheduleException.exists({ doctor: doctorId, date: dateKey(startTime) }));
}

export async function generateAvailableSlots({ doctor, date }) {
  const target = dateAtMinutes(date, 0);
  if (Number.isNaN(target.getTime())) return [];

  const blocked = await ScheduleException.exists({ doctor: doctor._id, date });
  if (blocked) return [];

  const dayOfWeek = target.getDay();
  const windows = doctor.availability.filter((window) => window.dayOfWeek === dayOfWeek);
  if (!windows.length) return [];

  const dayStart = dateAtMinutes(date, 0);
  const dayEnd = dateAtMinutes(date, 24 * 60);
  const appointments = await Appointment.find({
    doctor: doctor._id,
    status: { $ne: 'cancelled' },
    startTime: { $lt: dayEnd },
    endTime: { $gt: dayStart }
  })
    .select('startTime endTime')
    .lean();

  const now = new Date();
  const slots = [];

  for (const window of windows) {
    const windowStart = minutesFromTime(window.startTime);
    const windowEnd = minutesFromTime(window.endTime);

    for (let minute = windowStart; minute + SLOT_MINUTES <= windowEnd; minute += SLOT_MINUTES) {
      const startTime = dateAtMinutes(date, minute);
      const endTime = getSlotEnd(startTime);

      if (startTime <= now) continue;

      const conflict = appointments.some(
        (appointment) => appointment.startTime < endTime && appointment.endTime > startTime
      );

      if (!conflict) {
        slots.push({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          label: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }
  }

  return slots;
}

export function assertStatusTransition(currentStatus, nextStatus) {
  const allowed = {
    booked: new Set(['completed', 'cancelled']),
    completed: new Set([]),
    cancelled: new Set([])
  };

  return allowed[currentStatus]?.has(nextStatus) ?? false;
}
