import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(10000),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  COOKIE_SAMESITE: z.string().default('lax'),
  FORCE_HTTPS: z.enum(['true', 'false']).optional().default('false'),
  LOGIN_WINDOW_MS: z.coerce
    .number()
    .int()
    .default(15 * 60 * 1000),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().default(5),
  BANK_USER_NAME: z.string().optional(),
  CORS_TLD: z.string().optional().default('de'),
  NODE_ENV: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

const env = {
  ...parsed,
  COOKIE_SECURE:
    parsed.COOKIE_SECURE !== undefined
      ? parsed.COOKIE_SECURE === 'true'
      : parsed.NODE_ENV === 'production',
  FORCE_HTTPS: parsed.FORCE_HTTPS === 'true',
  BANK_USER_NAME: parsed.BANK_USER_NAME,
  CORS_TLD: parsed.CORS_TLD,
};

export default env;
