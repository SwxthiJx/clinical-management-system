import { env } from './config/env.js';
import app from './app.js';
import { connectDB } from './utils/db.js';
import { logger } from './utils/logger.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

const port = env.PORT;

connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      logger.info('API server started', { port, environment: env.NODE_ENV });
    });
    const stopReminderScheduler = startReminderScheduler();

    const shutdown = (signal) => {
      logger.info('Shutdown signal received', { signal });
      stopReminderScheduler();
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((error) => {
    logger.error('Failed to start server', { error });
    process.exit(1);
  });
