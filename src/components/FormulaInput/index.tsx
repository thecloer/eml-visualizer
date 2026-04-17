import { useState, useEffect, useRef } from 'react'
import { STANDARD_EXAMPLES, OPTIMIZED_EXAMPLES, DEEP_FUNCTION_INFO } from '@/core/examples'
import type { CompileMode } from '@/types'

interface Props {
  onSubmit: (expr: string, mode?: CompileMode) => void
  error: string | null
  mode: CompileMode
  onModeChange: (m: CompileMode) => void
  isSearching: boolean
  searchProgress: { currentK: number; searched: number } | null
  searchNotFound: { maxK: number; searched: number } | null
  onHelpOpen: () => void
}

export function FormulaInput({
  onSubmit, error, mode, onModeChange,
  isSearching, searchProgress, searchNotFound,
  onHelpOpen,
}: Props) {
  const [value, setValue] = useState('exp(x)')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { onSubmit('exp(x)') }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  function schedule(v: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSubmit(v), 350)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    schedule(e.target.value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (timerRef.current) clearTimeout(timerRef.current)
      onSubmit(value)
    }
  }

  function loadExample(expr: string, exampleMode: CompileMode) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setValue(expr)
    if (exampleMode !== mode) onModeChange(exampleMode)
    onSubmit(expr, exampleMode)
  }

  return (
    <div style={{ borderBottom: '1px solid #e5e5e5' }}>
      {/* Input + mode toggle + help */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px' }}>
        <input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="exp(x), ln(x), exp(ln(x)) …"
          spellCheck={false}
          autoComplete="off"
          style={{
            flex: 1,
            fontFamily: 'monospace',
            fontSize: 15,
            padding: '6px 10px',
            border: `1.5px solid ${error ? '#FF3B30' : '#ccc'}`,
            borderRadius: 6,
            outline: 'none',
            background: '#fafafa',
          }}
        />
        <ModeToggle mode={mode} onChange={onModeChange} />
        <button
          onClick={onHelpOpen}
          title="User Guide"
          style={{
            padding: '5px 10px', fontSize: 11, fontFamily: 'monospace',
            border: '1.5px solid #ccc', borderRadius: 6,
            background: '#fff', color: '#666', cursor: 'pointer',
            lineHeight: 1.4, flexShrink: 0,
          }}
        >
          ?
        </button>
      </div>

      {/* Status messages */}
      <StatusBar
        error={error}
        isSearching={isSearching}
        searchProgress={searchProgress}
        searchNotFound={searchNotFound}
        mode={mode}
        onSwitchToOptimized={() => { onModeChange('optimized'); onSubmit(value, 'optimized') }}
      />

      {/* Examples */}
      <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <ExampleRow label="Standard" examples={STANDARD_EXAMPLES} targetMode="standard" currentMode={mode} onSelect={loadExample} />
        <ExampleRow label="Optimized" examples={OPTIMIZED_EXAMPLES} targetMode="optimized" currentMode={mode} onSelect={loadExample} />
        <DeepFunctionsRow />
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: CompileMode; onChange: (m: CompileMode) => void }) {
  return (
    <div style={{ display: 'flex', border: '1.5px solid #ccc', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
      {(['standard', 'optimized'] as const).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '5px 11px', fontSize: 11, fontFamily: 'monospace',
            border: 'none', cursor: 'pointer',
            background: mode === m ? '#111' : '#fff',
            color: mode === m ? '#fff' : '#666',
            transition: 'background 0.12s', lineHeight: 1.4,
          }}
        >
          {m === 'standard' ? 'Standard' : 'Optimized'}
        </button>
      ))}
    </div>
  )
}

function StatusBar({
  error, isSearching, searchProgress, searchNotFound, mode, onSwitchToOptimized,
}: {
  error: string | null
  isSearching: boolean
  searchProgress: { currentK: number; searched: number } | null
  searchNotFound: { maxK: number; searched: number } | null
  mode: CompileMode
  onSwitchToOptimized: () => void
}) {
  if (!error && !isSearching && !searchNotFound) return null

  return (
    <div style={{ padding: '0 14px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#FF3B30', fontFamily: 'monospace', flex: 1, whiteSpace: 'pre-wrap' }}>
            {error}
          </span>
          {error.includes('Optimized') && mode !== 'optimized' && (
            <button
              onClick={onSwitchToOptimized}
              style={{
                fontSize: 11, fontFamily: 'monospace',
                border: '1px solid #0066FF', borderRadius: 4,
                padding: '2px 8px', background: 'none', color: '#0066FF',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              Try Optimized →
            </button>
          )}
        </div>
      )}
      {isSearching && (
        <span style={{ fontSize: 11, color: '#0066FF', fontFamily: 'monospace' }}>
          {searchProgress
            ? `Searching… K=${searchProgress.currentK} · ${searchProgress.searched.toLocaleString()} candidates`
            : 'Starting search…'}
        </span>
      )}
      {searchNotFound && (
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>
          Not found within K≤{searchNotFound.maxK} ({searchNotFound.searched.toLocaleString()} candidates searched).
          This function likely requires a much deeper EML tree.
        </span>
      )}
    </div>
  )
}

function ExampleRow({
  label, examples, targetMode, currentMode, onSelect,
}: {
  label: string
  examples: typeof STANDARD_EXAMPLES
  targetMode: CompileMode
  currentMode: CompileMode
  onSelect: (expr: string, mode: CompileMode) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#aaa', minWidth: 60, flexShrink: 0 }}>
        {label}
      </span>
      {examples.map(ex => (
        <button
          key={ex.label}
          onClick={() => onSelect(ex.expr, targetMode)}
          title={ex.description}
          style={{
            fontSize: 11, fontFamily: 'monospace',
            padding: '2px 8px',
            border: `1px solid ${targetMode === currentMode ? '#ccc' : '#e5e5e5'}`,
            borderRadius: 4, background: '#fff', color: '#333',
            cursor: 'pointer', lineHeight: 1.5,
          }}
        >
          {ex.label}
          {ex.k > 0 && <span style={{ color: '#bbb', marginLeft: 3, fontSize: 9 }}>K={ex.k}</span>}
        </button>
      ))}
    </div>
  )
}

function DeepFunctionsRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#aaa', minWidth: 60, flexShrink: 0 }}>
        Deep (K≫19)
      </span>
      {DEEP_FUNCTION_INFO.map(fn => (
        <span
          key={fn.label}
          title={fn.note}
          style={{
            fontSize: 11, fontFamily: 'monospace',
            padding: '2px 8px',
            border: '1px dashed #ddd',
            borderRadius: 4, color: '#bbb', lineHeight: 1.5,
            cursor: 'default',
          }}
        >
          {fn.label}
          {fn.minK != null && <span style={{ marginLeft: 3, fontSize: 9 }}>K≈{fn.minK}</span>}
        </span>
      ))}
    </div>
  )
}
