import { Router } from 'express';
import { adminAnalytics, auditLogs, systemStatus } from '../controllers/systemController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { analyticsQuerySchema, auditLogQuerySchema } from '../schemas/systemSchemas.js';

const router = Router();

router.use(protect, requirePermission('system:read'));
router.get('/status', systemStatus);
router.get('/audit-logs', validate(auditLogQuerySchema), auditLogs);
router.get('/analytics', validate(analyticsQuerySchema), adminAnalytics);

export default router;
