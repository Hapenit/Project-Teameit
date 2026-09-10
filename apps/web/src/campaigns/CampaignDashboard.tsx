import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';
import { useNavigate } from 'react-router-dom';

export default function CampaignDashboard() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const navigate = useNavigate();
  const lifecycle = async (id: string, action: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}/lifecycle`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}`, 'x-tenant-id': activeTenant?.id || '' },
      body: JSON.stringify({ action })
    });
    const json = await response.json();
    if (json.success) setCampaigns(items => action === 'clone' ? [json.data, ...items] : items.map(c => c.id === id ? json.data : c));
    else alert(json.error?.message || 'Unable to update campaign');
  };

  useEffect(() => {
    if (!session || !activeTenant) return;
    const fetchCampaigns = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'x-tenant-id': activeTenant.id
          }
        });
        const json = await response.json();
        if (json.success) setCampaigns(json.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCampaigns();
  }, [session, activeTenant]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Broadcast Campaigns</h1>
          <p className="text-gray-500">Send bulk messages to segments of your CRM contacts.</p>
        </div>
        <button 
          onClick={() => navigate('/campaigns/new')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:opacity-90"
        >
          + New Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white border border-dashed rounded-lg">
            No campaigns yet. Broadcast to your audience!
          </div>
        ) : (
          campaigns.map(camp => (
            <div key={camp.id} className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{camp.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="capitalize bg-gray-100 px-2 rounded font-medium text-gray-700">{camp.channel}</span>
                  <span>Target: {Object.keys(camp.target_criteria).length === 0 ? 'All Contacts' : JSON.stringify(camp.target_criteria)}</span>
                  <span>Created: {new Date(camp.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm px-2 py-1 rounded inline-block font-bold capitalize mb-1 ${
                  camp.status === 'completed' ? 'bg-green-100 text-green-700' :
                  camp.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {camp.status}
                </div>
                <div className="text-xs font-medium text-gray-500 mt-1">
                  Queue Size: {camp.jobs?.[0]?.count || 0}
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                  {['running', 'scheduled'].includes(camp.status) && <button className="text-xs text-amber-700" onClick={() => lifecycle(camp.id, 'pause')}>Pause</button>}
                  {camp.status === 'paused' && <button className="text-xs text-blue-700" onClick={() => lifecycle(camp.id, 'resume')}>Resume</button>}
                  {!['completed', 'cancelled'].includes(camp.status) && <button className="text-xs text-red-700" onClick={() => lifecycle(camp.id, 'cancel')}>Cancel</button>}
                  <button className="text-xs text-gray-700" onClick={() => lifecycle(camp.id, 'clone')}>Clone</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
