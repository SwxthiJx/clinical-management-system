import { z } from 'zod';

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol');

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254),
      password,
      phone: z.string().trim().max(30).optional().default('')
    })
    .strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const loginSchema = z.object({
  body: z
    .object({
      login: z.string().trim().min(2).max(254),
      password: z.string().min(1).max(200)
    })
    .strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().email().max(254) }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const tokenSchema = z.object({
  body: z.object({ token: z.string().min(32).max(500) }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const resetPasswordSchema = z.object({
  body: z.object({ token: z.string().min(32).max(500), password }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1).max(200),
      newPassword: password
    })
    .strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});
