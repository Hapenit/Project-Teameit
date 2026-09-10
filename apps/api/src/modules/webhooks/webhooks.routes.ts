import { Router } from 'express';
import { verifyWhatsAppWebhook, handleWhatsAppWebhook, verifyInstagramWebhook, handleInstagramWebhook, verifyFacebookWebhook, handleFacebookWebhook } from './webhooks.controller';

const router = Router();

router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', handleWhatsAppWebhook);

router.get('/instagram', verifyInstagramWebhook);
router.post('/instagram', handleInstagramWebhook);

router.get('/facebook', verifyFacebookWebhook);
router.post('/facebook', handleFacebookWebhook);

export default router;
