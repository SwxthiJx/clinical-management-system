import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function notFound(req, res, next) {
  next(new AppError('Resource not found', 404, 'NOT_FOUND'));
}

export function errorHandler(error, req, res, _next) {
  let normalized = error;

  if (error?.code === 11000) {
    normalized = new AppError('A unique field is already in use', 409, 'DUPLICATE_VALUE');
  } else if (error?.name === 'CastError') {
    normalized = new AppError('Invalid resource identifier', 400, 'INVALID_IDENTIFIER');
  } else if (error?.name === 'ValidationError') {
    normalized = new AppError('Stored data validation failed', 400, 'DATA_VALIDATION_ERROR');
  }

  const isOperational = normalized.isOperational;
  const statusCode = isOperational ? normalized.statusCode : 500;

  if (!isOperational) {
    logger.error('Unhandled request error', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      userId: req.user?._id?.toString(),
      error
    });
  }

  res.status(statusCode).json({
    error: {
      code: isOperational ? normalized.code : 'INTERNAL_ERROR',
      message: isOperational ? normalized.message : 'An unexpected error occurred',
      ...(isOperational && normalized.details ? { details: normalized.details } : {}),
      requestId: req.requestId
    }
  });
}
