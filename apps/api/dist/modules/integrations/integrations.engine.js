"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationEngine = void 0;
const supabase_1 = require("../../config/supabase");
const credentials_1 = require("../../security/credentials");
const google_provider_1 = require("./providers/google.provider");
const meta_ads_provider_1 = require("../providers/meta/meta-ads.provider");
class IntegrationEngine {
    static async syncMetaAds(tenantId) {
        const accounts = await meta_ads_provider_1.MetaAdsProvider.listAdAccounts(tenantId);
        const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const until = new Date().toISOString().slice(0, 10);
        let synced = 0;
        for (const account of accounts) {
            const result = await meta_ads_provider_1.MetaAdsProvider.insights(tenantId, account.id, since, until);
            for (const row of result.data || []) {
                const conversions = (row.actions || [])
                    .filter((a) => ['purchase', 'lead', 'complete_registration'].includes(a.action_type))
                    .reduce((sum, a) => sum + Number(a.value || 0), 0);
                const { error } = await supabase_1.supabaseAdmin.from('ad_metrics').upsert({
                    tenant_id: tenantId, provider: 'meta_ads', date: row.date_start,
                    spend: Number(row.spend || 0), impressions: Number(row.impressions || 0),
                    clicks: Number(row.clicks || 0), conversions
                }, { onConflict: 'tenant_id,provider,date' });
                if (error)
                    throw new Error(`Meta Ads metrics storage failed: ${error.message}`);
                synced++;
            }
        }
        return { synced, skipped: false, accounts: accounts.length };
    }
    /** Scheduled, opt-in Google Ads sync. Missing configuration is reported, never fabricated. */
    static async syncGoogleAds(tenantId) {
        const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
        if (!customerId)
            return { synced: 0, skipped: true, reason: 'GOOGLE_ADS_CUSTOMER_ID is not configured' };
        const result = await google_provider_1.GoogleProviderAdapter.ads(tenantId, customerId);
        const rows = (Array.isArray(result) ? result : [result]).flatMap((batch) => batch.results || []);
        let synced = 0;
        for (const row of rows) {
            const metrics = row.metrics || {};
            const date = row.segments?.date;
            if (!date)
                continue;
            const { error } = await supabase_1.supabaseAdmin.from('ad_metrics').upsert({
                tenant_id: tenantId, provider: 'google_ads', date,
                spend: Number(metrics.costMicros || 0) / 1_000_000,
                impressions: Number(metrics.impressions || 0), clicks: Number(metrics.clicks || 0),
                conversions: Number(metrics.conversions || 0)
            }, { onConflict: 'tenant_id,provider,date' });
            if (error)
                throw new Error(`Google Ads metrics storage failed: ${error.message}`);
            synced++;
        }
        return { synced, skipped: false };
    }
    /**
     * Pulls provider analytics when explicitly configured. No synthetic metrics
     * are written; an absent account/configuration is a safe no-op.
     */
    static async syncAnalytics(tenantId, provider, since, until) {
        const credentials = await this.getCredentials(tenantId, provider);
        if (!credentials?.access_token)
            return { synced: 0, skipped: true };
        let rows = [];
        if (provider === 'meta' || provider === 'facebook') {
            const accountId = process.env.META_AD_ACCOUNT_ID;
            if (!accountId)
                return { synced: 0, skipped: true };
            const version = process.env.META_GRAPH_API_VERSION || 'v21.0';
            const url = `https://graph.facebook.com/${version}/act_${accountId}/insights?fields=date_start,spend,impressions,clicks,actions&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}&time_increment=1&access_token=${encodeURIComponent(credentials.access_token)}`;
            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok || data.error)
                throw new Error(`Meta analytics sync failed: ${data.error?.message || response.statusText}`);
            rows = data.data || [];
        }
        else {
            return { synced: 0, skipped: true };
        }
        let synced = 0;
        for (const row of rows) {
            const conversions = (row.actions || []).filter((a) => ['purchase', 'lead', 'complete_registration'].includes(a.action_type)).reduce((sum, a) => sum + Number(a.value || 0), 0);
            const { error } = await supabase_1.supabaseAdmin.from('ad_metrics').upsert({
                tenant_id: tenantId, provider, date: row.date_start, spend: Number(row.spend || 0),
                impressions: Number(row.impressions || 0), clicks: Number(row.clicks || 0), conversions
            }, { onConflict: 'tenant_id,provider,date' });
            if (error)
                throw new Error(`Failed to store analytics: ${error.message}`);
            synced++;
        }
        return { synced, skipped: false };
    }
    /**
     * Processes an incoming webhook idempotently.
     * If a webhook with the same externalId was already received, it skips processing.
     */
    static async handleWebhook(data, processor) {
        const { provider, eventType, externalId, payload } = data;
        // 1. Idempotency Check & Logging
        const { data: event, error: insertError } = await supabase_1.supabaseAdmin
            .from('webhook_events')
            .insert({
            tenant_id: data.tenantId || null,
            provider,
            event_type: eventType,
            external_id: externalId,
            payload,
            status: 'pending'
        })
            .select()
            .single();
        if (insertError) {
            if (insertError.code === '23505') {
                // Unique constraint violation: Event already processed/pending. Safely ignore.
                console.log(`[IntegrationEngine] Webhook ${externalId} already received. Skipping.`);
                return { success: true, duplicate: true };
            }
            throw new Error(`Failed to log webhook event: ${insertError.message}`);
        }
        // 2. Process the event using the provided business logic (e.g., WhatsApp provider logic)
        try {
            await processor(payload);
            // 3. Mark as processed
            await supabase_1.supabaseAdmin
                .from('webhook_events')
                .update({ status: 'processed', processed_at: new Date().toISOString() })
                .eq('id', event.id);
            return { success: true };
        }
        catch (error) {
            // 4. Mark as failed
            await supabase_1.supabaseAdmin
                .from('webhook_events')
                .update({ status: 'failed', error_log: error.message })
                .eq('id', event.id);
            throw error;
        }
    }
    /**
     * Retrieves active credentials for a specific tenant and provider
     */
    static async getCredentials(tenantId, provider) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('integrations')
            .select(`
        id, status,
        integration_credentials(access_token, refresh_token, external_account_id)
      `)
            .eq('tenant_id', tenantId)
            .eq('provider', provider)
            .eq('status', 'active')
            .single();
        if (error || !data)
            return null;
        const credentials = data.integration_credentials[0];
        return { ...credentials, access_token: (0, credentials_1.decryptSecret)(credentials.access_token), refresh_token: (0, credentials_1.decryptSecret)(credentials.refresh_token) };
    }
}
exports.IntegrationEngine = IntegrationEngine;
