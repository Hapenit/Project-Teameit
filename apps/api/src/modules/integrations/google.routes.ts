import { Router } from 'express';
import { requirePermission } from '../../middleware/rbac';
import { listGoogleResources, googleAnalyticsReport, googleSearchReport, googleAdsQuery, googleAdsMutate, youtubeApi, youtubeUploadInit, youtubeAnalyticsReport, businessApi, adsenseReport, searchConsoleFullReport } from './google.controller';

const router = Router();
router.get('/:provider/resources', requirePermission('integrations', 'read'), listGoogleResources);
router.post('/analytics/report', requirePermission('analytics', 'read'), googleAnalyticsReport);
router.post('/search-console/report', requirePermission('analytics', 'read'), googleSearchReport);
router.post('/search-console/full-report', requirePermission('analytics', 'read'), searchConsoleFullReport);
router.post('/ads/query', requirePermission('advertising', 'read'), googleAdsQuery);
router.post('/ads/mutate', requirePermission('advertising', 'manage'), googleAdsMutate);
router.post('/youtube/upload/init', requirePermission('integrations', 'manage'), youtubeUploadInit);
router.post('/youtube/analytics/report', requirePermission('analytics', 'read'), youtubeAnalyticsReport);
router.all('/youtube/*', requirePermission('integrations', 'manage'), youtubeApi);
router.all('/business/*', requirePermission('integrations', 'manage'), businessApi);
router.post('/adsense/report', requirePermission('analytics', 'read'), adsenseReport);
export default router;
