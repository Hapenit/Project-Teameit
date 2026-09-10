"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaInsights = exports.updateMetaResource = exports.createMetaResource = exports.metaResources = exports.metaAccounts = exports.getMetrics = void 0;
const supabase_1 = require("../../config/supabase");
const meta_ads_provider_1 = require("../providers/meta/meta-ads.provider");
const getMetrics = async (req, res) => {
    try {
        const tenantId = (req.tenantId || req.headers['x-tenant-id']);
        if (!tenantId) {
            return res.status(400).json({ success: false, error: { message: 'x-tenant-id header is required' } });
        }
        // 1. Check if Google Ads integration is connected
        const { data: integration, error: intError } = await supabase_1.supabaseAdmin
            .from('integrations')
            .select('id, status')
            .eq('tenant_id', tenantId)
            .eq('provider', 'meta_ads')
            .eq('status', 'active')
            .single();
        if (intError || !integration) {
            return res.status(404).json({
                success: false,
                error: { message: 'Meta Ads is not connected. Connect Meta Ads in Integrations.' }
            });
        }
        // 2. Fetch real metrics from database (synced from Google Ads API)
        const { data: metrics, error: metError } = await supabase_1.supabaseAdmin
            .from('ad_metrics')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('provider', 'meta_ads')
            .order('date', { ascending: false })
            .limit(30);
        if (metError)
            throw metError;
        // 3. Return real data only. If empty, indicate sync is needed.
        return res.status(200).json({
            success: true,
            data: metrics || [],
            meta: {
                total: metrics?.length || 0,
                note: metrics?.length === 0
                    ? 'No metrics synced yet. Sync will run automatically. Check back shortly.'
                    : undefined
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
};
exports.getMetrics = getMetrics;
const tenant = (req) => {
    const id = (req.tenantId || req.headers['x-tenant-id']);
    if (!id)
        throw new meta_ads_provider_1.MetaAdsProviderError(400, 'x-tenant-id header is required');
    return id;
};
const metaAccounts = async (req, res) => {
    try {
        return res.json({ success: true, data: await meta_ads_provider_1.MetaAdsProvider.listAdAccounts(tenant(req)) });
    }
    catch (error) {
        const status = error instanceof meta_ads_provider_1.MetaAdsProviderError ? error.status : 502;
        return res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
};
exports.metaAccounts = metaAccounts;
const metaResources = async (req, res) => {
    try {
        const id = tenant(req);
        const { accountId, resource } = req.params;
        const loaders = {
            campaigns: () => meta_ads_provider_1.MetaAdsProvider.campaigns(id, accountId),
            adsets: () => meta_ads_provider_1.MetaAdsProvider.adsets(id, accountId),
            ads: () => meta_ads_provider_1.MetaAdsProvider.ads(id, accountId),
            creatives: () => meta_ads_provider_1.MetaAdsProvider.creatives(id, accountId)
        };
        if (!loaders[resource])
            throw new meta_ads_provider_1.MetaAdsProviderError(400, 'Unsupported Meta Ads resource');
        return res.json({ success: true, data: await loaders[resource]() });
    }
    catch (error) {
        const status = error instanceof meta_ads_provider_1.MetaAdsProviderError ? error.status : 502;
        return res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
};
exports.metaResources = metaResources;
const createMetaResource = async (req, res) => {
    try {
        const resource = req.params.resource;
        if (!['campaigns', 'adsets', 'ads', 'creatives'].includes(resource))
            throw new meta_ads_provider_1.MetaAdsProviderError(400, 'Unsupported Meta Ads resource');
        return res.status(201).json({ success: true, data: await meta_ads_provider_1.MetaAdsProvider.create(tenant(req), req.params.accountId, resource, req.body || {}) });
    }
    catch (error) {
        const status = error instanceof meta_ads_provider_1.MetaAdsProviderError ? error.status : 502;
        return res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
};
exports.createMetaResource = createMetaResource;
const updateMetaResource = async (req, res) => {
    try {
        return res.json({ success: true, data: await meta_ads_provider_1.MetaAdsProvider.update(tenant(req), req.params.accountId, req.params.resourceId, req.body || {}) });
    }
    catch (error) {
        const status = error instanceof meta_ads_provider_1.MetaAdsProviderError ? error.status : 502;
        return res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
};
exports.updateMetaResource = updateMetaResource;
const metaInsights = async (req, res) => {
    try {
        const since = typeof req.query.since === 'string' ? req.query.since : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const until = typeof req.query.until === 'string' ? req.query.until : new Date().toISOString().slice(0, 10);
        return res.json({ success: true, data: await meta_ads_provider_1.MetaAdsProvider.insights(tenant(req), req.params.accountId, since, until) });
    }
    catch (error) {
        const status = error instanceof meta_ads_provider_1.MetaAdsProviderError ? error.status : 502;
        return res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
};
exports.metaInsights = metaInsights;
