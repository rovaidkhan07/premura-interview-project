import { Router } from 'express';
import { createAppointment } from '../controllers/appointmentController';

const router = Router();

router.post('/', createAppointment);

export default router;
