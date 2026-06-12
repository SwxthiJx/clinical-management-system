import { Router } from 'express';
import {
  cancelAppointment,
  createAppointment,
  getConsultationNote,
  listAppointments,
  listSlots,
  rescheduleAppointment,
  saveConsultationNote,
  updateAppointmentStatus
} from '../controllers/appointmentController.js';
import { protect, requireAnyPermission } from '../middleware/authMiddleware.js';
import { requireCsrf } from '../middleware/csrfMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  appointmentIdSchema,
  appointmentStatusSchema,
  consultationNoteSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  slotQuerySchema
} from '../schemas/appointmentSchemas.js';

const router = Router();

router.get(
  '/',
  protect,
  requireAnyPermission('appointment:read-own', 'appointment:read-assigned', 'appointment:read-any'),
  listAppointments
);
router.get(
  '/slots',
  protect,
  requireAnyPermission('appointment:create-own', 'appointment:create-any', 'doctor:read'),
  validate(slotQuerySchema),
  listSlots
);
router.post(
  '/',
  protect,
  requireCsrf,
  requireAnyPermission('appointment:create-own', 'appointment:create-any'),
  validate(createAppointmentSchema),
  createAppointment
);
router.get(
  '/:id/consultation-note',
  protect,
  requireAnyPermission(
    'consultation-note:read-own',
    'consultation-note:read-assigned',
    'consultation-note:read-any'
  ),
  validate(appointmentIdSchema),
  getConsultationNote
);
router.put(
  '/:id/consultation-note',
  protect,
  requireCsrf,
  requireAnyPermission('consultation-note:write-assigned'),
  validate(consultationNoteSchema),
  saveConsultationNote
);
router.patch(
  '/:id/reschedule',
  protect,
  requireCsrf,
  requireAnyPermission(
    'appointment:reschedule-own',
    'appointment:reschedule-assigned',
    'appointment:reschedule-any'
  ),
  validate(rescheduleAppointmentSchema),
  rescheduleAppointment
);
router.patch(
  '/:id/status',
  protect,
  requireCsrf,
  requireAnyPermission('appointment:update-assigned', 'appointment:update-any'),
  validate(appointmentStatusSchema),
  updateAppointmentStatus
);
router.patch(
  '/:id/cancel',
  protect,
  requireCsrf,
  requireAnyPermission('appointment:cancel-own', 'appointment:update-assigned', 'appointment:cancel-any'),
  validate(appointmentIdSchema),
  cancelAppointment
);

export default router;
