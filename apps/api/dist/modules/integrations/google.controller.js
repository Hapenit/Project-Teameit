"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchConsoleFullReport = exports.adsenseReport = exports.businessApi = exports.youtubeAnalyticsReport = exports.youtubeUploadInit = exports.youtubeApi = exports.googleAdsMutate = exports.googleAdsQuery = exports.googleSearchReport = exports.googleAnalyticsReport = exports.listGoogleResources = void 0;
const google_provider_1 = require("./providers/google.provider");
const providers = ['google_ads', 'google_analytics', 'google_search_console', 'google_business', 'google_adsense', 'youtube'];
const providerError = (res, error) => {
    const e = error instanceof google_provider_1.GoogleProviderError ? error : null;
    return res.status(e?.status || 500).json({ success: false, error: { code: e ? 'GOOGLE_PROVIDER_ERROR' : 'INTERNAL_ERROR', provider: e?.provider, message: error.message } });
};
const listGoogleResources = async (req, res) => {
    try {
        const provider = req.params.provider;
        if (!providers.includes(provider))
            return res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_PROVIDER', message: 'Unsupported Google provider' } });
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.list((req.tenantId || req.headers['x-tenant-id']), provider) });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.listGoogleResources = listGoogleResources;
const googleAnalyticsReport = async (req, res) => {
    try {
        const { propertyId, startDate, endDate } = req.body;
        if (!propertyId || !startDate || !endDate)
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'propertyId, startDate and endDate are required' } });
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.analytics((req.tenantId || req.headers['x-tenant-id']), propertyId, startDate, endDate) });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.googleAnalyticsReport = googleAnalyticsReport;
const googleSearchReport = async (req, res) => {
    try {
        const { siteUrl, startDate, endDate } = req.body;
        if (!siteUrl || !startDate || !endDate)
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'siteUrl, startDate and endDate are required' } });
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.searchConsole((req.tenantId || req.headers['x-tenant-id']), siteUrl, startDate, endDate) });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.googleSearchReport = googleSearchReport;
const tenant = (req) => (req.tenantId || req.headers['x-tenant-id']);
const googleAdsQuery = async (req, res) => {
    try {
        const { customerId, query } = req.body;
        if (!customerId || !query || !/^SELECT\s/i.test(query))
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'customerId and a read-only Google Ads SELECT query are required' } });
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.adsQuery(tenant(req), customerId, query), source: 'google_ads_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.googleAdsQuery = googleAdsQuery;
const googleAdsMutate = async (req, res) => {
    try {
        const { customerId, operations, partialFailure = false } = req.body || {};
        if (!/^\d{6,}$/.test(String(customerId || '')) || !Array.isArray(operations) || operations.length === 0 || operations.length > 1000) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'customerId and 1-1000 mutate operations are required' } });
        }
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.adsMutate(tenant(req), String(customerId), operations, Boolean(partialFailure)), source: 'google_ads_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.googleAdsMutate = googleAdsMutate;
const youtubeApi = async (req, res) => {
    try {
        const path = req.params[0];
        if (!path || /(^|\/)\.\.?($|\/)/.test(path))
            return res.status(400).json({ success: false, error: { code: 'INVALID_PATH', message: 'Invalid YouTube resource path' } });
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.youtube(tenant(req), path, { method: req.method, headers: { 'Content-Type': 'application/json' }, body: req.method === 'GET' ? undefined : JSON.stringify(req.body) }), source: 'youtube_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.youtubeApi = youtubeApi;
const youtubeUploadInit = async (req, res) => {
    try {
        if (!req.body?.snippet?.title || !req.body?.status?.privacyStatus)
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'snippet.title and status.privacyStatus are required' } });
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.youtubeUploadInit(tenant(req), req.body), source: 'youtube_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.youtubeUploadInit = youtubeUploadInit;
const youtubeAnalyticsReport = async (req, res) => {
    try {
        const params = req.body || {};
        if (!params.ids || !params.startDate || !params.endDate || !params.metrics) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'ids, startDate, endDate and metrics are required' } });
        }
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.youtubeAnalytics(tenant(req), Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))), source: 'youtube_analytics_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.youtubeAnalyticsReport = youtubeAnalyticsReport;
const businessApi = async (req, res) => {
    try {
        const path = req.params[0];
        if (!path || /(^|\/)\.\.?($|\/)/.test(path) || !/^[a-zA-Z0-9_./-]+$/.test(path)) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_PATH', message: 'Invalid Business Profile resource path' } });
        }
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.business(tenant(req), path, { method: req.method, headers: { 'Content-Type': 'application/json' }, body: req.method === 'GET' ? undefined : JSON.stringify(req.body) }), source: 'google_business_profile_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.businessApi = businessApi;
const adsenseReport = async (req, res) => {
    try {
        const { account, startDate, endDate } = req.body;
        if (!account || !startDate || !endDate)
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'account, startDate and endDate are required' } });
        return res.json({ success: true, data: await google_provider_1.GoogleProviderAdapter.adsenseReport(tenant(req), account, startDate, endDate), source: 'adsense_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.adsenseReport = adsenseReport;
const searchConsoleFullReport = async (req, res) => {
    try {
        const { siteUrl, startDate, endDate, dimensions = ['date', 'query', 'page', 'country', 'device'] } = req.body;
        if (!siteUrl || !startDate || !endDate || !Array.isArray(dimensions))
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'siteUrl, dates and dimensions are required' } });
        const report = await google_provider_1.GoogleProviderAdapter.searchConsoleReport(tenant(req), siteUrl, startDate, endDate, dimensions);
        const rows = report.rows || [];
        const opportunities = rows.filter((r) => Number(r.position) > 4 && Number(r.position) < 20 && Number(r.ctr) < 0.05);
        const derived = {
            opportunities: opportunities.length,
            lowCtrQueries: opportunities.slice(0, 100),
            quickWins: opportunities.filter((r) => Number(r.position) <= 10).length,
            note: 'Derived heuristics from first-party Search Console rows; not Google-provided.'
        };
        return res.json({ success: true, data: report, derived, source: 'search_console_api' });
    }
    catch (e) {
        return providerError(res, e);
    }
};
exports.searchConsoleFullReport = searchConsoleFullReport;
