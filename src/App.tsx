import { useState, useCallback, useRef, useEffect } from 'react'
import type { CompileResult, CompileMode, WorkerRequest, WorkerResponse } from '@/types'
import { compileStandard, CompilerError } from '@/core/compiler'
import { FormulaInput } from '@/components/FormulaInput'
import { EmlViewer } from '@/components/EmlViewer'
import { ExportBar } from '@/components/ExportBar'
import { HelpModal } from '@/components/HelpModal'
import { ParameterPanel } from '@/components/ParameterPanel'

export default function App() {
  const [mode, setMode] = useState<CompileMode>('standard')
  const [result, setResult] = useState<CompileResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paramX, setParamX] = useState(1.0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState<{ currentK: number; searched: number } | null>(null)
  const [searchNotFound, setSearchNotFound] = useState<{ maxK: number; searched: number } | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const workerRef = useRef<Worker | null>(null)
  const currentExprRef = useRef<string>('')

  function stopWorker() {
    workerRef.current?.terminate()
    workerRef.current = null
    setIsSearching(false)
    setSearchProgress(null)
  }

  const compile = useCallback((expr: string, forceMode?: CompileMode) => {
    const effectiveMode = forceMode ?? mode
    if (!expr.trim()) {
      setResult(null); setError(null); setSearchNotFound(null); stopWorker(); return
    }

    currentExprRef.current = expr
    stopWorker()
    setSearchNotFound(null)

    // Always try Standard compile for instant feedback
    let standardResult: CompileResult | null = null
    let standardError: string | null = null
    try {
      standardResult = compileStandard(expr)
    } catch (e) {
      standardError = e instanceof CompilerError ? e.message : String(e)
    }

    if (effectiveMode === 'standard') {
      setResult(standardResult)
      setError(standardError)
      return
    }

    // ── Optimized Mode ──────────────────────────────────────────────────────
    // Show Standard result immediately as interim; worker will replace if shorter
    setResult(standardResult)
    setError(null)

    const worker = new Worker(
      new URL('./workers/optimizer.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker
    setIsSearching(true)
    setSearchProgress(null)

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (currentExprRef.current !== expr) return

      const msg = e.data
      switch (msg.type) {
        case 'progress':
          if (msg.progress) setSearchProgress(msg.progress)
          break
        case 'result':
          if (msg.result) {
            setResult(msg.result)
            setError(null)
          }
          setIsSearching(false)
          setSearchProgress(null)
          worker.terminate()
          workerRef.current = null
          break
        case 'done':
          // Search exhausted without finding a match
          setIsSearching(false)
          setSearchProgress(null)
          setSearchNotFound({
            maxK: msg.maxKReached ?? 13,
            searched: msg.totalSearched ?? 0,
          })
          worker.terminate()
          workerRef.current = null
          break
        case 'error':
          if (!standardResult) setError(msg.error ?? 'Search failed')
          setIsSearching(false)
          setSearchProgress(null)
          worker.terminate()
          workerRef.current = null
          break
      }
    }

    worker.postMessage({ type: 'start', targetExpr: expr, maxK: 13 } satisfies WorkerRequest)
  }, [mode])

  useEffect(() => {
    if (currentExprRef.current) compile(currentExprRef.current)
  }, [mode])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleModeChange(m: CompileMode) { setMode(m) }

  function handleSubmit(expr: string, forceMode?: CompileMode) {
    if (forceMode && forceMode !== mode) {
      setMode(forceMode)
      compile(expr, forceMode)
    } else {
      compile(expr)
    }
  }

  useEffect(() => () => stopWorker(), [])

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <FormulaInput
        onSubmit={handleSubmit}
        error={error}
        mode={mode}
        onModeChange={handleModeChange}
        isSearching={isSearching}
        searchProgress={searchProgress}
        searchNotFound={searchNotFound}
        onHelpOpen={() => setShowHelp(true)}
      />
      <EmlViewer tree={result?.tree ?? null} paramX={paramX} />
      <ExportBar result={result} />
      <ParameterPanel result={result} paramX={paramX} onParamXChange={setParamX} />
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}
