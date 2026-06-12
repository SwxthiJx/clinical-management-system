import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../app.js';
import { getMetricsSnapshot, resetMetrics } from '../services/metricsService.js';

describe('operational endpoints', () => {
  beforeEach(() => resetMetrics());

  it('returns liveness with a request ID', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('preserves a caller-provided request ID', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('x-request-id', 'phase-4-test')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('phase-4-test');
  });

  it('reports readiness separately from liveness', async () => {
    const response = await request(app).get('/api/ready');

    expect([200, 503]).toContain(response.status);
    expect(['ready', 'not_ready']).toContain(response.body.status);
    expect(response.body.database).toBeTruthy();
  });

  it('records request metrics', async () => {
    await request(app).get('/api/health').expect(200);
    const metrics = getMetricsSnapshot();

    expect(metrics.totalRequests).toBe(1);
    expect(metrics.byMethod.GET).toBe(1);
    expect(metrics.byStatus[200]).toBe(1);
    expect(metrics.averageResponseMs).toBeGreaterThanOrEqual(0);
  });

  it('protects administrator system details', async () => {
    const response = await request(app).get('/api/system/status').expect(401);

    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
