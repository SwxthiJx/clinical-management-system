import { rateLimit } from 'express-rate-limit';

function handler(_req, res, _next, options) {
  res.status(options.statusCode).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.'
    }
  });
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler
});

export const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler
});

export const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.body?.login || 'unknown').trim().toLowerCase(),
  skipSuccessfulRequests: true,
  handler
});

export const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler
});

export const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler
});
