import { Router } from 'express';
import {
  createDoctor,
  getMedicalProfile,
  getOwnMedicalProfile,
  listDoctors,
  listUsers,
  updateOwnMedicalProfile,
  updateActiveStatus
} from '../controllers/userController.js';
import { protect, requireAnyPermission, requirePermission } from '../middleware/authMiddleware.js';
import { requireCsrf } from '../middleware/csrfMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  activeStatusSchema,
  createDoctorSchema,
  patientMedicalProfileIdSchema,
  patientMedicalProfileSchema
} from '../schemas/userSchemas.js';

const router = Router();

router.get('/doctors', protect, requirePermission('doctor:read'), listDoctors);
router.get(
  '/me/medical-profile',
  protect,
  requirePermission('medical-profile:read-own'),
  getOwnMedicalProfile
);
router.put(
  '/me/medical-profile',
  protect,
  requireCsrf,
  requirePermission('medical-profile:write-own'),
  validate(patientMedicalProfileSchema),
  updateOwnMedicalProfile
);
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
router.get(
  '/:id/medical-profile',
  protect,
  requireAnyPermission('medical-profile:read-assigned', 'medical-profile:read-any'),
  validate(patientMedicalProfileIdSchema),
  getMedicalProfile
);

export default router;
