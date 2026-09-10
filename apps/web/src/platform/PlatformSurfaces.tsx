import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../config/api';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

type Tab = 'settings' | 'notifications' | 'reports' | 'audit' | 'billing';
export default function PlatformSurfaces({ initialTab = 'settings' }: { initialTab?: Tab }) {
  const { session } = useAuth(); const { activeTenant } = useTenant();
  const [tab, setTab] = useState<Tab>(initialTab); const [data, setData] = useState<any[]>([]); const [settings, setSettings] = useState('{}'); const [billing, setBilling] = useState<any>();
  const call = useCallback(async (path: string, options?: RequestInit) => {
    if (!session || !activeTenant) return null;
    const r = await apiRequest(`/api/v1/platform${path}`, options, session.access_token, activeTenant.id);
    return r.json();
  }, [session, activeTenant]);
  useEffect(() => { (async () => {
    if (tab === 'settings') { const j = await call('/settings'); setSettings(JSON.stringify(j?.data?.settings || {}, null, 2)); }
    else if (tab === 'billing') { const j = await call('/billing/status'); setBilling(j?.data); }
    else { const j = await call(`/${tab === 'audit' ? 'audit-logs' : tab}`); setData(j?.data || []); }
  })(); }, [tab, call]);
  const save = async () => { try { await call('/settings', { method: 'PUT', body: JSON.stringify({ settings: JSON.parse(settings) }) }); alert('Settings saved'); } catch { alert('Settings must be valid JSON'); } };
  return <div className="max-w-5xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold">Workspace administration</h1>
    <div className="flex flex-wrap gap-2 border-b pb-3">{(['settings','notifications','reports','audit','billing'] as Tab[]).map(t =>
      <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-gray-100'}`}>{t === 'audit' ? 'Audit logs' : t}</button>)}</div>
    {tab === 'settings' && <section className="space-y-3"><p className="text-gray-500">Tenant-scoped settings (JSON)</p><textarea className="w-full min-h-64 border rounded p-3 font-mono text-sm" value={settings} onChange={e => setSettings(e.target.value)} /><button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded">Save settings</button></section>}
    {tab === 'billing' && <section className="border rounded p-6"><h2 className="font-semibold mb-2">Billing</h2><p>{billing?.configured ? `Status: ${billing.status}` : 'Billing is not configured for this deployment.'}</p>{!billing?.configured && <p className="text-sm text-gray-500 mt-2">Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET on the API to enable Stripe integration.</p>}</section>}
    {tab === 'notifications' && <section className="space-y-2">{data.length ? data.map(n => <article key={n.id} className="border rounded p-4"><b>{n.title}</b><p>{n.body}</p><small>{new Date(n.created_at).toLocaleString()}</small></article>) : <p className="text-gray-500">No notifications.</p>}</section>}
    {tab === 'reports' && <section className="space-y-3"><button onClick={async () => { await call('/reports', { method: 'POST', body: JSON.stringify({ name: 'Analytics report', report_type: 'analytics' }) }); setTab('reports'); }} className="bg-primary text-primary-foreground px-4 py-2 rounded">Create report</button>{data.map(r => <article key={r.id} className="border rounded p-3"><b>{r.name}</b> · {r.status}<small className="block">{new Date(r.created_at).toLocaleString()}</small></article>)}</section>}
    {tab === 'audit' && <section className="space-y-2">{data.map(a => <article key={a.id} className="border rounded p-3"><b>{a.action}</b> {a.resource_type || ''}<small className="block">{new Date(a.created_at).toLocaleString()}</small></article>)}</section>}
  </div>;
}
