import { API_BASE_URL } from '../config/api';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

const AVAILABLE_PROVIDERS = [
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Connect WhatsApp to send/receive messages.', color: 'bg-green-500' },
  { id: 'instagram', name: 'Instagram', desc: 'Connect Instagram for DMs and Comments.', color: 'bg-pink-500' },
  { id: 'facebook', name: 'Facebook', desc: 'Connect Facebook Pages for Messenger.', color: 'bg-blue-600' },
  { id: 'google_ads', name: 'Google Ads', desc: 'Sync campaign spend and performance from the Google Ads API.', color: 'bg-orange-500' },
  { id: 'meta_ads', name: 'Meta Ads', desc: 'Manage Meta campaigns, ad sets, ads, creatives, budgets, and performance.', color: 'bg-blue-700' },
  { id: 'google_analytics', name: 'Google Analytics (GA4)', desc: 'Read GA4 property reports and conversion data.', color: 'bg-yellow-500' },
  { id: 'google_search_console', name: 'Search Console', desc: 'Read verified site search performance.', color: 'bg-blue-500' },
  { id: 'google_business', name: 'Google Business Profile', desc: 'Read managed locations and profile resources.', color: 'bg-indigo-600' },
  { id: 'google_adsense', name: 'AdSense', desc: 'Read AdSense account and earnings resources.', color: 'bg-green-600' },
  { id: 'youtube', name: 'YouTube', desc: 'Read the connected channel and its analytics resources.', color: 'bg-red-600' },
  { id: 'email', name: 'Email Engine (SMTP)', desc: 'Connect an SMTP provider to send/receive emails.', color: 'bg-slate-700' },
];

export default function IntegrationsDashboard() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState({ 
    host: '', port: '', user: '', password: '', secure: true,
    imapHost: '', imapPort: '', imapSecure: true
  });
  const [emailSaving, setEmailSaving] = useState(false);


  const fetchIntegrations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        }
      });
      const json = await response.json();
      if (json.success) setIntegrations(json.data);
    } catch (err) {
      console.error(err);
    }
  }, [session, activeTenant]);

  useEffect(() => {
    if (!session || !activeTenant) return;
    // eslint-disable-next-line react/set-state-in-effect
    fetchIntegrations();
  }, [session, activeTenant, fetchIntegrations]);

  const handleConnect = async (provider: string) => {
    if (provider === 'email') {
      setShowEmailModal(true);
      return;
    }
    
    setLoading(true);
    const actualProvider = provider;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/auth-url?provider=${actualProvider}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        }
      });
      const json = await response.json();
      if (json.success && json.data.url) {
        // Redirect the user to the generated OAuth URL
        window.location.assign(json.data.url);
      } else {
        alert(json.error?.message || 'Failed to get auth URL');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify(emailConfig)
      });
      const json = await response.json();
      if (json.success) {
        setShowEmailModal(false);
        fetchIntegrations();
      } else {
        alert(json.error?.message || 'Failed to verify SMTP');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    const actualProvider = provider;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/integrations/${actualProvider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        }
      });
      const json = await response.json();
      if (json.success) {
        fetchIntegrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Integrations</h1>
        <p className="text-gray-500">Connect third-party platforms to your Teameit workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_PROVIDERS.map(p => {
          const connectedInt = integrations.find(i => i.provider === p.id);
          const isConnected = !!connectedInt;

          return (
            <div key={p.id} className="bg-white border rounded-xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold ${p.color}`}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <div className={`text-xs px-2 py-1 inline-block rounded font-medium mt-1 ${
                    isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm flex-grow mb-6">{p.desc}</p>
              
              <div className="mt-auto">
                {isConnected ? (
                  <button 
                    onClick={() => handleDisconnect(p.id)}
                    className="w-full border border-red-200 text-red-600 font-medium py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(p.id)}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Connect Email (SMTP & IMAP)</h2>
            <form onSubmit={handleSaveEmail} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <h3 className="font-semibold border-b pb-1">SMTP Settings (Sending)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input required type="text" value={emailConfig.host} onChange={e => setEmailConfig({...emailConfig, host: e.target.value})} className="w-full border rounded p-2" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input required type="number" value={emailConfig.port} onChange={e => setEmailConfig({...emailConfig, port: e.target.value})} className="w-full border rounded p-2" placeholder="465" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (Email)</label>
                <input required type="text" value={emailConfig.user} onChange={e => setEmailConfig({...emailConfig, user: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password (App Password)</label>
                <input required type="password" value={emailConfig.password} onChange={e => setEmailConfig({...emailConfig, password: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div className="flex items-center mb-4">
                <input type="checkbox" id="secure" checked={emailConfig.secure} onChange={e => setEmailConfig({...emailConfig, secure: e.target.checked})} className="mr-2" />
                <label htmlFor="secure" className="text-sm font-medium text-gray-700">Use Secure Connection (TLS/SSL)</label>
              </div>

              <h3 className="font-semibold border-b pb-1 pt-2">IMAP Settings (Receiving)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Host</label>
                <input required type="text" value={emailConfig.imapHost} onChange={e => setEmailConfig({...emailConfig, imapHost: e.target.value})} className="w-full border rounded p-2" placeholder="imap.gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Port</label>
                <input required type="number" value={emailConfig.imapPort} onChange={e => setEmailConfig({...emailConfig, imapPort: e.target.value})} className="w-full border rounded p-2" placeholder="993" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="imapSecure" checked={emailConfig.imapSecure} onChange={e => setEmailConfig({...emailConfig, imapSecure: e.target.checked})} className="mr-2" />
                <label htmlFor="imapSecure" className="text-sm font-medium text-gray-700">Use Secure Connection (TLS/SSL)</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 border rounded font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={emailSaving} className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 disabled:opacity-50">
                  {emailSaving ? 'Verifying...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
