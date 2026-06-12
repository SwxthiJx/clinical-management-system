const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const configuredLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const threshold = levels[configuredLevel] || levels.info;

function serializeError(error) {
  if (!error) return undefined;
  return {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  };
}

function write(level, message, context = {}) {
  if (levels[level] < threshold) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };

  if (payload.error instanceof Error) {
    payload.error = serializeError(payload.error);
  }

  const output = JSON.stringify(payload);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

export const logger = {
  debug: (message, context) => write('debug', message, context),
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context)
};
