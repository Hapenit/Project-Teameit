import { Router } from 'express';
import { getMetrics, metaAccounts, metaResources, createMetaResource, updateMetaResource, metaInsights } from './advertising.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.get('/meta-ads/metrics', requirePermission('analytics', 'read'), getMetrics);
router.get('/meta-ads/accounts', requirePermission('integrations', 'read'), metaAccounts);
router.get('/meta-ads/:accountId/insights', requirePermission('analytics', 'read'), metaInsights);
router.get('/meta-ads/:accountId/:resource', requirePermission('analytics', 'read'), metaResources);
router.post('/meta-ads/:accountId/:resource', requirePermission('campaigns', 'write'), createMetaResource);
router.post('/meta-ads/:accountId/resource/:resourceId', requirePermission('campaigns', 'write'), updateMetaResource);

export default router;
