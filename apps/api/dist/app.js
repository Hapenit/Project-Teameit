"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const tenants_routes_1 = __importDefault(require("./modules/tenants/tenants.routes"));
const crm_routes_1 = __importDefault(require("./modules/crm/crm.routes"));
const integrations_routes_1 = __importDefault(require("./modules/integrations/integrations.routes"));
const inbox_routes_1 = __importDefault(require("./modules/inbox/inbox.routes"));
const webhooks_routes_1 = __importDefault(require("./modules/webhooks/webhooks.routes"));
const publishing_routes_1 = __importDefault(require("./modules/publishing/publishing.routes"));
const automation_routes_1 = __importDefault(require("./modules/automation/automation.routes"));
const campaign_routes_1 = __importDefault(require("./modules/campaigns/campaign.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const media_routes_1 = __importDefault(require("./modules/media/media.routes"));
const advertising_routes_1 = __importDefault(require("./modules/advertising/advertising.routes"));
const meta_social_routes_1 = __importDefault(require("./modules/providers/meta/meta-social.routes"));
const platform_routes_1 = __importStar(require("./modules/platform/platform.routes"));
const google_routes_1 = __importDefault(require("./modules/integrations/google.routes"));
const ImapSyncEngine_1 = require("./modules/inbox/ImapSyncEngine");
const automation_engine_1 = require("./modules/automation/automation.engine");
const publishing_scheduler_1 = require("./modules/publishing/publishing.scheduler");
const integrations_engine_1 = require("./modules/integrations/integrations.engine");
const rate_limit_1 = require("./middleware/rate-limit");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb', verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
app.use(express_1.default.urlencoded({ extended: false, limit: '1mb', verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); } }));
app.use((0, rate_limit_1.rateLimit)());
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/tenants', tenants_routes_1.default);
app.use('/api/v1/crm', crm_routes_1.default);
app.use('/api/v1/integrations', integrations_routes_1.default);
app.use('/api/v1/google', google_routes_1.default);
app.use('/api/v1/inbox', inbox_routes_1.default);
app.use('/api/v1/webhooks', webhooks_routes_1.default);
app.use('/api/v1/publishing', publishing_routes_1.default);
app.use('/api/v1/automation', automation_routes_1.default);
app.use('/api/v1/campaigns', campaign_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/media', media_routes_1.default);
app.use('/api/v1/advertising', advertising_routes_1.default);
app.use('/api/v1/meta', meta_social_routes_1.default);
app.use('/api/v1/platform', platform_routes_1.default);
// Keep the surfaces available at their conventional top-level API paths too.
app.use('/api/v1', platform_routes_1.default);
app.post('/api/v1/webhooks/stripe', platform_routes_1.stripeWebhook);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Start Background Services
// Poll IMAP every 60 seconds (1 minute)
setInterval(() => {
    ImapSyncEngine_1.ImapSyncEngine.syncAll().catch(console.error);
}, 60000);
// Trigger once immediately on boot
setTimeout(() => {
    ImapSyncEngine_1.ImapSyncEngine.syncAll().catch(console.error);
}, 5000);
setInterval(() => {
    automation_engine_1.AutomationEngine.resumeDueExecutions().catch(console.error);
}, 30000);
setInterval(() => publishing_scheduler_1.PublishingScheduler.tick().catch(console.error), 30000);
setTimeout(() => publishing_scheduler_1.PublishingScheduler.tick().catch(console.error), 5000);
// Google Ads is opt-in and only runs when a customer ID is configured.
setInterval(async () => {
    const { data: tenants } = await (await Promise.resolve().then(() => __importStar(require('./config/supabase')))).supabaseAdmin.from('integrations')
        .select('tenant_id').eq('provider', 'google_ads').eq('status', 'active');
    for (const tenant of tenants || [])
        integrations_engine_1.IntegrationEngine.syncGoogleAds(tenant.tenant_id).catch(console.error);
}, 15 * 60 * 1000);
// Meta Ads metrics are pulled per connected tenant and ad account.
setInterval(async () => {
    const { data: tenants } = await (await Promise.resolve().then(() => __importStar(require('./config/supabase')))).supabaseAdmin.from('integrations')
        .select('tenant_id').in('provider', ['meta', 'meta_ads']).eq('status', 'active');
    for (const tenant of [...new Map((tenants || []).map(t => [t.tenant_id, t])).values()]) {
        integrations_engine_1.IntegrationEngine.syncMetaAds(tenant.tenant_id).catch(console.error);
    }
}, 15 * 60 * 1000);
exports.default = app;
