import { days } from '../constants.js';

export function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function formatAvailability(availability = []) {
  if (!availability.length) return 'No weekly availability set';
  return availability
    .slice()
    .sort((first, second) => first.dayOfWeek - second.dayOfWeek || first.startTime.localeCompare(second.startTime))
    .map((window) => `${days[window.dayOfWeek]} ${window.startTime}-${window.endTime}`)
    .join(', ');
}

export function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function createIdempotencyKey() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
