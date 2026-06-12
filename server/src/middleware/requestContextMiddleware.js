import { createRequestId } from '../utils/crypto.js';

export function requestContext(req, res, next) {
  const requestId = req.get('x-request-id') || createRequestId();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
