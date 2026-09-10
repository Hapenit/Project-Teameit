"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaAdsProvider = exports.MetaAdsProviderError = void 0;
const supabase_1 = require("../../../config/supabase");
class MetaAdsProviderError extends Error {
    status;
    code;
    constructor(status, message, code) {
        super(`meta_ads: ${message}`);
        this.status = status;
        this.code = code;
        this.name = 'MetaAdsProviderError';
    }
}
exports.MetaAdsProviderError = MetaAdsProviderError;
/** Server-side adapter for the Meta Marketing API. Tokens never leave this module. */
class MetaAdsProvider {
    static version = () => process.env.META_GRAPH_API_VERSION || 'v21.0';
    static async credentials(tenantId) {
        const { data, error } = await supabase_1.supabaseAdmin.from('integrations')
            .select('id, integration_credentials(access_token, expires_at, external_account_id, metadata)')
            .eq('tenant_id', tenantId).in('provider', ['meta_ads', 'meta']).eq('status', 'active')
            .order('provider', { ascending: true }).limit(1).maybeSingle();
        if (error)
            throw new MetaAdsProviderError(500, 'Unable to load connection');
        const credentials = data?.integration_credentials?.[0];
        if (!credentials?.access_token)
            throw new MetaAdsProviderError(412, 'Meta Ads is not connected');
        return credentials;
    }
    static async request(url, token, init = {}) {
        const response = await fetch(url, {
            ...init,
            headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
            const error = body.error;
            throw new MetaAdsProviderError(response.status || 502, error?.message || response.statusText || 'Meta API request failed', error?.code);
        }
        return body;
    }
    static url(path, params = {}) {
        const query = new URLSearchParams(params);
        return `https://graph.facebook.com/${this.version()}${path}${query.toString() ? `?${query}` : ''}`;
    }
    static async listAdAccounts(tenantId) {
        const c = await this.credentials(tenantId);
        const accounts = [];
        let next = this.url('/me/adaccounts', { fields: 'id,account_id,name,account_status,currency,timezone_name,business', limit: '100', access_token: c.access_token });
        while (next) {
            const page = await this.request(next, c.access_token);
            accounts.push(...(page.data || []));
            next = page.paging?.next;
        }
        for (const account of accounts) {
            const { error } = await supabase_1.supabaseAdmin.from('meta_ad_accounts').upsert({
                tenant_id: tenantId, external_id: account.id, account_id: account.account_id,
                name: account.name || account.account_id, status: String(account.account_status ?? 'unknown'),
                currency: account.currency, timezone: account.timezone_name, metadata: account
            }, { onConflict: 'tenant_id,external_id' });
            if (error)
                throw new MetaAdsProviderError(500, `Failed to store ad account: ${error.message}`);
        }
        return accounts;
    }
    static accountPath(accountId) {
        if (!/^(act_)?[0-9]+$/.test(accountId))
            throw new MetaAdsProviderError(400, 'Invalid ad account id');
        return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    }
    static async accountRequest(tenantId, accountId, path, params = {}, init = {}) {
        const c = await this.credentials(tenantId);
        const account = this.accountPath(accountId);
        const { data, error } = await supabase_1.supabaseAdmin.from('meta_ad_accounts').select('id').eq('tenant_id', tenantId).eq('external_id', account).maybeSingle();
        if (error)
            throw new MetaAdsProviderError(500, 'Unable to validate ad account');
        if (!data)
            throw new MetaAdsProviderError(403, 'Ad account is not connected to this tenant; discover accounts first');
        return this.request(this.url(`/${account}/${path}`, { ...params, access_token: c.access_token }), c.access_token, init);
    }
    static campaigns(tenantId, accountId) { return this.accountRequest(tenantId, accountId, 'campaigns', { fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,updated_time', limit: '100' }); }
    static adsets(tenantId, accountId) { return this.accountRequest(tenantId, accountId, 'adsets', { fields: 'id,campaign_id,name,status,effective_status,daily_budget,lifetime_budget,targeting,billing_event,optimization_goal', limit: '100' }); }
    static ads(tenantId, accountId) { return this.accountRequest(tenantId, accountId, 'ads', { fields: 'id,adset_id,campaign_id,name,status,effective_status,creative', limit: '100' }); }
    static creatives(tenantId, accountId) { return this.accountRequest(tenantId, accountId, 'adcreatives', { fields: 'id,name,object_story_spec,asset_feed_spec,thumbnail_url,status', limit: '100' }); }
    static create(tenantId, accountId, resource, payload) {
        return this.accountRequest(tenantId, accountId, resource === 'creatives' ? 'adcreatives' : resource, {}, { method: 'POST', body: JSON.stringify(payload) });
    }
    static update(tenantId, accountId, resourceId, payload) {
        if (!/^[0-9]+$/.test(resourceId))
            throw new MetaAdsProviderError(400, 'Invalid resource id');
        return this.accountRequest(tenantId, accountId, resourceId, {}, { method: 'POST', body: JSON.stringify(payload) });
    }
    static insights(tenantId, accountId, since, until) {
        return this.accountRequest(tenantId, accountId, 'insights', {
            fields: 'date_start,spend,impressions,clicks,actions,campaign_id,campaign_name',
            time_range: JSON.stringify({ since, until }), time_increment: '1', limit: '100'
        });
    }
}
exports.MetaAdsProvider = MetaAdsProvider;
