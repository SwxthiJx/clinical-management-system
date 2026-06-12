import { Router } from 'express';
import { auditLogs, systemStatus } from '../controllers/systemController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { auditLogQuerySchema } from '../schemas/systemSchemas.js';

const router = Router();

router.use(protect, requirePermission('system:read'));
router.get('/status', systemStatus);
router.get('/audit-logs', validate(auditLogQuerySchema), auditLogs);

export default router;
