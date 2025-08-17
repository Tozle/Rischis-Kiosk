import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const buySchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

const adminBuySchema = buySchema.extend({
  user_id: z.string().uuid(),
});

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => i.message);
    const message = issues.join('; ');
    const error = new Error(message || 'Ungültige Eingaben');
    error.status = 400;
    throw error;
  }
  return result.data;
}

function createValidator(schema) {
  return (req, res, next) => {
    try {
      req.body = parse(schema, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const validateLogin = createValidator(loginSchema);
export const validateRegister = createValidator(registerSchema);
export const validateBuy = createValidator(buySchema);
export const validateAdminBuy = createValidator(adminBuySchema);


