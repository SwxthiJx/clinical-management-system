import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const timeZone = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}, 'NOTIFICATION_TIME_ZONE must be a valid IANA time zone');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().positive().default(7),
  CLIENT_URL: z.string().url(),
  APP_BASE_URL: z.string().url().optional(),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
  ENABLE_APPOINTMENT_REMINDERS: z.enum(['true', 'false']).default('true'),
  APPOINTMENT_REMINDER_HOURS: z.coerce.number().positive().max(168).default(24),
  REMINDER_SCAN_INTERVAL_MINUTES: z.coerce.number().positive().max(1440).default(15),
  NOTIFICATION_TIME_ZONE: timeZone.default('Asia/Kolkata')
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = result.data;
