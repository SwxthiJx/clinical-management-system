const startedAt = Date.now();
const counters = {
  totalRequests: 0,
  totalErrors: 0,
  activeRequests: 0,
  durationMs: 0,
  byStatus: {},
  byMethod: {}
};

export function beginRequest() {
  counters.activeRequests += 1;
}

export function completeRequest({ method, statusCode, durationMs }) {
  counters.activeRequests = Math.max(0, counters.activeRequests - 1);
  counters.totalRequests += 1;
  counters.durationMs += durationMs;
  counters.byStatus[statusCode] = (counters.byStatus[statusCode] || 0) + 1;
  counters.byMethod[method] = (counters.byMethod[method] || 0) + 1;
  if (statusCode >= 500) counters.totalErrors += 1;
}

export function getMetricsSnapshot() {
  const averageResponseMs = counters.totalRequests
    ? Math.round((counters.durationMs / counters.totalRequests) * 100) / 100
    : 0;

  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    totalRequests: counters.totalRequests,
    totalErrors: counters.totalErrors,
    activeRequests: counters.activeRequests,
    averageResponseMs,
    byStatus: { ...counters.byStatus },
    byMethod: { ...counters.byMethod }
  };
}

export function resetMetrics() {
  counters.totalRequests = 0;
  counters.totalErrors = 0;
  counters.activeRequests = 0;
  counters.durationMs = 0;
  counters.byStatus = {};
  counters.byMethod = {};
}
