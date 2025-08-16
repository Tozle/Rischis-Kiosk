import rateLimit from 'express-rate-limit';
import env from '../utils/env.js';

export const loginLimiter = rateLimit({
  windowMs: env.LOGIN_WINDOW_MS,
  max: env.LOGIN_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
});
