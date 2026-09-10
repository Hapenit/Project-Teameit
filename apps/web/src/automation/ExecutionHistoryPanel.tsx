import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

interface Props {
  workflowId: string;
  onClose: () => void;
}

export default function ExecutionHistoryPanel({ workflowId, onClose }: Props) {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/automation/workflows/${workflowId}/executions`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'x-tenant-id': activeTenant?.id || ''
          }
        });
        const json = await response.json();
        if (json.success) {
          setExecutions(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (session && activeTenant) {
      fetchExecutions();
    }
  }, [session, activeTenant, workflowId]);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l shadow-2xl z-40 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-bold">Execution History</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
        ) : executions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No executions yet.</div>
        ) : (
          <div className="divide-y">
            {executions.map(exec => (
              <div key={exec.id} className="p-4">
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded"
                  onClick={() => setSelectedExecution(selectedExecution?.id === exec.id ? null : exec)}
                >
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        exec.status === 'completed' ? 'bg-green-500' : 
                          exec.status === 'failed' ? 'bg-red-500' : exec.status === 'suspended' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}></span>
                      {exec.status.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(exec.started_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-primary">
                    {selectedExecution?.id === exec.id ? 'Close' : 'Details'}
                  </div>
                </div>

                {selectedExecution?.id === exec.id && (
                  <div className="mt-4 border bg-gray-50 rounded-lg p-3">
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Step Trace</h3>
                    <div className="space-y-3">
                      {exec.execution_log && Array.isArray(exec.execution_log) ? exec.execution_log.map((log: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          {log.error ? (
                            <div className="text-red-500 break-words font-mono">Error: {log.error}</div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <span className={log.status === 'failed' ? 'text-red-500 mt-0.5' : 'text-green-500 mt-0.5'}>{log.status === 'failed' ? '!' : '✓'}</span>
                              <div>
                                <div className="font-medium text-gray-700 font-mono">{log.nodeId}</div>
                                {log.evaluation !== undefined && (
                                  <div className="text-gray-500">Condition: {log.evaluation ? 'Passed' : 'Failed'}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="text-xs text-gray-500">No steps logged.</div>
                      )}
                    </div>
                    
                    {exec.trigger_event && (
                      <div className="mt-4 pt-4 border-t">
                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Trigger Payload</h3>
                        <pre className="text-[10px] bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(exec.trigger_event, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
