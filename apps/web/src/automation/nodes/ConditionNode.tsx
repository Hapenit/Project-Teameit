import { Handle, Position } from '@xyflow/react';

export default function ConditionNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-sm w-64">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <div className="bg-blue-500 text-white p-2 rounded-t-md font-semibold text-sm flex items-center gap-2">
        <span>❓</span> Condition
      </div>
      <div className="p-4 text-sm text-gray-700">
        <div><strong>If message contains:</strong></div>
        <div className="font-mono bg-gray-100 p-1 mt-1 rounded text-xs">{data.conditionPayload?.containsText || '...'}</div>
      </div>
      {/* Two outputs: True and False */}
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="w-3 h-3 bg-green-500" />
      <div className="absolute -bottom-5 left-[15%] text-[10px] font-bold text-green-600">TRUE</div>
      
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="w-3 h-3 bg-red-500" />
      <div className="absolute -bottom-5 right-[10%] text-[10px] font-bold text-red-600">FALSE</div>
    </div>
  );
}
