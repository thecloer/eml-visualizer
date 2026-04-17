import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeData } from '@/core/treeLayout'

export function EmlOperatorNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as NodeData

  return (
    <div
      style={{
        width: 56,
        height: 44,
        border: `1.5px solid ${selected ? '#0066FF' : '#111'}`,
        borderRadius: 6,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 2px rgba(0,102,255,0.2)' : 'none',
        userSelect: 'none',
      }}
      title={d.folded ? `Folded subtree (${d.foldedCount} nodes)` : `eml(exp↓, ln↓) — id: ${id}`}
    >
      {/* Top handle (incoming from parent) */}
      <Handle type="target" position={Position.Top} style={{ background: '#333', width: 6, height: 6 }} />

      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#555', lineHeight: 1 }}>eml</span>

      {d.folded ? (
        <span style={{ fontSize: 9, color: '#0066FF', marginTop: 1 }}>[{d.foldedCount}]</span>
      ) : null}

      {d.value != null && isFinite(d.value) ? (
        <span style={{ fontSize: 8, color: '#888', marginTop: 1 }}>
          {d.value.toPrecision(3)}
        </span>
      ) : null}

      {/* Bottom-left handle: exp (left child) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="exp"
        style={{ left: '30%', background: '#333', width: 5, height: 5 }}
      />
      {/* Bottom-right handle: ln (right child) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="ln"
        style={{ left: '70%', background: '#999', width: 5, height: 5 }}
      />
    </div>
  )
}
