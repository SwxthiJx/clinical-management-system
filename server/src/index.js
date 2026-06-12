import { env } from './config/env.js';
import app from './app.js';
import { connectDB } from './utils/db.js';

const port = env.PORT;

connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received; closing HTTP server`);
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
