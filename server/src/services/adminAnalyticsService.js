import {
  countActivePatients,
  findAnalyticsAppointments,
  findAnalyticsDoctors,
  findScheduleExceptions
} from '../repositories/analyticsRepository.js';

const SLOT_MINUTES = 30;

function dateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function entityId(value) {
  return String(value?._id || value || '');
}

function minutesBetween(start, end) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function buildTrend({ appointments, start, days }) {
  const bucketDays = days === 30 ? 1 : 7;
  const buckets = [];

  for (let offset = 0; offset < days; offset += bucketDays) {
    const bucketStart = addDays(start, offset);
    const bucketEnd = addDays(bucketStart, Math.min(bucketDays, days - offset));
    buckets.push({
      label: bucketDays === 1
        ? bucketStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        : `${bucketStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
      startDate: dateKey(bucketStart),
      endDate: dateKey(addDays(bucketEnd, -1)),
      total: 0,
      cancelled: 0,
      patients: new Set(),
      bucketEnd
    });
  }

  for (const appointment of appointments) {
    const appointmentTime = new Date(appointment.startTime);
    const bucket = buckets.find(
      (candidate) => appointmentTime >= new Date(`${candidate.startDate}T00:00:00`) &&
        appointmentTime < candidate.bucketEnd
    );
    if (!bucket) continue;
    bucket.total += 1;
    if (appointment.status === 'cancelled') bucket.cancelled += 1;
    if (appointment.status !== 'cancelled') bucket.patients.add(entityId(appointment.patient));
  }

  return buckets.map(({ bucketEnd, patients, ...bucket }) => ({
    ...bucket,
    activePatients: patients.size
  }));
}

function doctorCapacity(doctor, start, days, exceptionKeys) {
  let capacity = 0;
  const doctorId = entityId(doctor);

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(start, offset);
    if (exceptionKeys.has(`${doctorId}:${dateKey(date)}`)) continue;
    for (const window of doctor.availability || []) {
      if (window.dayOfWeek !== date.getDay()) continue;
      capacity += Math.max(0, Math.floor(minutesBetween(window.startTime, window.endTime) / SLOT_MINUTES));
    }
  }

  return capacity;
}

export function buildAdminAnalytics({
  appointments,
  doctors,
  exceptions,
  activePatientCount,
  days,
  now = new Date()
}) {
  const end = new Date(now);
  const start = addDays(startOfDay(end), -(days - 1));
  const nonCancelled = appointments.filter((appointment) => appointment.status !== 'cancelled');
  const cancelled = appointments.length - nonCancelled.length;
  const activePatients = new Set(nonCancelled.map((appointment) => entityId(appointment.patient)));
  const exceptionKeys = new Set(
    exceptions.map((exception) => `${entityId(exception.doctor)}:${exception.date}`)
  );

  const doctorUtilization = doctors.map((doctor) => {
    const doctorId = entityId(doctor);
    const occupiedSlots = nonCancelled.filter(
      (appointment) => entityId(appointment.doctor) === doctorId
    ).length;
    const availableSlots = doctorCapacity(doctor, start, days, exceptionKeys);
    return {
      doctorId,
      name: doctor.name,
      specialty: doctor.specialty || 'General',
      occupiedSlots,
      availableSlots,
      utilizationRate: availableSlots
        ? Math.min(100, Math.round((occupiedSlots / availableSlots) * 1000) / 10)
        : 0
    };
  }).sort((first, second) => second.utilizationRate - first.utilizationRate);

  const specialtyCounts = new Map();
  for (const appointment of appointments) {
    const specialty = appointment.doctor?.specialty || 'Unassigned';
    specialtyCounts.set(specialty, (specialtyCounts.get(specialty) || 0) + 1);
  }
  const popularSpecialties = [...specialtyCounts.entries()]
    .map(([specialty, appointmentCount]) => ({ specialty, appointmentCount }))
    .sort((first, second) => second.appointmentCount - first.appointmentCount);

  const totalCapacity = doctorUtilization.reduce(
    (total, doctor) => total + doctor.availableSlots,
    0
  );
  const occupiedSlots = doctorUtilization.reduce(
    (total, doctor) => total + doctor.occupiedSlots,
    0
  );

  return {
    period: {
      days,
      startDate: dateKey(start),
      endDate: dateKey(end)
    },
    summary: {
      appointmentCount: appointments.length,
      cancellationCount: cancelled,
      cancellationRate: appointments.length
        ? Math.round((cancelled / appointments.length) * 1000) / 10
        : 0,
      activePatients: activePatients.size,
      registeredActivePatients: activePatientCount,
      averageDoctorUtilization: totalCapacity
        ? Math.min(100, Math.round((occupiedSlots / totalCapacity) * 1000) / 10)
        : 0,
      topSpecialty: popularSpecialties[0]?.specialty || 'No activity'
    },
    trend: buildTrend({ appointments, start, days }),
    doctorUtilization,
    popularSpecialties
  };
}

export async function getAdminAnalytics({ days, now = new Date() }) {
  const end = endOfDay(now);
  const start = addDays(startOfDay(end), -(days - 1));
  const [appointments, doctors, exceptions, activePatientCount] = await Promise.all([
    findAnalyticsAppointments(start, end),
    findAnalyticsDoctors(),
    findScheduleExceptions(dateKey(start), dateKey(end)),
    countActivePatients()
  ]);

  return buildAdminAnalytics({
    appointments,
    doctors,
    exceptions,
    activePatientCount,
    days,
    now
  });
}
