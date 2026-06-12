import { env } from '../config/env.js';
import {
  claimUpcomingReminder,
  completeReminderClaim,
  updateNotificationTimestamp
} from '../repositories/appointmentRepository.js';
import { logger } from '../utils/logger.js';
import { sendMail } from './mailService.js';

const notificationTypes = {
  confirmation: {
    subject: 'Appointment confirmed',
    timestampField: 'confirmationSentAt'
  },
  cancellation: {
    subject: 'Appointment cancelled',
    timestampField: 'cancellationSentAt'
  },
  completion: {
    subject: 'Appointment completed',
    timestampField: 'completionSentAt'
  },
  reminder: {
    subject: 'Upcoming appointment reminder',
    timestampField: 'reminderSentAt'
  }
};

function appointmentDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: env.NOTIFICATION_TIME_ZONE
  }).format(new Date(value));
}

export function buildAppointmentMessage({ appointment, type, recipientRole }) {
  const config = notificationTypes[type];
  if (!config) throw new Error(`Unsupported appointment notification type: ${type}`);

  const patientName = appointment.patient?.name || 'Patient';
  const doctorName = appointment.doctor?.name || 'Doctor';
  const recipientName = recipientRole === 'doctor' ? doctorName : patientName;
  const counterpart = recipientRole === 'doctor' ? patientName : doctorName;
  const counterpartLabel = recipientRole === 'doctor' ? 'Patient' : 'Doctor';
  const when = appointmentDate(appointment.startTime);
  const portalUrl = `${env.APP_BASE_URL || env.CLIENT_URL}/appointments`;

  const opening = {
    confirmation: 'The appointment has been confirmed.',
    cancellation: 'The appointment has been cancelled.',
    completion: 'The appointment has been marked as completed.',
    reminder: `This is a reminder that the appointment is scheduled within the next ${env.APPOINTMENT_REMINDER_HOURS} hours.`
  }[type];

  return {
    subject: `${config.subject} | Aarogya Care Hospital`,
    text: [
      `Hello ${recipientName},`,
      '',
      opening,
      `${counterpartLabel}: ${counterpart}`,
      `Date and time: ${when}`,
      `Status: ${appointment.status}`,
      '',
      `View appointments: ${portalUrl}`,
      '',
      'Aarogya Care Hospital'
    ].join('\n')
  };
}

async function deliverToParticipant({ appointment, type, participant, recipientRole }) {
  if (!participant?.email) return { delivered: false, skipped: true };
  const message = buildAppointmentMessage({ appointment, type, recipientRole });
  return sendMail({ to: participant.email, ...message });
}

export async function sendAppointmentNotification({ appointment, type }) {
  const config = notificationTypes[type];
  if (!config) throw new Error(`Unsupported appointment notification type: ${type}`);

  const results = await Promise.allSettled([
    deliverToParticipant({
      appointment,
      type,
      participant: appointment.patient,
      recipientRole: 'patient'
    }),
    deliverToParticipant({
      appointment,
      type,
      participant: appointment.doctor,
      recipientRole: 'doctor'
    })
  ]);

  const delivered = results.some(
    (result) => result.status === 'fulfilled' && result.value?.delivered
  );
  const failures = results.filter((result) => result.status === 'rejected');

  for (const failure of failures) {
    logger.error('Appointment notification delivery failed', {
      appointmentId: appointment._id?.toString(),
      type,
      error: failure.reason
    });
  }

  if (delivered && type !== 'reminder') {
    await updateNotificationTimestamp(appointment._id, config.timestampField);
  }

  return { delivered, failures: failures.length };
}

export async function processUpcomingAppointmentReminders({ now = new Date() } = {}) {
  const reminderCutoff = new Date(
    now.getTime() + env.APPOINTMENT_REMINDER_HOURS * 60 * 60 * 1000
  );
  const staleClaimCutoff = new Date(now.getTime() - 30 * 60 * 1000);
  let processed = 0;

  while (true) {
    const appointment = await claimUpcomingReminder({ now, reminderCutoff, staleClaimCutoff });
    if (!appointment) break;

    try {
      const result = await sendAppointmentNotification({ appointment, type: 'reminder' });
      if (result.delivered) {
        await completeReminderClaim(appointment._id);
        processed += 1;
      }
    } catch (error) {
      logger.error('Appointment reminder processing failed', {
        appointmentId: appointment._id.toString(),
        error
      });
    }
  }

  return processed;
}

export async function sendAppointmentNotificationSafely(options) {
  try {
    return await sendAppointmentNotification(options);
  } catch (error) {
    logger.error('Appointment notification failed', {
      appointmentId: options.appointment?._id?.toString(),
      type: options.type,
      error
    });
    return { delivered: false, failures: 1 };
  }
}
