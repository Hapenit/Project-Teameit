"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleProviderAdapter = exports.GoogleProviderError = void 0;
const supabase_1 = require("../../../config/supabase");
const credentials_1 = require("../../../security/credentials");
class GoogleProviderError extends Error {
    provider;
    status;
    constructor(provider, status, message) {
        super(`${provider}: ${message}`);
        this.provider = provider;
        this.status = status;
        this.name = 'GoogleProviderError';
    }
}
exports.GoogleProviderError = GoogleProviderError;
/** Server-side Google API adapter. Access and refresh tokens never leave this module. */
class GoogleProviderAdapter {
    static async credentials(tenantId, provider) {
        const { data, error } = await supabase_1.supabaseAdmin.from('integrations')
            .select('id, integration_credentials(access_token, refresh_token, expires_at, external_account_id, metadata)')
            .eq('tenant_id', tenantId).eq('provider', provider).eq('status', 'active').maybeSingle();
        if (error)
            throw new GoogleProviderError(provider, 500, 'Unable to load connection');
        const credentials = data?.integration_credentials?.[0];
        if (!credentials?.access_token)
            throw new GoogleProviderError(provider, 412, 'Provider is not connected');
        return { ...credentials, access_token: (0, credentials_1.decryptSecret)(credentials.access_token), refresh_token: (0, credentials_1.decryptSecret)(credentials.refresh_token) };
    }
    static async request(provider, url, token, init = {}) {
        const response = await fetch(url, {
            ...init,
            headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) }
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = body?.error?.message || body?.error_description || response.statusText;
            throw new GoogleProviderError(provider, response.status, message);
        }
        return body;
    }
    static async ads(tenantId, customerId) {
        const c = await this.credentials(tenantId, 'google_ads');
        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (!developerToken)
            throw new GoogleProviderError('google_ads', 503, 'GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
        return this.request('google_ads', `https://googleads.googleapis.com/v19/customers/${encodeURIComponent(customerId)}/googleAds:searchStream`, c.access_token, {
            method: 'POST', headers: { 'developer-token': developerToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'SELECT campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, segments.date FROM campaign WHERE segments.date DURING LAST_30_DAYS' })
        });
    }
    static async analytics(tenantId, propertyId, startDate, endDate) {
        const c = await this.credentials(tenantId, 'google_analytics');
        return this.request('google_analytics', `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, c.access_token, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dateRanges: [{ startDate, endDate }], dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'totalUsers' }] })
        });
    }
    static async searchConsole(tenantId, siteUrl, startDate, endDate) {
        const c = await this.credentials(tenantId, 'google_search_console');
        return this.request('google_search_console', `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, c.access_token, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate, endDate, dimensions: ['date'], rowLimit: 1000 })
        });
    }
    static async list(tenantId, provider) {
        const c = await this.credentials(tenantId, provider);
        const urls = {
            google_ads: 'https://googleads.googleapis.com/v19/customers:listAccessibleCustomers',
            google_analytics: 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
            google_search_console: 'https://www.googleapis.com/webmasters/v3/sites',
            google_business: 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
            google_adsense: 'https://adsense.googleapis.com/v2/accounts',
            youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true'
        };
        return this.request(provider, urls[provider], c.access_token, provider === 'google_ads' ? { headers: { 'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '' } } : {});
    }
    static async adsQuery(tenantId, customerId, query) {
        const c = await this.credentials(tenantId, 'google_ads');
        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (!developerToken)
            throw new GoogleProviderError('google_ads', 503, 'GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
        return this.request('google_ads', `https://googleads.googleapis.com/v19/customers/${encodeURIComponent(customerId)}/googleAds:searchStream`, c.access_token, {
            method: 'POST', headers: { 'developer-token': developerToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ query })
        });
    }
    static async adsMutate(tenantId, customerId, operations, partialFailure = false) {
        const c = await this.credentials(tenantId, 'google_ads');
        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (!developerToken)
            throw new GoogleProviderError('google_ads', 503, 'GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
        return this.request('google_ads', `https://googleads.googleapis.com/v19/customers/${encodeURIComponent(customerId)}/googleAds:mutate`, c.access_token, {
            method: 'POST',
            headers: { 'developer-token': developerToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mutateOperations: operations, partialFailure })
        });
    }
    static async youtube(tenantId, path, init = {}) {
        const c = await this.credentials(tenantId, 'youtube');
        return this.request('youtube', `https://www.googleapis.com/youtube/v3/${path}`, c.access_token, init);
    }
    static async youtubeAnalytics(tenantId, params) {
        const c = await this.credentials(tenantId, 'youtube');
        const query = new URLSearchParams(params);
        return this.request('youtube', `https://youtubeanalytics.googleapis.com/v2/reports?${query}`, c.access_token);
    }
    static async youtubeUploadInit(tenantId, metadata) {
        const c = await this.credentials(tenantId, 'youtube');
        const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
            method: 'POST', headers: { Authorization: `Bearer ${c.access_token}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/*' }, body: JSON.stringify(metadata)
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new GoogleProviderError('youtube', response.status, body.error?.message || response.statusText);
        }
        const uploadUrl = response.headers.get('location');
        if (!uploadUrl)
            throw new GoogleProviderError('youtube', 502, 'YouTube did not return a resumable upload URL');
        return { uploadUrl, instructions: 'Upload video bytes to this URL with the resumable upload protocol.', source: 'youtube_api' };
    }
    static async business(tenantId, path, init = {}) {
        const c = await this.credentials(tenantId, 'google_business');
        // Locations/media use Business Information v1; posts and reviews use the
        // legacy Business Profile v4 endpoint.
        const base = /(^|\/)(reviews|localPosts)(\/|$)/.test(path)
            ? 'https://mybusiness.googleapis.com/v4'
            : 'https://mybusinessbusinessinformation.googleapis.com/v1';
        return this.request('google_business', `${base}/${path}`, c.access_token, init);
    }
    static async adsenseReport(tenantId, account, startDate, endDate) {
        const c = await this.credentials(tenantId, 'google_adsense');
        return this.request('google_adsense', `https://adsense.googleapis.com/v2/${account}/reports:generate?startDate.year=${startDate.slice(0, 4)}&startDate.month=${Number(startDate.slice(5, 7))}&startDate.day=${Number(startDate.slice(8, 10))}&endDate.year=${endDate.slice(0, 4)}&endDate.month=${Number(endDate.slice(5, 7))}&endDate.day=${Number(endDate.slice(8, 10))}&dimensions=DATE&metrics=ESTIMATED_EARNINGS,IMPRESSIONS,CLICKS`, c.access_token);
    }
    static async searchConsoleReport(tenantId, siteUrl, startDate, endDate, dimensions) {
        const c = await this.credentials(tenantId, 'google_search_console');
        return this.request('google_search_console', `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, c.access_token, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 25000 })
        });
    }
}
exports.GoogleProviderAdapter = GoogleProviderAdapter;
