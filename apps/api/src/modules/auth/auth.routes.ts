import { Router } from 'express';
import { handleSupabaseWebhook } from './auth.controller';

const router = Router();

router.post('/webhook', handleSupabaseWebhook);

export default router;
