import { API_BASE_URL } from '../config/api';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

export default function InboxDashboard() {
  const { session, user } = useAuth();
  const { activeTenant } = useTenant();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  useEffect(() => {
    if (!session || !activeTenant) return;

    const fetchTeam = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/inbox/team`, {
          headers: {
            'Authorization': ['Bearer', session?.access_token || ''].join(' '),
            'x-tenant-id': activeTenant.id
          }
        });
        const json = await response.json();
        if (json.success) setTeamMembers(json.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeam();
  }, [session, activeTenant]);

  const fetchConversations = useCallback(async () => {
    if (!session || !activeTenant) return;
    try {
      let url = `${API_BASE_URL}/api/v1/inbox/conversations?status=open`;
      if (filterAssignee !== 'all') {
        url += `&assignee_id=${filterAssignee}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': ['Bearer', session?.access_token || ''].join(' '),
          'x-tenant-id': activeTenant.id
        }
      });
      const json = await response.json();
      if (json.success) setConversations(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session, activeTenant, filterAssignee]);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    fetchConversations();
  }, [fetchConversations]);

  const loadMessages = async (conv: any) => {
    setActiveConversation(conv);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/inbox/conversations/${conv.id}/messages`, {
        headers: {
          'Authorization': ['Bearer', session?.access_token || ''].join(' '),
          'x-tenant-id': activeTenant?.id || ''
        }
      });
      const json = await response.json();
      if (json.success) setMessages(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (assigneeId: string) => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/inbox/conversations/${activeConversation.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ['Bearer', session?.access_token || ''].join(' '),
          'x-tenant-id': activeTenant?.id || ''
        },
        body: JSON.stringify({ assignee_id: assigneeId || null })
      });
      if (res.ok) {
        // Refresh conversations to reflect assignment
        fetchConversations();
        // Update local active conv state
        setActiveConversation({ ...activeConversation, assigned_to: assigneeId || null });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!activeConversation || !content || sending || !activeTenant || !session) return;
    setSending(true);
    setSendError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/inbox/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ['Bearer', session?.access_token || ''].join(' '),
          'x-tenant-id': activeTenant.id
        },
        body: JSON.stringify({ content })
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error?.message || json.error || 'Unable to send message');
      setMessages(previous => [...previous, json.data]);
      setDraft('');
      await fetchConversations();
    } catch (err: any) {
      setSendError(err.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] border bg-white rounded-lg overflow-hidden shadow-sm">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r flex flex-col bg-gray-50">
        <div className="p-4 border-b bg-white flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Inbox</h2>
            <span className="text-xs font-medium bg-gray-200 px-2 py-1 rounded-full">{conversations.length}</span>
          </div>
          <select 
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full text-sm border rounded p-1.5 bg-gray-50 outline-none focus:ring-1"
          >
            <option value="all">All Conversations</option>
            <option value="unassigned">Unassigned</option>
            {user && <option value={user.id}>Assigned to Me</option>}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No active conversations.</div>
          ) : (
            conversations.map(conv => {
              const assignedUser = conv.users;
              return (
                <div 
                  key={conv.id} 
                  onClick={() => loadMessages(conv)}
                  className={`p-4 border-b cursor-pointer transition-colors ${activeConversation?.id === conv.id ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-100 bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-800">
                      {conv.contacts?.first_name} {conv.contacts?.last_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold text-white inline-block ${
                      conv.channel === 'whatsapp' ? 'bg-green-500' :
                      conv.channel === 'instagram' ? 'bg-pink-500' :
                      conv.channel === 'facebook' ? 'bg-blue-600' :
                      conv.channel === 'email' ? 'bg-slate-700' :
                      conv.channel === 'google-business' ? 'bg-indigo-600' :
                      'bg-gray-500'
                    }`}>
                      {conv.channel}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {assignedUser ? (
                        <div title={`Assigned to ${assignedUser.first_name}`} className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                          {assignedUser.first_name?.[0]}{assignedUser.last_name?.[0]}
                        </div>
                      ) : (
                        <div title="Unassigned" className="w-5 h-5 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xs">
                          ?
                        </div>
                      )}

                      {conv.unread_count > 0 && (
                        <div className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversation ? (
          <>
            <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center">
                <h3 className="font-semibold text-lg">
                  {activeConversation.contacts?.first_name} {activeConversation.contacts?.last_name}
                </h3>
                <span className="ml-3 text-xs px-2 py-1 bg-gray-100 rounded border">Via {activeConversation.channel}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Assignee:</span>
                <select 
                  value={activeConversation.assigned_to || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="text-sm border rounded p-1 outline-none focus:ring-1"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(tm => (
                    <option key={tm.user_id} value={tm.user_id}>
                      {tm.users?.first_name} {tm.users?.last_name} {tm.user_id === user?.id ? '(Me)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'agent' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${msg.sender_type === 'agent' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border rounded-tl-none text-gray-800'}`}>
                    {msg.content}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                  className="flex-1 border rounded-full px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
              {sendError && <p className="text-sm text-red-600 mt-2">{sendError}</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
