import { Request, Response } from 'express';
import { GoogleProviderAdapter, GoogleProvider, GoogleProviderError } from './providers/google.provider';

const providers: GoogleProvider[] = ['google_ads', 'google_analytics', 'google_search_console', 'google_business', 'google_adsense', 'youtube'];
const providerError = (res: Response, error: any) => {
  const e = error instanceof GoogleProviderError ? error : null;
  return res.status(e?.status || 500).json({ success: false, error: { code: e ? 'GOOGLE_PROVIDER_ERROR' : 'INTERNAL_ERROR', provider: e?.provider, message: error.message } });
};

export const listGoogleResources = async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as GoogleProvider;
    if (!providers.includes(provider)) return res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_PROVIDER', message: 'Unsupported Google provider' } });
    return res.json({ success: true, data: await GoogleProviderAdapter.list(((req as any).tenantId || req.headers['x-tenant-id']) as string, provider) });
  } catch (e) { return providerError(res, e); }
};

export const googleAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const { propertyId, startDate, endDate } = req.body;
    if (!propertyId || !startDate || !endDate) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'propertyId, startDate and endDate are required' } });
    return res.json({ success: true, data: await GoogleProviderAdapter.analytics(((req as any).tenantId || req.headers['x-tenant-id']) as string, propertyId, startDate, endDate) });
  } catch (e) { return providerError(res, e); }
};

export const googleSearchReport = async (req: Request, res: Response) => {
  try {
    const { siteUrl, startDate, endDate } = req.body;
    if (!siteUrl || !startDate || !endDate) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'siteUrl, startDate and endDate are required' } });
    return res.json({ success: true, data: await GoogleProviderAdapter.searchConsole(((req as any).tenantId || req.headers['x-tenant-id']) as string, siteUrl, startDate, endDate) });
  } catch (e) { return providerError(res, e); }
};

const tenant = (req: Request) => ((req as any).tenantId || req.headers['x-tenant-id']) as string;
export const googleAdsQuery = async (req: Request, res: Response) => {
  try {
    const { customerId, query } = req.body;
    if (!customerId || !query || !/^SELECT\s/i.test(query)) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'customerId and a read-only Google Ads SELECT query are required' } });
    return res.json({ success: true, data: await GoogleProviderAdapter.adsQuery(tenant(req), customerId, query), source: 'google_ads_api' });
  } catch (e) { return providerError(res, e); }
};
export const googleAdsMutate = async (req: Request, res: Response) => {
  try {
    const { customerId, operations, partialFailure = false } = req.body || {};
    if (!/^\d{6,}$/.test(String(customerId || '')) || !Array.isArray(operations) || operations.length === 0 || operations.length > 1000) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'customerId and 1-1000 mutate operations are required' } });
    }
    return res.json({ success: true, data: await GoogleProviderAdapter.adsMutate(tenant(req), String(customerId), operations, Boolean(partialFailure)), source: 'google_ads_api' });
  } catch (e) { return providerError(res, e); }
};
export const youtubeApi = async (req: Request, res: Response) => {
  try {
    const path = req.params[0];
    if (!path || /(^|\/)\.\.?($|\/)/.test(path)) return res.status(400).json({ success: false, error: { code: 'INVALID_PATH', message: 'Invalid YouTube resource path' } });
    return res.json({ success: true, data: await GoogleProviderAdapter.youtube(tenant(req), path, { method: req.method, headers: { 'Content-Type': 'application/json' }, body: req.method === 'GET' ? undefined : JSON.stringify(req.body) }), source: 'youtube_api' });
  } catch (e) { return providerError(res, e); }
};
export const youtubeUploadInit = async (req: Request, res: Response) => {
  try {
    if (!req.body?.snippet?.title || !req.body?.status?.privacyStatus) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'snippet.title and status.privacyStatus are required' } });
    return res.json({ success: true, data: await GoogleProviderAdapter.youtubeUploadInit(tenant(req), req.body), source: 'youtube_api' });
  } catch (e) { return providerError(res, e); }
};
export const youtubeAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const params = req.body || {};
    if (!params.ids || !params.startDate || !params.endDate || !params.metrics) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'ids, startDate, endDate and metrics are required' } });
    }
    return res.json({ success: true, data: await GoogleProviderAdapter.youtubeAnalytics(tenant(req), Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))), source: 'youtube_analytics_api' });
  } catch (e) { return providerError(res, e); }
};
export const businessApi = async (req: Request, res: Response) => {
  try {
    const path = req.params[0];
    if (!path || /(^|\/)\.\.?($|\/)/.test(path) || !/^[a-zA-Z0-9_./-]+$/.test(path)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PATH', message: 'Invalid Business Profile resource path' } });
    }
    return res.json({ success: true, data: await GoogleProviderAdapter.business(tenant(req), path, { method: req.method, headers: { 'Content-Type': 'application/json' }, body: req.method === 'GET' ? undefined : JSON.stringify(req.body) }), source: 'google_business_profile_api' });
  } catch (e) { return providerError(res, e); }
};
export const adsenseReport = async (req: Request, res: Response) => {
  try {
    const { account, startDate, endDate } = req.body;
    if (!account || !startDate || !endDate) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'account, startDate and endDate are required' } });
    return res.json({ success: true, data: await GoogleProviderAdapter.adsenseReport(tenant(req), account, startDate, endDate), source: 'adsense_api' });
  } catch (e) { return providerError(res, e); }
};
export const searchConsoleFullReport = async (req: Request, res: Response) => {
  try {
    const { siteUrl, startDate, endDate, dimensions = ['date', 'query', 'page', 'country', 'device'] } = req.body;
    if (!siteUrl || !startDate || !endDate || !Array.isArray(dimensions)) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'siteUrl, dates and dimensions are required' } });
    const report: any = await GoogleProviderAdapter.searchConsoleReport(tenant(req), siteUrl, startDate, endDate, dimensions);
    const rows = report.rows || [];
    const opportunities = rows.filter((r: any) => Number(r.position) > 4 && Number(r.position) < 20 && Number(r.ctr) < 0.05);
    const derived = {
      opportunities: opportunities.length,
      lowCtrQueries: opportunities.slice(0, 100),
      quickWins: opportunities.filter((r: any) => Number(r.position) <= 10).length,
      note: 'Derived heuristics from first-party Search Console rows; not Google-provided.'
    };
    return res.json({ success: true, data: report, derived, source: 'search_console_api' });
  } catch (e) { return providerError(res, e); }
};
