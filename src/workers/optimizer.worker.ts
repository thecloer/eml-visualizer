import { evaluate, complex as mjsComplex, isComplex } from 'mathjs'
import {
  enumerateRpn,
  evalRpnComplex,
  complexMatch,
  TEST_X_COMPLEX,
  buildSearchResult,
} from '@/core/optimizer'
import type { WorkerRequest, WorkerResponse } from '@/types'

type C = [number, number]

let aborted = false

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type === 'stop') { aborted = true; return }
  if (e.data.type === 'start' && e.data.targetExpr) {
    aborted = false
    // Default maxK=13 → 20 134 total candidates, completes in < 1 s.
    // Increase to 17 (~862 K candidates, ~5 s) for harder expressions.
    runSearch(e.data.targetExpr, e.data.maxK ?? 13)
  }
}

// mathjs evaluate uses `log` for natural log; normalize `ln(` → `log(`
function normalizeExpr(expr: string): string {
  return expr.replace(/\bln\s*\(/g, 'log(')
}

function evalTarget(expr: string, xRe: number, xIm: number): C | null {
  try {
    const result = evaluate(normalizeExpr(expr), { x: mjsComplex(xRe, xIm) })
    if (typeof result === 'number') return [result, 0]
    if (isComplex(result)) return [result.re, result.im]
    return null
  } catch {
    return null
  }
}

function runSearch(expr: string, maxK: number) {
  const targets: Array<C | null> = TEST_X_COMPLEX.map(([re, im]) =>
    evalTarget(expr, re, im)
  )

  if (targets.every(t => t === null)) {
    self.postMessage({
      type: 'error',
      error: 'Expression cannot be evaluated at test points.',
    } satisfies WorkerResponse)
    return
  }

  let totalSearched = 0

  for (let k = 1; k <= maxK; k += 2) {
    if (aborted) return

    let found = false

    enumerateRpn(k, (rpn) => {
      if (aborted) return false
      totalSearched++

      const allMatch = TEST_X_COMPLEX.every(([re, im], i) => {
        const target = targets[i]
        if (target === null) return true
        const val = evalRpnComplex(rpn, [re, im])
        return val !== null && complexMatch(val, target)
      })

      if (allMatch) {
        self.postMessage({
          type: 'result',
          result: { ...buildSearchResult(rpn), isOptimal: true },
        } satisfies WorkerResponse)
        found = true
        return false
      }

      if (totalSearched % 5_000 === 0) {
        self.postMessage({
          type: 'progress',
          progress: { currentK: k, searched: totalSearched },
        } satisfies WorkerResponse)
      }

      return true
    })

    if (found || aborted) return
  }

  // Search exhausted — no match found within maxK
  self.postMessage({
    type: 'done',
    totalSearched,
    maxKReached: maxK,
  } satisfies WorkerResponse)
}
