import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { MetaAdsProvider, MetaAdsProviderError, MetaAdsResource } from '../providers/meta/meta-ads.provider';

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const tenantId = (req.tenantId || req.headers['x-tenant-id']) as string;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: { message: 'x-tenant-id header is required' } });
    }

    // 1. Check if Google Ads integration is connected
    const { data: integration, error: intError } = await supabaseAdmin
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
    const { data: metrics, error: metError } = await supabaseAdmin
      .from('ad_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', 'meta_ads')
      .order('date', { ascending: false })
      .limit(30);

    if (metError) throw metError;

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
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

const tenant = (req: Request) => {
  const id = (req.tenantId || req.headers['x-tenant-id']) as string;
  if (!id) throw new MetaAdsProviderError(400, 'x-tenant-id header is required');
  return id;
};

export const metaAccounts = async (req: Request, res: Response) => {
  try { return res.json({ success: true, data: await MetaAdsProvider.listAdAccounts(tenant(req)) }); }
  catch (error: any) { const status = error instanceof MetaAdsProviderError ? error.status : 502; return res.status(status).json({ success: false, error: { message: error.message, code: error.code } }); }
};

export const metaResources = async (req: Request, res: Response) => {
  try {
    const id = tenant(req); const { accountId, resource } = req.params;
    const loaders: Record<string, () => Promise<any>> = {
      campaigns: () => MetaAdsProvider.campaigns(id, accountId),
      adsets: () => MetaAdsProvider.adsets(id, accountId),
      ads: () => MetaAdsProvider.ads(id, accountId),
      creatives: () => MetaAdsProvider.creatives(id, accountId)
    };
    if (!loaders[resource]) throw new MetaAdsProviderError(400, 'Unsupported Meta Ads resource');
    return res.json({ success: true, data: await loaders[resource]() });
  } catch (error: any) { const status = error instanceof MetaAdsProviderError ? error.status : 502; return res.status(status).json({ success: false, error: { message: error.message, code: error.code } }); }
};

export const createMetaResource = async (req: Request, res: Response) => {
  try {
    const resource = req.params.resource as MetaAdsResource;
    if (!['campaigns', 'adsets', 'ads', 'creatives'].includes(resource)) throw new MetaAdsProviderError(400, 'Unsupported Meta Ads resource');
    return res.status(201).json({ success: true, data: await MetaAdsProvider.create(tenant(req), req.params.accountId, resource, req.body || {}) });
  } catch (error: any) { const status = error instanceof MetaAdsProviderError ? error.status : 502; return res.status(status).json({ success: false, error: { message: error.message, code: error.code } }); }
};

export const updateMetaResource = async (req: Request, res: Response) => {
  try { return res.json({ success: true, data: await MetaAdsProvider.update(tenant(req), req.params.accountId, req.params.resourceId, req.body || {}) }); }
  catch (error: any) { const status = error instanceof MetaAdsProviderError ? error.status : 502; return res.status(status).json({ success: false, error: { message: error.message, code: error.code } }); }
};

export const metaInsights = async (req: Request, res: Response) => {
  try {
    const since = typeof req.query.since === 'string' ? req.query.since : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const until = typeof req.query.until === 'string' ? req.query.until : new Date().toISOString().slice(0, 10);
    return res.json({ success: true, data: await MetaAdsProvider.insights(tenant(req), req.params.accountId, since, until) });
  } catch (error: any) { const status = error instanceof MetaAdsProviderError ? error.status : 502; return res.status(status).json({ success: false, error: { message: error.message, code: error.code } }); }
};
