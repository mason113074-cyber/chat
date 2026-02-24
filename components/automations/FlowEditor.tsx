'use client';

import { useCallback, useImperativeHandle, useRef, forwardRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const colors: Record<string, string> = {
  trigger: 'bg-orange-500',
  ai: 'bg-blue-500',
  condition: 'bg-green-500',
  action: 'bg-purple-500',
  routing: 'bg-yellow-500',
  end: 'bg-gray-500',
};

function BaseNode({ data, type }: NodeProps) {
  const nodeType = (type ?? 'trigger') as string;
  const color = colors[nodeType] ?? 'bg-gray-400';

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md min-w-[180px] overflow-hidden">
      <div className={`px-3 py-2 text-white text-sm font-medium ${color}`}>
        {String(data?.label ?? nodeType)}
      </div>
      <div className="px-3 py-2 text-xs text-gray-600">{String(data?.summary ?? '')}</div>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border-2" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-2" />
    </div>
  );
}

const nodeTypes: Record<string, React.ComponentType<NodeProps>> = {
  trigger: BaseNode,
  ai: BaseNode,
  condition: BaseNode,
  action: BaseNode,
  routing: BaseNode,
  end: BaseNode,
};

export interface FlowEditorHandle {
  getNodes: () => Node[];
  getEdges: () => Edge[];
}

interface FlowEditorProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

