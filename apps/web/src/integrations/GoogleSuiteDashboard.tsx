import { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

export default function GoogleSuiteDashboard() {
  const { session } = useAuth(); const { activeTenant } = useTenant();
  const [section, setSection] = useState('search-console'); const [result, setResult] = useState<any>(null); const [error, setError] = useState('');
  const [form, setForm] = useState({ siteUrl: '', account: '', customerId: '', query: 'SELECT campaign.id, campaign.name, ad_group.id, ad_group_ad.ad.id, metrics.impressions, metrics.clicks, metrics.cost_micros FROM ad_group_ad LIMIT 100', startDate: '2026-01-01', endDate: '2026-01-31', youtubeVideoId: '', businessPath: 'accounts' });
  const call = async () => {
    setError(''); setResult(null);
    const paths: Record<string, string> = { 'search-console': '/api/v1/google/search-console/full-report', adsense: '/api/v1/google/adsense/report', ads: '/api/v1/google/ads/query', youtube: '/api/v1/google/youtube/analytics/report', business: `/api/v1/google/business/${form.businessPath}` };
    const body = section === 'ads' ? { customerId: form.customerId, query: form.query } : section === 'adsense' ? { account: form.account, startDate: form.startDate, endDate: form.endDate } : section === 'youtube' ? { ids: 'channel==MINE', startDate: form.startDate, endDate: form.endDate, metrics: 'views,estimatedMinutesWatched,averageViewDuration' } : section === 'business' ? {} : { siteUrl: form.siteUrl, startDate: form.startDate, endDate: form.endDate };
    try {
      const method = section === 'business' ? 'GET' : 'POST';
      const r = await fetch(`${API_BASE_URL}${paths[section]}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenant?.id || '' }, body: method === 'GET' ? undefined : JSON.stringify(body) });
      const json = await r.json(); if (!r.ok || !json.success) throw new Error(json.error?.message || 'Provider request failed'); setResult(json);
    } catch (e: any) { setError(e.message); }
  };
  return <div className="max-w-6xl mx-auto p-6 space-y-5">
    <h1 className="text-2xl font-bold">Google suite intelligence</h1>
    <p className="text-sm text-gray-500">Reports are fetched from first-party Google APIs. Derived SEO opportunities are explicitly labelled and are not Google recommendations.</p>
    <div className="flex gap-2 flex-wrap">{[['search-console','Search Console SEO'],['ads','Ads campaign/ad/ad-group'],['adsense','AdSense earnings'],['youtube','YouTube analytics'],['business','Business Profile']].map(([id,label]) => <button key={id} onClick={() => setSection(id)} className={`px-3 py-2 rounded border ${section===id?'bg-primary text-white':''}`}>{label}</button>)}</div>
    <div className="bg-white border rounded-xl p-5 space-y-3">
      {section === 'search-console' && <input className="border rounded p-2 w-full" placeholder="Verified site URL" value={form.siteUrl} onChange={e=>setForm({...form,siteUrl:e.target.value})}/>}
      {section === 'adsense' && <input className="border rounded p-2 w-full" placeholder="accounts/pub-..." value={form.account} onChange={e=>setForm({...form,account:e.target.value})}/>}
      {section === 'ads' && <><input className="border rounded p-2 w-full" placeholder="Customer ID (digits)" value={form.customerId} onChange={e=>setForm({...form,customerId:e.target.value})}/><textarea className="border rounded p-2 w-full h-24 font-mono text-xs" value={form.query} onChange={e=>setForm({...form,query:e.target.value})}/></>}
      {section === 'business' && <input className="border rounded p-2 w-full" placeholder="Resource path (e.g. accounts)" value={form.businessPath} onChange={e=>setForm({...form,businessPath:e.target.value})}/>}
      {section !== 'ads' && section !== 'business' && <div className="flex gap-2"><input className="border rounded p-2" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/><input className="border rounded p-2" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></div>}
      <button onClick={call} className="bg-primary text-white px-4 py-2 rounded">Fetch live report</button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
    {result && <pre className="bg-slate-950 text-green-200 p-4 rounded-xl overflow-auto max-h-[32rem] text-xs">{JSON.stringify(result,null,2)}</pre>}
  </div>;
}
