import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import ExecutionHistoryPanel from './ExecutionHistoryPanel';
import { apiRequest } from '../config/api';
import { useAuth } from '../auth/AuthContext';
import { useTenant } from '../tenants/TenantContext';

const nodeTypes = {
  triggerNode: TriggerNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode
};

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'triggerNode',
    position: { x: 250, y: 25 },
    data: { eventType: 'Incoming Message' }
  }
];

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [name, setName] = useState('Untitled Workflow');
  const [status, setStatus] = useState('draft');
  const [message, setMessage] = useState('');
  const { session } = useAuth();
  const { activeTenant } = useTenant();

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id || !session || !activeTenant) return;
    apiRequest(`/api/v1/automation/workflows/${id}`, {}, session.access_token, activeTenant.id)
      .then(r => r.json()).then(json => {
        if (!json.success) throw new Error(json.error?.message || 'Unable to load workflow');
        setWorkflowId(json.data.id); setName(json.data.name); setStatus(json.data.status);
        setNodes(json.data.graph_json?.nodes || []); setEdges(json.data.graph_json?.edges || []);
      }).catch(err => setMessage(err.message));
  }, [session, activeTenant]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 150 + 100 },
      data: type === 'conditionNode' 
        ? { conditionPayload: { containsText: 'help' } }
        : { actionPayload: { message: 'How can I help you today?' } }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    if (!session || !activeTenant) return setMessage('Sign in and select a tenant before saving.');
    setMessage('Saving…');
    try {
      const response = await apiRequest('/api/v1/automation/workflows', {
        method: 'POST', body: JSON.stringify({ id: workflowId, name, trigger_type: 'incoming_message', graph_json: { nodes, edges }, status })
      }, session.access_token, activeTenant.id);
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error?.message || 'Workflow save failed');
      setWorkflowId(json.data.id); setMessage('Saved');
    } catch (err: any) { setMessage(err.message); }
  };

  const handleExecute = async () => {
    if (!workflowId) return setMessage('Save the workflow before executing it.');
    const response = await apiRequest(`/api/v1/automation/workflows/${workflowId}/execute`, { method: 'POST', body: JSON.stringify({ event: {} }) }, session?.access_token, activeTenant?.id);
    const json = await response.json();
    setMessage(response.ok && json.success ? `Execution ${json.data.executionId} started` : (json.error?.message || 'Execution failed'));
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-lg">Visual Workflow Builder</h2>
        <div className="flex gap-2">
          <button onClick={() => addNode('conditionNode')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">
            + Condition
          </button>
          <button onClick={() => addNode('actionNode')} className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200">
            + Action
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2 self-center"></div>
          <button onClick={() => setShowHistory(!showHistory)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">
            View History
          </button>
          <input value={name} onChange={e => setName(e.target.value)} className="px-2 py-1 border rounded text-sm w-40" aria-label="Workflow name" />
          <button onClick={handleExecute} className="px-3 py-1 bg-gray-200 rounded text-sm font-medium">Execute</button>
          <button onClick={handleSave} className="px-4 py-1 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90">
            Save Workflow
          </button>
          {message && <span className="text-xs text-gray-600">{message}</span>}
        </div>
      </div>
      <div className="flex-1 relative">
        {showHistory && workflowId && <ExecutionHistoryPanel workflowId={workflowId} onClose={() => setShowHistory(false)} />}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
