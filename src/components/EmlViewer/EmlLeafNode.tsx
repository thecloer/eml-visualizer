import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeData } from '@/core/treeLayout'

export function EmlLeafNode({ data }: NodeProps) {
  const d = data as unknown as NodeData
  const isVar = d.kind === 'var'

  return (
    <div
      style={{
        width: 56,
        height: 44,
        border: `1.5px solid ${isVar ? '#0066FF' : '#111'}`,
        borderRadius: '50%',
        background: isVar ? 'rgba(0,102,255,0.06)' : '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#333', width: 6, height: 6 }} />

      <span
        style={{
          fontSize: 13,
          fontFamily: 'monospace',
          fontWeight: 600,
          color: isVar ? '#0066FF' : '#111',
        }}
      >
        {d.label}
      </span>

      {d.value != null && isFinite(d.value) ? (
        <span style={{ fontSize: 8, color: '#888', marginTop: 1 }}>
          {d.value.toPrecision(3)}
        </span>
      ) : null}
    </div>
  )
}
