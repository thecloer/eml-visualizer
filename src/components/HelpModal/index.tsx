import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Reset scroll position when opened
  useEffect(() => {
    if (open && contentRef.current) contentRef.current.scrollTop = 0
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 8,
          maxWidth: 720,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '14px 20px',
          borderBottom: '1px solid #e5e5e5',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#111', flex: 1, whiteSpace: 'normal', lineHeight: 1.3 }}>
            EML Tree Visualizer — User Guide
          </span>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 20, color: '#999', lineHeight: 1, padding: '0 2px',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={contentRef} style={{ overflowY: 'auto', padding: '16px 20px 24px' }}>
          <GuideContent />
        </div>
      </div>
    </div>
  )
}

// ── Shared inline-style helpers ──────────────────────────────────────────────

const sectionTitle: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: '#111',
  margin: '24px 0 10px', paddingBottom: 6, borderBottom: '1px solid #eee',
}
const sectionTitleFirst: React.CSSProperties = { ...sectionTitle, marginTop: 0 }

const para: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 12, color: '#444', lineHeight: 1.7, margin: '6px 0',
}

const code: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 11, background: '#f5f5f5',
  padding: '1px 5px', borderRadius: 3, color: '#333',
}

const th: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 11, textAlign: 'left',
  padding: '5px 10px', borderBottom: '1.5px solid #ccc', color: '#666',
  background: '#fafafa',
}

const td: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 11, padding: '4px 10px',
  borderBottom: '1px solid #eee', color: '#333', verticalAlign: 'top',
}

const tableWrap: React.CSSProperties = {
  overflowX: 'auto', margin: '8px 0',
}

const table: React.CSSProperties = {
  borderCollapse: 'collapse', width: '100%',
}

// ── Guide Content ────────────────────────────────────────────────────────────

