import { Router } from 'express';
import { handleVapiWebhook } from '../controllers/vapiController';

const router = Router();

router.post('/webhook', handleVapiWebhook);

export default router;
