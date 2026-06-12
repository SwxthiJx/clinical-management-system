import { beginRequest, completeRequest } from '../services/metricsService.js';
import { logger } from '../utils/logger.js';

export function observeRequest(req, res, next) {
  const startedAt = process.hrtime.bigint();
  beginRequest();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    completeRequest({ method: req.method, statusCode: res.statusCode, durationMs });

    const context = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?._id?.toString(),
      role: req.user?.role,
      ip: req.ip
    };

    if (res.statusCode >= 500) logger.error('HTTP request completed', context);
    else if (res.statusCode >= 400) logger.warn('HTTP request completed', context);
    else logger.info('HTTP request completed', context);
  });

  next();
}
