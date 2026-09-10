import { API_BASE_URL } from '../config/api';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

export default function LeadPipelines() {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [activePipeline, setActivePipeline] = useState<any | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !activeTenant) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Pipelines
        const pipeRes = await fetch(`${API_BASE_URL}/api/v1/crm/pipelines`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-tenant-id': activeTenant.id
          }
        });
        const pipeJson = await pipeRes.json();
        
        if (pipeJson.success && pipeJson.data.length > 0) {
          setPipelines(pipeJson.data);
          setActivePipeline(pipeJson.data[0]);
        }

        // Fetch Contacts
        const contactRes = await fetch(`${API_BASE_URL}/api/v1/crm/contacts`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-tenant-id': activeTenant.id
          }
        });
        const contactJson = await contactRes.json();
        if (contactJson.success) {
          setContacts(contactJson.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, activeTenant]);

  const handleStageChange = async (contactId: string, newStageId: string) => {
    const previousContacts = contacts;
    setContacts(previousContacts.map(c =>
      c.id === contactId ? { ...c, pipeline_stage_id: newStageId } : c
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify({ pipeline_stage_id: newStageId })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Unable to move lead');
    } catch (err) {
      console.error(err);
      setContacts(previousContacts);
    }
  };

  const handleDrop = (stageId: string) => {
    if (draggedContactId) {
      void handleStageChange(draggedContactId, stageId);
      setDraggedContactId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading pipelines...</div>;
  }

  if (!activePipeline) {
    return <div className="p-8 text-center text-gray-500">No pipelines found.</div>;
  }

  // Sort stages by order
  const sortedStages = [...(activePipeline.pipeline_stages || [])].sort((a, b) => a.stage_order - b.stage_order);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{activePipeline.name}</h1>
          <p className="text-gray-500 text-sm">Drag leads between stages, or use the Move to menu.</p>
        </div>
        <div className="flex gap-2">
          {pipelines.length > 1 && (
            <select 
              className="border rounded p-2"
              value={activePipeline.id}
              onChange={e => setActivePipeline(pipelines.find(p => p.id === e.target.value))}
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium shadow-sm">
            + New Lead
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
        {sortedStages.map(stage => {
          // Filter contacts for this stage (or null if it's the first stage and contact has no stage yet)
          const stageContacts = contacts.filter(c => {
            if (c.pipeline_stage_id === stage.id) return true;
            // If contact has no stage, dump them in the first stage
            if (!c.pipeline_stage_id && stage.stage_order === 1) return true;
            return false;
          });

          return (
            <div key={stage.id} className="min-w-[300px] w-[300px] bg-gray-50 border rounded-xl flex flex-col max-h-full"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
              aria-label={`Drop zone for ${stage.name}`}
            >
              <div className={`p-4 border-b rounded-t-xl font-bold flex justify-between items-center ${stage.color}`}>
                <span>{stage.name}</span>
                <span className="bg-white/50 text-gray-800 text-xs px-2 py-0.5 rounded-full">{stageContacts.length}</span>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {stageContacts.map(contact => (
                  <div key={contact.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab"
                    draggable
                    onDragStart={(event) => {
                      setDraggedContactId(contact.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', contact.id);
                    }}
                    onDragEnd={() => setDraggedContactId(null)}
                    role="article"
                    aria-label={`${contact.first_name} ${contact.last_name}`}
                  >
                    <div className="font-semibold text-gray-800 mb-1">
                      {contact.first_name} {contact.last_name}
                    </div>
                    {contact.company && <div className="text-xs text-gray-500 mb-2">{contact.company}</div>}
                    
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Move to:</span>
                      <select 
                        aria-label={`Move ${contact.first_name} ${contact.last_name} to stage`}
                        className="text-xs border rounded p-1 outline-none bg-gray-50"
                        value={stage.id}
                        onChange={(e) => handleStageChange(contact.id, e.target.value)}
                      >
                        {sortedStages.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                
                {stageContacts.length === 0 && (
                  <div className="text-center p-4 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
