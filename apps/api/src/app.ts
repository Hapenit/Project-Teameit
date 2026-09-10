import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import tenantRoutes from './modules/tenants/tenants.routes';
import crmRoutes from './modules/crm/crm.routes';
import integrationRoutes from './modules/integrations/integrations.routes';
import inboxRoutes from './modules/inbox/inbox.routes';
import webhooksRoutes from './modules/webhooks/webhooks.routes';
import publishingRoutes from './modules/publishing/publishing.routes';
import automationRoutes from './modules/automation/automation.routes';
import campaignRoutes from './modules/campaigns/campaign.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import mediaRoutes from './modules/media/media.routes';
import advertisingRoutes from './modules/advertising/advertising.routes';
import metaSocialRoutes from './modules/providers/meta/meta-social.routes';
import platformRoutes, { stripeWebhook } from './modules/platform/platform.routes';
import googleRoutes from './modules/integrations/google.routes';
import { ImapSyncEngine } from './modules/inbox/ImapSyncEngine';
import { AutomationEngine } from './modules/automation/automation.engine';
import { PublishingScheduler } from './modules/publishing/publishing.scheduler';
import { IntegrationEngine } from './modules/integrations/integrations.engine';
import { rateLimit } from './middleware/rate-limit';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb', verify: (req, _res, buf) => { (req as any).rawBody = Buffer.from(buf); } }));
app.use(express.urlencoded({ extended: false, limit: '1mb', verify: (req, _res, buf) => { (req as any).rawBody = Buffer.from(buf); } }));
app.use(rateLimit());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/crm', crmRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/google', googleRoutes);
app.use('/api/v1/inbox', inboxRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/publishing', publishingRoutes);
app.use('/api/v1/automation', automationRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/advertising', advertisingRoutes);
app.use('/api/v1/meta', metaSocialRoutes);
app.use('/api/v1/platform', platformRoutes);
// Keep the surfaces available at their conventional top-level API paths too.
app.use('/api/v1', platformRoutes);
app.post('/api/v1/webhooks/stripe', stripeWebhook);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start Background Services
// Poll IMAP every 60 seconds (1 minute)
setInterval(() => {
  ImapSyncEngine.syncAll().catch(console.error);
}, 60000);
// Trigger once immediately on boot
setTimeout(() => {
  ImapSyncEngine.syncAll().catch(console.error);
}, 5000);
setInterval(() => {
  AutomationEngine.resumeDueExecutions().catch(console.error);
}, 30000);
setInterval(() => PublishingScheduler.tick().catch(console.error), 30000);
setTimeout(() => PublishingScheduler.tick().catch(console.error), 5000);
// Google Ads is opt-in and only runs when a customer ID is configured.
setInterval(async () => {
  const { data: tenants } = await (await import('./config/supabase')).supabaseAdmin.from('integrations')
    .select('tenant_id').eq('provider', 'google_ads').eq('status', 'active');
  for (const tenant of tenants || []) IntegrationEngine.syncGoogleAds(tenant.tenant_id).catch(console.error);
}, 15 * 60 * 1000);
// Meta Ads metrics are pulled per connected tenant and ad account.
setInterval(async () => {
  const { data: tenants } = await (await import('./config/supabase')).supabaseAdmin.from('integrations')
    .select('tenant_id').in('provider', ['meta', 'meta_ads']).eq('status', 'active');
  for (const tenant of [...new Map((tenants || []).map(t => [t.tenant_id, t])).values()]) {
    IntegrationEngine.syncMetaAds(tenant.tenant_id).catch(console.error);
  }
}, 15 * 60 * 1000);

export default app;
