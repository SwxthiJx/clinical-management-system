import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { processUpcomingAppointmentReminders } from './appointmentNotificationService.js';

export function startReminderScheduler() {
  if (env.ENABLE_APPOINTMENT_REMINDERS !== 'true') {
    logger.info('Appointment reminder scheduler disabled');
    return () => {};
  }

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const processed = await processUpcomingAppointmentReminders();
      if (processed) logger.info('Appointment reminders processed', { processed });
    } catch (error) {
      logger.error('Appointment reminder scheduler failed', { error });
    } finally {
      running = false;
    }
  };

  void run();
  const interval = setInterval(run, env.REMINDER_SCAN_INTERVAL_MINUTES * 60 * 1000);
  interval.unref();

  logger.info('Appointment reminder scheduler started', {
    leadHours: env.APPOINTMENT_REMINDER_HOURS,
    intervalMinutes: env.REMINDER_SCAN_INTERVAL_MINUTES
  });

  return () => clearInterval(interval);
}
