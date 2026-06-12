import { Router } from 'express';
import {
  addAvailability,
  deleteAvailability,
  getAvailability
} from '../controllers/availabilityController.js';
import { protect, requireAnyPermission } from '../middleware/authMiddleware.js';
import { requireCsrf } from '../middleware/csrfMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  addAvailabilitySchema,
  deleteAvailabilitySchema,
  getAvailabilitySchema
} from '../schemas/availabilitySchemas.js';

const router = Router();

router.get('/', protect, validate(getAvailabilitySchema), getAvailability);
router.post(
  '/',
  protect,
  requireCsrf,
  requireAnyPermission('availability:manage-own', 'availability:manage-any'),
  validate(addAvailabilitySchema),
  addAvailability
);
router.delete(
  '/:id',
  protect,
  requireCsrf,
  requireAnyPermission('availability:manage-own', 'availability:manage-any'),
  validate(deleteAvailabilitySchema),
  deleteAvailability
);

export default router;
