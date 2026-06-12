import { z } from 'zod';
import { objectId } from './commonSchemas.js';

export const createAppointmentSchema = z.object({
  body: z
    .object({
      doctorId: objectId,
      patientId: objectId.optional(),
      startTime: z.string().datetime({ offset: true }),
      reason: z.string().trim().max(500).optional().default('')
    })
    .strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const appointmentStatusSchema = z.object({
  body: z.object({ status: z.enum(['booked', 'completed', 'cancelled']) }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({ id: objectId })
});

export const appointmentIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: objectId })
});
