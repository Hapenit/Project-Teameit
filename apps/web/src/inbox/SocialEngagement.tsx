import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

export default function SocialEngagement() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  const [provider, setProvider] = useState<'instagram' | 'facebook'>('instagram');
  const [comments, setComments] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const headers = { Authorization: `Bearer ${session?.access_token || ''}`, 'x-tenant-id': activeTenant?.id || '' };
  const load = useCallback(async () => {
    if (!activeTenant || !session) return;
    const json = await (await fetch(`${API_BASE_URL}/api/v1/meta/${provider}/comments`, { headers: { Authorization: `Bearer ${session.access_token}`, 'x-tenant-id': activeTenant.id } })).json();
    if (json.success) setComments(json.data); else setError(json.error?.message || 'Unable to load comments');
  }, [activeTenant, session, provider]);
  useEffect(() => { load(); }, [load]);
  const moderate = async (id: string, action: string) => {
    const json = await (await fetch(`${API_BASE_URL}/api/v1/meta/${provider}/comments/${encodeURIComponent(id)}/moderate`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })).json();
    if (!json.success) setError(json.error?.message || 'Provider moderation failed'); else load();
  };
  const addRule = async () => {
    if (!keyword.trim()) return;
    const json = await (await fetch(`${API_BASE_URL}/api/v1/meta/${provider}/keyword-automations`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, action_type: 'create_lead' }) })).json();
    if (!json.success) setError(json.error?.message || 'Unable to create automation'); else setKeyword('');
  };
  return <section className="p-6 space-y-5">
    <div className="flex items-center gap-3"><h1 className="text-xl font-semibold">Social engagement</h1><select value={provider} onChange={e => setProvider(e.target.value as 'instagram' | 'facebook')}><option value="instagram">Instagram</option><option value="facebook">Facebook Messenger</option></select></div>
    {error && <p className="text-red-600">{error}</p>}
    <div className="flex gap-2"><input className="border rounded px-2 py-1" placeholder="Keyword" value={keyword} onChange={e => setKeyword(e.target.value)} /><button className="border rounded px-3 py-1" onClick={addRule}>Create lead rule</button></div>
    <div className="space-y-2">{comments.map(comment => <article key={comment.external_id} className="border rounded p-3"><p>{comment.text}</p><small>{comment.status}</small><div className="flex gap-2 mt-2"><button onClick={() => moderate(comment.external_id, 'hide')}>Hide</button><button onClick={() => moderate(comment.external_id, 'unhide')}>Unhide</button><button onClick={() => moderate(comment.external_id, 'delete')}>Delete</button></div></article>)}</div>
  </section>;
}
