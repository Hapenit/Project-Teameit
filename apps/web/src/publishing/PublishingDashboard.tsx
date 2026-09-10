import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

const platformsAvailable = ['facebook', 'instagram', 'linkedin'];
const requestHeaders = (accessToken: string | undefined, tenantId: string | undefined) => ({
  Authorization: `Bearer ${accessToken ?? ''}`,
  'x-tenant-id': tenantId || ''
});

export default function PublishingDashboard() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState('');
  const [minDateTime] = useState(() => new Date(Date.now() + 60000).toISOString().slice(0, 16));
  const [postType, setPostType] = useState('feed');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [availableMedia, setAvailableMedia] = useState<any[]>([]);

  useEffect(() => {
    if (!session || !activeTenant) return;
    fetch(`${API_BASE_URL}/api/v1/publishing/posts`, { headers: requestHeaders(session.access_token, activeTenant.id) })
      .then(response => response.json())
      .then(json => { if (json.success) setPosts(json.data); })
      .catch(console.error);
      
    // Fetch available media
    fetch(`${API_BASE_URL}/api/v1/media`, { headers: requestHeaders(session.access_token, activeTenant.id) })
      .then(response => response.json())
      .then(json => { if (json.success) setAvailableMedia(json.data); })
      .catch(console.error);
  }, [session, activeTenant]);

  const handleCreatePost = async () => {
    if (!content.trim() || platforms.length === 0) {
      alert('Enter content and select at least one platform');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/publishing/posts`, {
        method: 'POST',
        headers: { ...requestHeaders(session?.access_token, activeTenant?.id), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platforms, scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined, postType, mediaUrls })
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error?.message || 'Failed to save draft');
      setContent('');
      setPlatforms([]);
      setScheduledFor('');
      setMediaUrls([]);
      setPostType('feed');
      const refreshed = await fetch(`${API_BASE_URL}/api/v1/publishing/posts`, {
        headers: requestHeaders(session?.access_token, activeTenant?.id)
      });
      const refreshedJson = await refreshed.json();
      if (refreshedJson.success) setPosts(refreshedJson.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Social Publishing</h1>
      </div>
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Live publishing uses each tenant's active provider integration. Missing credentials are reported as failures; no provider success is simulated.
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-1 bg-white border rounded-lg shadow-sm p-6 h-fit">
          <h2 className="text-lg font-semibold mb-2">Create a Post</h2>
          <p className="text-sm text-gray-500 mb-4">Publish now or schedule for the in-process delivery worker.</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Platforms</label>
            <div className="flex gap-2 flex-wrap">
              {platformsAvailable.map(platform => (
                <button key={platform} type="button" onClick={() => togglePlatform(platform)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${platforms.includes(platform) ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {platform}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea rows={5} maxLength={5000} value={content} onChange={e => setContent(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder="What do you want to share?" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
            <select value={postType} onChange={e => setPostType(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-white">
              <option value="feed">Feed</option>
              <option value="story">Story</option>
              <option value="reel">Reel</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Attach Media</label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {availableMedia.map(m => (
                <div key={m.id} 
                  onClick={() => setMediaUrls(prev => prev.includes(m.url) ? prev.filter(u => u !== m.url) : [...prev, m.url])}
                  className={`cursor-pointer border-2 rounded ${mediaUrls.includes(m.url) ? 'border-primary' : 'border-transparent'}`}>
                  {m.media_type === 'image' ? <img src={m.url} className="w-full h-16 object-cover rounded" /> : <div className="w-full h-16 bg-gray-200 flex items-center justify-center text-xs">Video</div>}
                </div>
              ))}
              {availableMedia.length === 0 && <span className="text-xs text-gray-400">No media in library</span>}
            </div>
          </div>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Schedule (optional)</label><input type="datetime-local" value={scheduledFor} min={minDateTime} onChange={e => setScheduledFor(e.target.value)} className="w-full border rounded-lg p-2 text-sm" /></div>
          <button type="button" onClick={handleCreatePost} disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? 'Saving...' : scheduledFor ? 'Schedule Post' : 'Save Draft'}
          </button>
        </div>
        <div className="col-span-2">
          <h2 className="text-lg font-semibold mb-4">Calendar & Recent Posts</h2>
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white border rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">{(post.platforms || []).map((platform: string) => <span key={platform} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize font-medium">{platform}</span>)}</div>
                  <span className="text-xs px-2 py-0.5 rounded capitalize font-medium bg-gray-100 text-gray-700">{post.status}</span>
                </div>
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{post.content}</p>
                <div className="mt-3 text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</div>
                {post.scheduled_for && <div className="mt-1 text-xs text-blue-600">Scheduled for {new Date(post.scheduled_for).toLocaleString()}</div>}
                {(post.status === 'draft' || post.status === 'failed') && <button type="button" onClick={async () => { const response = await fetch(`${API_BASE_URL}/api/v1/publishing/posts/${post.id}/publish`, { method: 'POST', headers: requestHeaders(session?.access_token, activeTenant?.id) }); const json = await response.json(); if (!response.ok || !json.success) alert(json.error?.message || 'Publishing failed'); else setPosts(prev => prev.map(item => item.id === post.id ? json.data : item)); }} className="mt-3 text-xs text-primary font-medium">Publish now</button>}
                {post.last_error && <div className="mt-2 text-xs text-red-600">{post.last_error}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
