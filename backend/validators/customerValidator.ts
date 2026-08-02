import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  zip_code: z.string().min(3).max(10),
  energy_bill: z.number().nonnegative(),
  home_year: z.number().min(1800).max(2100),
  primary_decisionmaker: z.boolean()
});

export const validateCreateCustomer = (req: Request, res: Response, next: NextFunction) => {
  const result = createCustomerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid customer payload', details: result.error.errors });
  }
  next();
};
