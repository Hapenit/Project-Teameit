import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

interface Props {
  datePreset: string;
  customStart: string;
  customEnd: string;
}

export default function AgentPerformanceTable({ datePreset, customStart, customEnd }: Props) {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!session || !activeTenant) return;
      setLoading(true);

      let start = new Date();
      let end = new Date();

      if (datePreset === '7d') {
        start.setDate(start.getDate() - 7);
      } else if (datePreset === '30d') {
        start.setDate(start.getDate() - 30);
      } else if (datePreset === '90d') {
        start.setDate(start.getDate() - 90);
      } else if (datePreset === 'custom' && customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/analytics/agents?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-tenant-id': activeTenant.id
          }
        });
        const json = await response.json();
        if (json.success) {
          setAgents(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [session, activeTenant, datePreset, customStart, customEnd]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 bg-white border rounded-xl mt-6">Loading agent performance...</div>;
  }

  return (
    <div className="bg-white border rounded-xl mt-6 overflow-hidden shadow-sm print:break-before-page">
      <div className="p-6 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">Agent Leaderboard</h2>
        <p className="text-gray-500 text-sm">Track team productivity and resolution volume.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Agent Name</th>
              <th className="p-4 font-semibold text-center">Assigned Chats</th>
              <th className="p-4 font-semibold text-center">Resolved Chats</th>
              <th className="p-4 font-semibold text-center">Resolution Rate</th>
              <th className="p-4 font-semibold text-center">Messages Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No agents found for this tenant.</td>
              </tr>
            ) : (
              agents.map((agent) => {
                const resolutionRate = agent.assigned > 0 
                  ? Math.round((agent.resolved / agent.assigned) * 100) 
                  : 0;

                return (
                  <tr key={agent.agentId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      {agent.name}
                    </td>
                    <td className="p-4 text-center font-mono">{agent.assigned}</td>
                    <td className="p-4 text-center font-mono text-green-600 font-medium">{agent.resolved}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${resolutionRate}%` }}></div>
                        </div>
                        <span className="font-mono text-xs text-gray-500">{resolutionRate}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-gray-600">{agent.messagesSent}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
