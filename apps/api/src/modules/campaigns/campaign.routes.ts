import { Router } from 'express';
import { getCampaigns, launchCampaign, estimateAudience, getCampaignAnalytics, handleSmsWebhook, unsubscribe, campaignLifecycle, providerTrackingWebhook } from './campaign.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.get('/', requirePermission('campaigns', 'read'), getCampaigns);
router.post('/', requirePermission('campaigns', 'write'), launchCampaign);
router.post('/estimate-audience', requirePermission('campaigns', 'read'), estimateAudience);
router.get('/:id/analytics', requirePermission('campaigns', 'read'), getCampaignAnalytics);
router.post('/:id/lifecycle', requirePermission('campaigns', 'write'), campaignLifecycle);
router.post('/webhooks/provider', providerTrackingWebhook);
router.post('/webhooks/sms', handleSmsWebhook);
router.get('/unsubscribe', unsubscribe);

export default router;
