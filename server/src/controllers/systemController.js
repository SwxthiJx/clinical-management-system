import mongoose from 'mongoose';
import { listAuditEvents } from '../services/auditService.js';
import { getAdminAnalytics } from '../services/adminAnalyticsService.js';
import { getMetricsSnapshot } from '../services/metricsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function databaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export const readiness = (_req, res) => {
  const database = databaseStatus();
  const ready = database === 'connected';
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    database,
    timestamp: new Date().toISOString()
  });
};

export const systemStatus = (_req, res) => {
  const database = databaseStatus();
  res.json({
    status: database === 'connected' ? 'operational' : 'degraded',
    database,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    metrics: getMetricsSnapshot(),
    timestamp: new Date().toISOString()
  });
};

export const auditLogs = asyncHandler(async (req, res) => {
  res.json({ auditLogs: await listAuditEvents(req.validated.query) });
});

export const adminAnalytics = asyncHandler(async (req, res) => {
  res.json({ analytics: await getAdminAnalytics(req.validated.query) });
});
