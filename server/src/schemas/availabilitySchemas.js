import { z } from 'zod';
import { objectId } from './commonSchemas.js';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const getAvailabilitySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ doctorId: objectId.optional() }),
  params: z.object({}).passthrough()
});

export const addAvailabilitySchema = z.object({
  body: z
    .object({
      doctorId: objectId.optional(),
      dayOfWeek: z.coerce.number().int().min(0).max(6),
      startTime: time,
      endTime: time
    })
    .strict()
    .refine((value) => value.startTime < value.endTime, {
      message: 'End time must be after start time',
      path: ['endTime']
    }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const deleteAvailabilitySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ doctorId: objectId.optional() }),
  params: z.object({ id: objectId })
});

export const listExceptionsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ doctorId: objectId.optional() }),
  params: z.object({}).passthrough()
});

export const addExceptionSchema = z.object({
  body: z
    .object({
      doctorId: objectId.optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string().trim().max(200).optional().default('')
    })
    .strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const deleteExceptionSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({ doctorId: objectId.optional() }),
  params: z.object({ id: objectId })
});
