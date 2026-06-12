import { Router } from 'express';
import {
  addAvailability,
  addException,
  deleteAvailability,
  deleteException,
  getAvailability,
  listExceptions
} from '../controllers/availabilityController.js';
import { protect, requireAnyPermission } from '../middleware/authMiddleware.js';
import { requireCsrf } from '../middleware/csrfMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  addAvailabilitySchema,
  addExceptionSchema,
  deleteAvailabilitySchema,
  deleteExceptionSchema,
  getAvailabilitySchema,
  listExceptionsSchema
} from '../schemas/availabilitySchemas.js';

const router = Router();

router.get('/', protect, validate(getAvailabilitySchema), getAvailability);
router.get(
  '/exceptions',
  protect,
  requireAnyPermission('availability:manage-own', 'availability:manage-any'),
  validate(listExceptionsSchema),
  listExceptions
);
router.post(
  '/exceptions',
  protect,
  requireCsrf,
  requireAnyPermission('availability:manage-own', 'availability:manage-any'),
  validate(addExceptionSchema),
  addException
);
router.delete(
  '/exceptions/:id',
  protect,
  requireCsrf,
  requireAnyPermission('availability:manage-own', 'availability:manage-any'),
  validate(deleteExceptionSchema),
  deleteException
);
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