function GuideContent() {
  return (
    <>
      {/* ── 1. What is EML? ─────────────────────────────────────────────── */}
      <div style={sectionTitleFirst}>1. What is EML?</div>
      <p style={para}>
        Odrzywołek (2026) showed that <em>every</em> elementary function can be generated from a single binary operator:
      </p>
      <p style={{ ...para, textAlign: 'center', fontSize: 13, color: '#111', margin: '10px 0' }}>
        <strong>eml(x, y) = e<sup>x</sup> − ln y</strong>
      </p>
      <p style={para}>
        With just <span style={code}>eml</span>, the constant <span style={code}>1</span>,
        and the variable <span style={code}>x</span>, the grammar{' '}
        <span style={code}>S → 1 | x | eml(S, S)</span> generates every elementary function as a binary tree.
      </p>

      <div style={tableWrap}>
        <table style={table}>
          <thead><tr><th style={th}>Function</th><th style={th}>EML expression</th></tr></thead>
          <tbody>
            <tr><td style={td}>e<sup>x</sup></td><td style={td}>eml(x, 1)</td></tr>
            <tr><td style={td}>e (Euler's number)</td><td style={td}>eml(1, 1)</td></tr>
            <tr><td style={td}>ln x</td><td style={td}>eml(1, eml(eml(1, x), 1))</td></tr>
            <tr><td style={td}>−x</td><td style={td}>Depth-8 tree</td></tr>
            <tr><td style={td}>√x</td><td style={td}>Depth-33 tree</td></tr>
          </tbody>
        </table>
      </div>

      {/* ── 2. Standard vs Optimized Mode ────────────────────────────────── */}
      <div style={sectionTitle}>2. Standard vs Optimized Mode</div>
      <p style={para}>
        Use the toggle in the top-right corner to switch modes.
      </p>
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}></th>
              <th style={th}>Standard</th>
              <th style={th}>Optimized</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...td, fontWeight: 600 }}>Speed</td>
              <td style={td}>Instant (ms)</td>
              <td style={td}>Up to ~1 s</td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: 600 }}>Result</td>
              <td style={td}>Correct tree, not necessarily minimal K</td>
              <td style={td}>Searches K=1…13 for shortest RPN</td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: 600 }}>Example</td>
              <td style={td}><span style={code}>exp(ln(x))</span> → K=9</td>
              <td style={td}><span style={code}>exp(ln(x))</span> → K=1 (identity!)</td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: 600 }}>Not found?</td>
              <td style={td}>—</td>
              <td style={td}>Means K {'>'} 13 for this function</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 3. Reading the Tree ──────────────────────────────────────────── */}
      <div style={sectionTitle}>3. Reading the Tree</div>
      <p style={para}><strong>Nodes:</strong></p>
      <ul style={{ ...para, paddingLeft: 18, margin: '4px 0' }}>
        <li><strong>eml</strong> — rectangle, internal operator node</li>
        <li><strong>1</strong> — circle, constant terminal (black)</li>
        <li><strong>x</strong> — circle, variable terminal (blue, <span style={{ color: '#0066FF' }}>#0066FF</span>)</li>
      </ul>
      <p style={para}><strong>Edges:</strong></p>
      <ul style={{ ...para, paddingLeft: 18, margin: '4px 0' }}>
        <li><strong>Left (exp):</strong> child value passed into e<sup>(·)</sup></li>
        <li><strong>Right (ln):</strong> child value passed into ln(·)</li>
      </ul>
      <p style={para}>
        Since eml(x, y) = e<sup>x</sup> − ln y, the left/right order matters — swapping children gives a completely different function.
      </p>
      <p style={para}><strong>Canvas navigation:</strong> drag to pan, scroll to zoom, use <span style={code}>fit</span> button to auto-scale, minimap for large trees.</p>

      {/* ── 4. RPN & K ───────────────────────────────────────────────────── */}
      <div style={sectionTitle}>4. RPN Notation &amp; K Complexity</div>
      <p style={para}>
        The tree is serialized via post-order traversal into an RPN string using three tokens:
        {' '}<span style={code}>1</span> (constant), <span style={code}>x</span> (variable), <span style={code}>E</span> (eml operator).
      </p>
      <p style={para}>
        <strong>K = length of RPN string = total nodes.</strong> Smaller K = more concise representation.
      </p>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr><th style={th}>K</th><th style={th}>Candidates</th><th style={th}>Search time</th></tr></thead>
          <tbody>
            <tr><td style={td}>1</td><td style={td}>2</td><td style={td}>&lt; 1 ms</td></tr>
            <tr><td style={td}>3</td><td style={td}>4</td><td style={td}>&lt; 1 ms</td></tr>
            <tr><td style={td}>5</td><td style={td}>14</td><td style={td}>&lt; 1 ms</td></tr>
            <tr><td style={td}>7</td><td style={td}>42</td><td style={td}>&lt; 1 ms</td></tr>
            <tr><td style={td}>9</td><td style={td}>132</td><td style={td}>&lt; 1 ms</td></tr>
            <tr><td style={td}>11</td><td style={td}>429</td><td style={td}>&lt; 10 ms</td></tr>
            <tr><td style={td}>13</td><td style={td}>1,430</td><td style={td}>&lt; 100 ms</td></tr>
          </tbody>
        </table>
      </div>
      <p style={para}>
        The <span style={code}>✓ optimal</span> badge in the result bar means Optimized Mode confirmed the shortest representation within K≤13.
      </p>

      {/* ── 5. Supported Inputs ──────────────────────────────────────────── */}
      <div style={sectionTitle}>5. Supported Functions &amp; Operators</div>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr><th style={th}>Input</th><th style={th}>Status</th><th style={th}>Notes</th></tr></thead>
          <tbody>
            <tr><td style={td}><span style={code}>exp(x)</span></td><td style={td}>✅</td><td style={td}>K=3, optimal</td></tr>
            <tr><td style={td}><span style={code}>ln(x)</span> / <span style={code}>log(x)</span></td><td style={td}>✅</td><td style={td}>K=7, optimal</td></tr>
            <tr><td style={td}><span style={code}>sqrt(x)</span></td><td style={td}>✅</td><td style={td}>Symbolic (K=139)</td></tr>
            <tr><td style={td}><span style={code}>cbrt(x)</span></td><td style={td}>✅</td><td style={td}>Cube root, symbolic</td></tr>
            <tr><td style={td}><span style={code}>eml(x, y)</span></td><td style={td}>✅</td><td style={td}>Direct operator</td></tr>
            <tr><td style={td}><span style={code}>+  −  *  /  ^</span></td><td style={td}>✅</td><td style={td}>Arithmetic operators</td></tr>
            <tr><td style={td}><span style={code}>1</span>, <span style={code}>e</span>, <span style={code}>0</span>–<span style={code}>10</span></td><td style={td}>✅</td><td style={td}>Supported constants</td></tr>
            <tr><td style={td}><span style={code}>sin</span>, <span style={code}>cos</span>, <span style={code}>tan</span></td><td style={td}>❌</td><td style={td}>K ≫ 19, not yet implemented</td></tr>
            <tr><td style={td}><span style={code}>pi</span>, <span style={code}>i</span></td><td style={td}>❌</td><td style={td}>Requires K=193+</td></tr>
          </tbody>
        </table>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #eee' }}>
        <p style={{ ...para, color: '#999', fontSize: 11 }}>
          Paper:{' '}
          <a
            href="https://arxiv.org/abs/2603.21852"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0066FF', textDecoration: 'none' }}
          >
            All elementary functions from a single binary operator — Andrzej Odrzywołek (arXiv:2603.21852)
          </a>
        </p>
      </div>
    </>
  )
}
