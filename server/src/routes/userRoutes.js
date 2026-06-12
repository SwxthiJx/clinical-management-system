import { Router } from 'express';
import {
  createDoctor,
  listDoctors,
  listUsers,
  updateActiveStatus
} from '../controllers/userController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';
import { requireCsrf } from '../middleware/csrfMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { activeStatusSchema, createDoctorSchema } from '../schemas/userSchemas.js';

const router = Router();

router.get('/doctors', protect, requirePermission('doctor:read'), listDoctors);
router.get('/', protect, requirePermission('user:read-any'), listUsers);
router.post(
  '/doctors',
  protect,
  requireCsrf,
  requirePermission('doctor:create'),
  validate(createDoctorSchema),
  createDoctor
);
router.patch(
  '/:id/active',
  protect,
  requireCsrf,
  requirePermission('user:manage-any'),
  validate(activeStatusSchema),
  updateActiveStatus
);

export default router;
