import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    action: z.string().trim().max(100).optional(),
    actorRole: z.enum(['patient', 'doctor', 'admin', 'system']).optional()
  })
});
