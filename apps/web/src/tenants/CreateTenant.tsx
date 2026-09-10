import { API_BASE_URL } from '../config/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function CreateTenant() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ name, slug })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create workspace');
      }

      // Automatically switch to the newly created tenant or go to dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Create a Workspace</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Set up your business environment</p>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Workspace Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
              }}
              className="w-full p-2 border rounded"
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Workspace Slug</label>
            <input 
              type="text" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)}
              className="w-full p-2 border rounded bg-gray-50"
              placeholder="acme-corp"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold rounded disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
