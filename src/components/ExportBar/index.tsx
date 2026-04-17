import { useState } from 'react'
import type { CompileResult } from '@/types'

interface Props {
  result: CompileResult | null
}

export function ExportBar({ result }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result.rpn).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderTop: '1px solid #e5e5e5',
        background: '#fafafa',
        minHeight: 36,
      }}
    >
      <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', flexShrink: 0 }}>RPN</span>
      <code
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: 'monospace',
          color: result ? '#111' : '#bbb',
          letterSpacing: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {result ? result.rpn : '—'}
      </code>

      {result && (
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', flexShrink: 0 }}>
          K={result.rpn.length} · {result.nodeCount} nodes · depth {result.depth}
          {result.isOptimal && ' · ✓ optimal'}
        </span>
      )}

      <button
        onClick={handleCopy}
        disabled={!result}
        style={{
          padding: '4px 10px',
          fontSize: 11,
          fontFamily: 'monospace',
          border: '1px solid #ccc',
          borderRadius: 4,
          cursor: result ? 'pointer' : 'default',
          background: copied ? '#111' : '#fff',
          color: copied ? '#fff' : '#333',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
