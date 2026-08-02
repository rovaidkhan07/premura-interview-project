import { Router } from 'express';
import { createCustomer, getCustomerById } from '../controllers/customerController';
import { validateCreateCustomer } from '../validators/customerValidator';

const router = Router();

router.post('/', validateCreateCustomer, createCustomer);
router.get('/:id', getCustomerById);

export default router;
