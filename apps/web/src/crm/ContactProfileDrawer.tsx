import { API_BASE_URL } from '../config/api';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

export default function ContactProfileDrawer({ contact, onClose, onSaved }: { contact: any, onClose: () => void, onSaved: () => void }) {
  const { session } = useAuth();
  const { activeTenant } = useTenant();
  
  // Transform the API response contact_tags array into a simple array of strings for editing
  const initialTags = contact.contact_tags?.map((ct: any) => ct.tags.name) || [];
  
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  
  const [customFields, setCustomFields] = useState<{key: string, value: string}[]>(
    Object.entries(contact.custom_fields || {}).map(([k, v]) => ({ key: k, value: String(v) }))
  );

  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'tasks'>('details');

  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');

  // Initial state passed from parent (if updated, we'd need to re-fetch, but for MVP we use the loaded ones)
  const [notes, setNotes] = useState<any[]>(contact.notes || []);
  const [tasks, setTasks] = useState<any[]>(contact.tasks || []);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleSave = async () => {
    // Build JSON object from custom fields array
    const customFieldsObj: any = {};
    for (const field of customFields) {
      if (field.key.trim()) {
        customFieldsObj[field.key.trim()] = field.value;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify({
          tags,
          custom_fields: customFieldsObj
        })
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to update contact');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${contact.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify({ content: noteContent })
      });
      const json = await res.json();
      if (json.success) {
        setNotes([json.data, ...notes]);
        setNoteContent('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/${contact.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify({ title: taskTitle })
      });
      const json = await res.json();
      if (json.success) {
        setTasks([json.data, ...tasks]);
        setTaskTitle('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/crm/contacts/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenant?.id || ''
        }
      });
      const json = await res.json();
      if (json.success) {
        setTasks(tasks.map(t => t.id === taskId ? json.data : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div className="w-[400px] bg-white h-full shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{contact.first_name} {contact.last_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">&times;</button>
        </div>

        <div className="flex border-b mb-6 gap-6">
          <button 
            onClick={() => setActiveTab('details')}
            className={`pb-2 font-medium text-sm ${activeTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Details
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`pb-2 font-medium text-sm ${activeTab === 'notes' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Notes ({notes.length})
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`pb-2 font-medium text-sm ${activeTab === 'tasks' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
          >
            Tasks ({tasks.filter(t => t.status === 'pending').length})
          </button>
        </div>

        {activeTab === 'details' && (
          <>
            {/* Tags Section */}
            <div className="mb-8">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                  <span key={t} className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded flex items-center gap-1">
                    {t}
                    <button onClick={() => handleRemoveTag(t)} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type a tag and press Enter"
                className="w-full border rounded p-2 text-sm focus:ring-1 outline-none"
              />
            </div>

            {/* Custom Fields Section */}
            <div className="mb-8">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Custom Fields</h3>
              <div className="space-y-2">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key (e.g. Industry)"
                      value={field.key}
                      onChange={e => {
                        const newFields = [...customFields];
                        newFields[idx].key = e.target.value;
                        setCustomFields(newFields);
                      }}
                      className="w-1/2 border rounded p-1 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. SaaS)"
                      value={field.value}
                      onChange={e => {
                        const newFields = [...customFields];
                        newFields[idx].value = e.target.value;
                        setCustomFields(newFields);
                      }}
                      className="w-1/2 border rounded p-1 text-sm outline-none focus:border-primary"
                    />
                    <button 
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600 px-1"
                    >&times;</button>
                  </div>
                ))}
              </div>
              <button onClick={handleAddCustomField} className="text-sm text-primary font-medium mt-2">
                + Add Field
              </button>
            </div>

            <div className="mt-8 border-t pt-4">
              <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-2 rounded font-medium">
                Save Changes
              </button>
            </div>
          </>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-col h-[calc(100%-120px)]">
            <div className="flex-1 overflow-auto space-y-4 mb-4">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-4">No notes yet.</p>
              ) : (
                notes.map(n => (
                  <div key={n.id} className="bg-gray-50 p-3 rounded-lg border text-sm">
                    <p className="text-gray-800 whitespace-pre-wrap">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t pt-4">
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm outline-none focus:border-primary resize-none"
                rows={3}
                placeholder="Write a note..."
              />
              <button 
                onClick={handleAddNote}
                disabled={!noteContent.trim()}
                className="w-full mt-2 bg-primary text-primary-foreground py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="flex flex-col h-[calc(100%-120px)]">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="New task..."
                className="flex-1 border rounded-lg p-2 text-sm outline-none focus:border-primary"
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              />
              <button 
                onClick={handleAddTask}
                disabled={!taskTitle.trim()}
                className="bg-primary text-primary-foreground px-4 rounded text-sm font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
            
            <div className="flex-1 overflow-auto space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-4">No tasks.</p>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border text-sm">
                    <input 
                      type="checkbox" 
                      checked={t.status === 'completed'}
                      onChange={() => t.status === 'pending' && handleCompleteTask(t.id)}
                      disabled={t.status === 'completed'}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {t.title}
                      </p>
                      {t.status === 'completed' && (
                        <p className="text-xs text-gray-400">Completed on {new Date(t.completed_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
