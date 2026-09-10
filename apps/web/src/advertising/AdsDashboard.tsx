import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdsDashboard() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  const [metrics, setMetrics] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'performance' | 'accounts'>('performance');
  
  // Accounts Tab State
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignBudget, setNewCampaignBudget] = useState('1000'); // in cents, so $10

  useEffect(() => {
    if (!session || !activeTenant) return;
    
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/advertising/meta-ads/metrics`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-tenant-id': activeTenant.id
          }
        });
        const json = await response.json();
        
        if (json.success) {
          // Sort metrics ascending for charts
          const sorted = [...json.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setMetrics(sorted);
        } else {
          setError(json.error?.message || 'Failed to fetch metrics');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Fetch accounts
    fetch(`${API_BASE_URL}/api/v1/advertising/meta-ads/accounts`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-tenant-id': activeTenant.id
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) setAccounts(json.data);
      })
      .catch(console.error);
      
  }, [session, activeTenant]);

  useEffect(() => {
    if (!session || !activeTenant || !selectedAccountId) return;
    fetch(`${API_BASE_URL}/api/v1/advertising/meta-ads/${selectedAccountId}/campaigns`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-tenant-id': activeTenant.id
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) setCampaigns(json.data);
      })
      .catch(console.error);
  }, [session, activeTenant, selectedAccountId]);

  const handleCreateCampaign = async () => {
    if (!selectedAccountId || !newCampaignName) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/advertising/meta-ads/${selectedAccountId}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCampaignName,
          objective: 'OUTCOME_TRAFFIC', // default objective
          status: 'PAUSED',
          special_ad_categories: [],
          daily_budget: parseInt(newCampaignBudget)
        })
      });
      const json = await response.json();
      if (json.success) {
        setCampaigns([...campaigns, json.data]);
        setShowCreateModal(false);
        setNewCampaignName('');
      } else {
        alert(json.error?.message || 'Failed to create campaign');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading advertising data...</div>;
  }

  if (error || !metrics) {
    return (
      <div className="max-w-4xl mx-auto p-12 mt-12 bg-white rounded-xl shadow-sm text-center border border-dashed border-gray-300">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">Connect Meta Ads</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          We couldn't find an active Meta Ads connection for this workspace. 
          Connect your account to sync ad spend, clicks, and conversions directly into Teameit.
        </p>
        <Link 
          to="/integrations" 
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium inline-block shadow-sm hover:opacity-90"
        >
          Go to Integrations
        </Link>
      </div>
    );
  }

  // Calculate Aggregates
  const totalSpend = metrics.reduce((acc, m) => acc + parseFloat(m.spend), 0);
  const totalClicks = metrics.reduce((acc, m) => acc + m.clicks, 0);
  const totalConversions = metrics.reduce((acc, m) => acc + m.conversions, 0);
  
  const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

  // Format data for chart
  const chartData = metrics.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: parseFloat(m.spend),
    clicks: m.clicks
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Meta Ads Manager</h1>
          <p className="text-gray-500">Track performance and manage your campaigns.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setTab('performance')} className={`px-4 py-2 text-sm font-medium rounded-md ${tab === 'performance' ? 'bg-white shadow' : 'text-gray-600'}`}>Performance</button>
          <button onClick={() => setTab('accounts')} className={`px-4 py-2 text-sm font-medium rounded-md ${tab === 'accounts' ? 'bg-white shadow' : 'text-gray-600'}`}>Accounts & Campaigns</button>
        </div>
      </div>

      {tab === 'performance' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border p-6 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Spend</p>
          <p className="text-3xl font-bold">${totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white border p-6 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Clicks</p>
          <p className="text-3xl font-bold">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white border p-6 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Avg CPC</p>
          <p className="text-3xl font-bold">${avgCpc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white border p-6 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Conversions</p>
          <p className="text-3xl font-bold">{totalConversions.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-6">Spend vs Clicks</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
              
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} tickFormatter={(value) => `$${value}`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={10} />
              
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value: any, name: any) => [name === 'spend' ? `$${value.toFixed(2)}` : value, name === 'spend' ? 'Spend' : 'Clicks']}
              />
              
              <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#E1306C" strokeWidth={3} dot={false} activeDot={{r: 6}} />
              <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#1877F2" strokeWidth={3} dot={false} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
        </>
      )}

      {tab === 'accounts' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-white border p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Ad Accounts</h2>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500">No ad accounts found.</p>
            ) : (
              <div className="space-y-2">
                {accounts.map(acc => (
                  <button 
                    key={acc.id} 
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${selectedAccountId === acc.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                  >
                    <div className="font-medium">{acc.name}</div>
                    <div className="text-gray-500 text-xs">ID: {acc.account_id} • {acc.currency}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="col-span-2 bg-white border p-6 rounded-xl shadow-sm min-h-96">
            {!selectedAccountId ? (
              <div className="h-full flex items-center justify-center text-gray-400">Select an ad account to view campaigns</div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-semibold text-lg">Campaigns</h2>
                  <button onClick={() => setShowCreateModal(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">Create Campaign</button>
                </div>
                
                {showCreateModal && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-3">New Campaign</h3>
                    <div className="space-y-3">
                      <div><label className="text-xs text-gray-500">Name</label><input type="text" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Campaign Name" /></div>
                      <div><label className="text-xs text-gray-500">Daily Budget (cents)</label><input type="number" value={newCampaignBudget} onChange={e => setNewCampaignBudget(e.target.value)} className="w-full border rounded p-2 text-sm" /></div>
                      <div className="flex gap-2">
                        <button onClick={handleCreateCampaign} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm">Save</button>
                        <button onClick={() => setShowCreateModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {campaigns.length === 0 ? <p className="text-sm text-gray-500">No campaigns found.</p> : campaigns.map(c => (
                    <div key={c.id} className="border p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500">Objective: {c.objective} • Budget: {c.daily_budget ? (parseInt(c.daily_budget) / 100).toFixed(2) : 'N/A'}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-gray-100 font-medium">{c.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
