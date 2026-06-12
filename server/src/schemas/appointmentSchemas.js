import { z } from 'zod';
import { objectId } from './commonSchemas.js';

export const createAppointmentSchema = z.object({
  body: z
    .object({
      doctorId: objectId,
      patientId: objectId.optional(),
      startTime: z.string().datetime({ offset: true }),
      reason: z.string().trim().max(500).optional().default(''),
      idempotencyKey: z.string().trim().min(8).max(120).optional()
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

export const rescheduleAppointmentSchema = z.object({
  body: z.object({
    startTime: z.string().datetime({ offset: true })
  }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({ id: objectId })
});

const consultationText = (maximum) => z.string().trim().max(maximum).optional().default('');

export const consultationNoteSchema = z.object({
  body: z
    .object({
      subjective: consultationText(4000),
      objective: consultationText(4000),
      assessment: consultationText(4000),
      plan: consultationText(4000),
      prescriptions: consultationText(4000),
      followUpInstructions: consultationText(2000),
      followUpDate: z.union([z.string().date(), z.literal(''), z.null()]).optional().default(null),
      privateNotes: consultationText(4000),
      status: z.enum(['draft', 'finalized'])
    })
    .strict()
    .refine(
      (note) => [note.subjective, note.objective, note.assessment, note.plan].some(Boolean),
      { message: 'At least one clinical note section is required' }
    ),
  query: z.object({}).passthrough(),
  params: z.object({ id: objectId })
});

export const slotQuerySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    doctorId: objectId,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  params: z.object({}).passthrough()
});
