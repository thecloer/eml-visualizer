import { useState } from 'react'
import type { CompileResult } from '@/types'
import { evalTree } from '@/core/evaluator'

interface Props {
  result: CompileResult | null
  paramX: number
  onParamXChange: (v: number) => void
}

export function ParameterPanel({ result, paramX, onParamXChange }: Props) {
  const [open, setOpen] = useState(true)

  const evaluated = result
    ? (() => {
        try {
          return evalTree(result.tree, { re: paramX, im: 0 })
        } catch {
          return null
        }
      })()
    : null

  function fmt(v: number) {
    if (!isFinite(v)) return v > 0 ? '+∞' : '−∞'
    return v.toPrecision(6)
  }

  return (
    <div style={{ borderTop: '1px solid #e5e5e5', background: '#fafafa' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'monospace',
          color: '#555',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 10 }}>{open ? '▾' : '▸'}</span>
        Parameter tuning
      </button>

      {open && (
        <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#555', minWidth: 16 }}>x</label>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.01}
              value={paramX}
              onChange={e => onParamXChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={paramX}
              step={0.01}
              onChange={e => onParamXChange(Number(e.target.value))}
              style={{
                width: 70,
                fontFamily: 'monospace',
                fontSize: 12,
                padding: '2px 4px',
                border: '1px solid #ccc',
                borderRadius: 4,
                textAlign: 'right',
              }}
            />
          </div>

          {evaluated && (
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>
              <span style={{ color: '#888' }}>f(x) = </span>
              <span>{fmt(evaluated.re)}</span>
              {Math.abs(evaluated.im) > 1e-10 && (
                <span>
                  {evaluated.im >= 0 ? ' + ' : ' − '}
                  {fmt(Math.abs(evaluated.im))}i
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
