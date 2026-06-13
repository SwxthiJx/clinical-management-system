import { z } from 'zod';
import { objectId } from './commonSchemas.js';

const strongPassword = z
  .string()
  .min(10)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/)
  .regex(/[^A-Za-z0-9]/);

export const createDoctorSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      username: z.string().trim().min(3).max(100),
      email: z.string().trim().email().max(254),
      password: strongPassword,
      specialty: z.string().trim().min(2).max(100),
      education: z.array(z.string().trim().min(2).max(150)).max(6).default([]),
      experienceYears: z.coerce.number().int().min(0).max(70).default(0),
      languages: z.array(z.string().trim().min(2).max(50)).max(10).default([]),
      clinicalInterests: z.array(z.string().trim().min(2).max(100)).max(10).default([]),
      bio: z.string().trim().max(600).optional().default(''),
      phone: z.string().trim().max(30).optional().default('')
    })
    .strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const activeStatusSchema = z.object({
  body: z.object({ isActive: z.boolean() }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({ id: objectId })
});

const medicalList = z
  .array(z.string().trim().min(1).max(120))
  .max(30)
  .transform((items) => [...new Set(items)]);

export const patientMedicalProfileSchema = z.object({
  body: z
    .object({
      age: z.coerce.number().int().min(0).max(130).nullable(),
      bloodGroup: z.enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']),
      allergies: medicalList,
      conditions: medicalList,
      medications: medicalList,
      emergencyContact: z
        .object({
          name: z.string().trim().max(100),
          relationship: z.string().trim().max(60),
          phone: z.string().trim().max(30)
        })
        .strict()
    })
    .strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const patientMedicalProfileIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: objectId })
});
