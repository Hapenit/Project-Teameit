import { Handle, Position } from '@xyflow/react';

export default function ActionNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg shadow-sm w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <div className="bg-purple-500 text-white p-2 rounded-t-md font-semibold text-sm flex items-center gap-2">
        <span>🤖</span> Action
      </div>
      <div className="p-4 text-sm text-gray-700">
        <div><strong>Send Message:</strong></div>
        <div className="italic text-gray-500 mt-1">"{data.actionPayload?.message || 'Default Reply'}"</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  );
}
