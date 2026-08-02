import { Router } from 'express';
import { startCall, endCall } from '../controllers/callController';
import { validateStartCall } from '../validators/callValidator';

const router = Router();

router.post('/start', validateStartCall, startCall);
router.post('/end', endCall);

export default router;
