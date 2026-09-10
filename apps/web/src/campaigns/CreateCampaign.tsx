import { API_BASE_URL } from '../config/api';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';
import { useNavigate } from 'react-router-dom';
import EmailTemplateBuilder from './EmailTemplateBuilder';

export default function CreateCampaign() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [htmlMessage, setHtmlMessage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);

  const handleLaunch = async () => {
    if (!name || (!message && !htmlMessage)) return alert('Name and message are required.');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (session?.access_token || ''),
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify({
          name,
          channel,
          emailSubject: channel === 'email' ? subject : undefined,
          targetCriteria: { 
            tags: selectedTags ? selectedTags.split(',').map(t => t.trim()) : [], 
            source: selectedSource || undefined 
          },
          messagePayload: { type: channel === 'email' ? 'email' : 'text', text: message, ...(htmlMessage ? { html: htmlMessage } : {}) },
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined
        })
      });
      const json = await response.json();
      if (json.success) {
        navigate('/campaigns');
      } else {
        alert(json.error?.message || 'Failed to launch');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/estimate-audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (session?.access_token || ''),
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify({
          tags: selectedTags ? selectedTags.split(',').map(t => t.trim()) : [],
          source: selectedSource || undefined
        })
      });
      const json = await response.json();
      if (json.success) {
        setAudienceCount(json.count);
      } else {
        alert(json.error?.message || 'Failed to estimate');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEstimating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border rounded-xl p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Create Broadcast Campaign</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
            placeholder="e.g. Holiday Promo Blast"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
          <select 
            value={channel}
            onChange={e => setChannel(e.target.value)}
            className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="whatsapp">WhatsApp Business</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        {channel === 'email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
            <input 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
              placeholder="e.g. Exciting News from Teameit!"
            />
          </div>
        )}
        {channel === 'email' && <EmailTemplateBuilder onChange={setHtmlMessage} />}
           {channel === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HTML (optional)</label>
              <textarea rows={4} value={htmlMessage} onChange={e => setHtmlMessage(e.target.value)}
                className="w-full border rounded-lg p-2 font-mono text-sm" placeholder="<h1>Hello {{first_name}}</h1>" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
            <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)} className="border rounded-lg p-2" />
          </div>
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl space-y-4">
          <h3 className="font-semibold text-gray-800">Audience Targeting</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has Tags (comma separated)</label>
              <input 
                type="text" 
                value={selectedTags}
                onChange={e => { setSelectedTags(e.target.value); setAudienceCount(null); }}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/20 outline-none" 
                placeholder="e.g. VIP, returning"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select 
                value={selectedSource}
                onChange={e => { setSelectedSource(e.target.value); setAudienceCount(null); }}
                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Any Source</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="import">CSV Import</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-200 mt-4">
            <button 
              onClick={handleEstimate}
              disabled={estimating}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {estimating ? 'Calculating...' : 'Estimate Audience Size'}
            </button>
            {audienceCount !== null && (
              <span className="text-sm font-bold text-gray-800 bg-gray-200 px-3 py-1 rounded-full">
                {audienceCount} matches
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
          <textarea 
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
            placeholder="Hi {{name}}, we have a special offer for you..."
          />
        </div>

        <div className="pt-4 border-t flex justify-end gap-3">
          <button 
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 border rounded font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleLaunch}
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Launching...' : 'Launch Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