export const FlowEditor = forwardRef<FlowEditorHandle, FlowEditorProps>(function FlowEditor(
  { initialNodes, initialEdges },
  ref
) {
  const nodesRef = useRef<Node[]>(initialNodes);
  const edgesRef = useRef<Edge[]>(initialEdges);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // eslint-disable-next-line react-hooks/refs
  nodesRef.current = nodes;
  // eslint-disable-next-line react-hooks/refs
  edgesRef.current = edges;

  useImperativeHandle(ref, () => ({
    getNodes: () => nodesRef.current,
    getEdges: () => edgesRef.current,
  }));

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type: string, label: string, subType?: string) => {
      const id = uuidv4();
      const newNode: Node = {
        id,
        type: type as Node['type'],
        position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        data: { label, summary: '', ...(subType && { subType }) },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const nodeToolbox = [
    { category: '觸發器', icon: '📢', items: [
      { type: 'trigger', label: '收到新訊息', subType: 'new_message' },
      { type: 'trigger', label: '關鍵字匹配', subType: 'keywords' },
      { type: 'trigger', label: '新客戶首次對話', subType: 'new_customer' },
      { type: 'trigger', label: '非營業時間', subType: 'off_hours' },
    ]},
    { category: 'AI 分析', icon: '🤖', items: [
      { type: 'ai', label: '情緒分析', subType: 'sentiment' },
      { type: 'ai', label: '意圖辨識', subType: 'intent' },
      { type: 'ai', label: '語言偵測', subType: 'language' },
      { type: 'ai', label: 'AI 自動回覆', subType: 'reply' },
    ]},
    { category: '條件', icon: '⚡', items: [
      { type: 'condition', label: 'If/Else 判斷', subType: 'branch' },
    ]},
    { category: '動作', icon: '🎯', items: [
      { type: 'action', label: '發送訊息', subType: 'send_message' },
      { type: 'action', label: 'Quick Reply 按鈕', subType: 'quick_reply' },
      { type: 'action', label: '新增客戶標籤', subType: 'add_tag' },
      { type: 'action', label: '更新客戶資料', subType: 'update_customer' },
    ]},
    { category: '轉派', icon: '🔀', items: [
      { type: 'routing', label: '轉人工客服', subType: 'to_human' },
      { type: 'routing', label: '轉回 AI', subType: 'to_ai' },
    ]},
    { category: '結束', icon: '🏁', items: [
      { type: 'end', label: '結束對話', subType: 'end_chat' },
      { type: 'end', label: '滿意度調查', subType: 'csat' },
    ]},
  ];

  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);

  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      );
    },
    [setNodes]
  );

  return (
    <div className="flex w-full h-full">
      <div className="w-[250px] shrink-0 border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">節點工具箱</p>
        <div className="space-y-4">
          {nodeToolbox.map(({ category, icon, items }) => (
            <div key={category}>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <span>{icon}</span> {category}
              </p>
              <div className="space-y-1">
                {items.map(({ type, label, subType }) => (
                  <button
                    key={`${type}-${subType}`}
                    onClick={() => addNode(type, label, subType)}
                    className="w-full flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-left"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0">
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
          <MiniMap />
        </ReactFlow>
      </div>
      {selectedNode && (
        <div className="w-[300px] shrink-0 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <p className="text-sm font-medium text-gray-700 mb-3">節點設定</p>
          <div className="space-y-3">
            <div>
              <label htmlFor="node-label" className="block text-xs font-medium text-gray-500 mb-1">名稱</label>
              <input
                id="node-label"
                type="text"
                value={(selectedNode.data?.label as string) ?? ''}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                aria-label="節點名稱"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">摘要</label>
              <input
                type="text"
                value={(selectedNode.data?.summary as string) ?? ''}
                onChange={(e) => updateNodeData(selectedNode.id, { summary: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                placeholder="顯示在節點上"
              />
            </div>
            {selectedNode.type === 'trigger' && selectedNode.data?.subType === 'keywords' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">關鍵字（每行一個）</label>
                <textarea
                  value={((selectedNode.data?.keywords as string[]) ?? []).join('\n')}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      keywords: e.target.value.split('\n').filter(Boolean),
                      summary: e.target.value.split('\n').filter(Boolean).join(', ') || undefined,
                    })
                  }
                  rows={4}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="退貨&#10;退款&#10;換貨"
                />
              </div>
            )}
            {(selectedNode.type === 'action' &&
              (selectedNode.data?.subType === 'send_message' || selectedNode.data?.subType === 'quick_reply')) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">訊息內容</label>
                <textarea
                  value={(selectedNode.data?.message as string) ?? ''}
                  onChange={(e) => {
                    updateNodeData(selectedNode.id, { message: e.target.value });
                  }}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="支援變數 {{customer_name}}"
                />
              </div>
            )}
            {selectedNode.type === 'action' && selectedNode.data?.subType === 'quick_reply' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">按鈕（label / value）</label>
                <textarea
                  value={((selectedNode.data?.buttons as { label: string; value: string }[]) ?? [])
                    .map((b) => `${b.label} / ${b.value}`)
                    .join('\n')}
                  onChange={(e) => {
                    const buttons = e.target.value
                      .split('\n')
                      .filter(Boolean)
                      .map((line) => {
                        const [label, value] = line.split('/').map((s) => s.trim());
                        return { label: label ?? '', value: value ?? label ?? '' };
                      });
                    updateNodeData(selectedNode.id, { buttons });
                  }}
                  rows={4}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="選項A / option_a&#10;選項B / option_b"
                />
              </div>
            )}
            {selectedNode.type === 'condition' && (
              <>
                <div>
                  <label htmlFor="node-field" className="block text-xs font-medium text-gray-500 mb-1">判斷欄位</label>
                  <select
                    id="node-field"
                    value={(selectedNode.data?.field as string) ?? 'sentiment'}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateNodeData(selectedNode.id, { field: v });
                    }}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    aria-label="判斷欄位"
                  >
                    <option value="sentiment">情緒 (sentiment)</option>
                    <option value="intent">意圖 (intent)</option>
                    <option value="language">語言 (language)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="node-operator" className="block text-xs font-medium text-gray-500 mb-1">運算符</label>
                  <select
                    id="node-operator"
                    value={(selectedNode.data?.operator as string) ?? 'equals'}
                    onChange={(e) => updateNodeData(selectedNode.id, { operator: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    aria-label="運算符"
                  >
                    <option value="equals">等於</option>
                    <option value="contains">包含</option>
                    <option value="not_equals">不等於</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">比較值</label>
                  <input
                    type="text"
                    value={(selectedNode.data?.compareValue as string) ?? ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { compareValue: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    placeholder="negative"
                  />
                </div>
              </>
            )}
            {selectedNode.type === 'action' && selectedNode.data?.subType === 'add_tag' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">標籤名稱</label>
                <input
                  type="text"
                  value={(selectedNode.data?.tags as string) ?? ''}
                  onChange={(e) => {
                    const tags = e.target.value;
                    updateNodeData(selectedNode.id, {
                      tags,
                      summary: tags ? `標籤：${tags}` : undefined,
                    });
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="VIP, 投訴中"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
