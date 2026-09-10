import { Router } from 'express';
import { getIntegrations, getAuthUrl, handleOAuthCallback, redirectOAuthCallback, disconnectIntegration, connectEmail, syncAnalytics, whatsappStatus, whatsappTemplates, sendWhatsAppMessage, whatsappTemplateCreate, whatsappTemplateUpdate, whatsappTemplateDelete, whatsappCatalog, whatsappCatalogSync, whatsappProductShare, whatsappTemplateStatus, whatsappTemplateVariables, whatsappProductCreate, whatsappProductUpdate, whatsappProductDelete } from './integrations.controller';
import { requirePermission } from '../../middleware/rbac';

const router = Router();

router.get('/', requirePermission('integrations', 'read'), getIntegrations);
router.get('/auth-url', requirePermission('integrations', 'manage'), getAuthUrl);
router.get('/:provider/oauth/callback', redirectOAuthCallback);
router.post('/callback', handleOAuthCallback); // No RBAC middleware here as it's often a direct cross-origin redirect, though state secures it
router.post('/email', requirePermission('integrations', 'manage'), connectEmail);
router.post('/:provider/analytics/sync', requirePermission('integrations', 'manage'), syncAnalytics);
router.get('/whatsapp/status', requirePermission('integrations', 'read'), whatsappStatus);
router.get('/whatsapp/templates', requirePermission('integrations', 'read'), whatsappTemplates);
router.get('/whatsapp/templates/:name/status', requirePermission('integrations', 'read'), whatsappTemplateStatus);
router.post('/whatsapp/templates/variables', requirePermission('integrations', 'read'), whatsappTemplateVariables);
router.post('/whatsapp/messages', requirePermission('integrations', 'manage'), sendWhatsAppMessage);
router.post('/whatsapp/templates', requirePermission('integrations', 'manage'), whatsappTemplateCreate);
router.post('/whatsapp/templates/:id', requirePermission('integrations', 'manage'), whatsappTemplateUpdate);
router.delete('/whatsapp/templates/:name', requirePermission('integrations', 'manage'), whatsappTemplateDelete);
router.get('/whatsapp/catalog/products', requirePermission('integrations', 'read'), whatsappCatalog);
router.post('/whatsapp/catalog/sync', requirePermission('integrations', 'manage'), whatsappCatalogSync);
router.post('/whatsapp/catalog/share', requirePermission('integrations', 'manage'), whatsappProductShare);
router.post('/whatsapp/catalog/products', requirePermission('integrations', 'manage'), whatsappProductCreate);
router.post('/whatsapp/catalog/products/:id', requirePermission('integrations', 'manage'), whatsappProductUpdate);
router.delete('/whatsapp/catalog/products/:id', requirePermission('integrations', 'manage'), whatsappProductDelete);
router.delete('/:provider', requirePermission('integrations', 'manage'), disconnectIntegration);

export default router;
