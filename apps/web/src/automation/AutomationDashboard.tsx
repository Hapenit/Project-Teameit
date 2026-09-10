import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';
import { useNavigate } from 'react-router-dom';

export default function AutomationDashboard() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session || !activeTenant) return;
    const fetchWorkflows = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/automation/workflows`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-tenant-id': activeTenant.id
          }
        });
        const json = await response.json();
        if (json.success) setWorkflows(json.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWorkflows();
  }, [session, activeTenant]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Automations</h1>
          <p className="text-gray-500">Build chatbots and automated workflows visually.</p>
        </div>
        <button 
          onClick={() => navigate('/automation/builder')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:opacity-90"
        >
          + Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white border border-dashed rounded-lg">
            No automations yet. Create your first workflow!
          </div>
        ) : (
          workflows.map(wf => (
            <div key={wf.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-shadow" onClick={() => navigate(`/automation/builder?id=${wf.id}`)}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg truncate pr-4">{wf.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${wf.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {wf.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{wf.description || 'No description provided.'}</p>
              <div className="text-xs text-gray-400 font-medium bg-gray-50 p-2 rounded">
                Trigger: {wf.trigger_type}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
