import { Handle, Position } from '@xyflow/react';

export default function TriggerNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-green-500 rounded-lg shadow-sm w-64">
      <div className="bg-green-500 text-white p-2 rounded-t-md font-semibold text-sm flex items-center gap-2">
        <span>⚡</span> Trigger
      </div>
      <div className="p-4 text-sm text-gray-700">
        <div><strong>Event:</strong> {data.eventType || 'Incoming Message'}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  );
}
