import type { EmlNode } from '@/types'
import { countNodes, treeDepth } from './rpn'

// ── Complex test points ───────────────────────────────────────────────────────
// Using algebraically independent transcendentals as real parts + carefully
// chosen irrational imaginary parts avoids coincidental numeric matches.
// Complex x values force the full Riemann-surface path through each EML tree,
// which is essential for functions like sin/cos that need complex intermediates.
export const TEST_X_COMPLEX: Array<[number, number]> = [
  [0.5772156649015329, 0.31830988618379],   // γ + (1/π)i
  [1.2824271291006226, 0.43429448190325],   // A + log10(e)·i
  [2.6854520010653062, 0.36787944117144],   // Khinchin + (1/e)·i
  [0.9159655941772190, 0.69314718055995],   // Catalan + ln(2)·i
]

const TOLERANCE = 1e-8

// ── Fast inline complex arithmetic ───────────────────────────────────────────
// Avoids mathjs object allocation overhead in the tight inner loop.

type C = [number, number]  // [re, im]

function cExp([re, im]: C): C {
  const er = Math.exp(re)
  return [er * Math.cos(im), er * Math.sin(im)]
}

function cLog([re, im]: C): C | null {
  const r = re * re + im * im
  if (r === 0) return [Number.NEGATIVE_INFINITY, 0]  // IEEE 754: ln(0) = -∞
  return [0.5 * Math.log(r), Math.atan2(im, re)]
}

function cSub([ar, ai]: C, [br, bi]: C): C {
  return [ar - br, ai - bi]
}

function cFinite([re, im]: C): boolean {
  return isFinite(re) && isFinite(im)
}

// Evaluate an EML RPN string at a complex point x = [re, im].
// Returns null if the expression is undefined (log(0), overflow, etc.).
export function evalRpnComplex(rpn: string, x: C): C | null {
  const stack: C[] = []
  for (let i = 0; i < rpn.length; i++) {
    const ch = rpn[i]
    if (ch === '1') {
      stack.push([1, 0])
    } else if (ch === 'x') {
      stack.push(x)
    } else {
      // 'E': eml(a, b) = exp(a) − ln(b)
      const b = stack.pop()
      const a = stack.pop()
      if (a === undefined || b === undefined) return null
      const logB = cLog(b)
      if (logB === null) return null
      const result = cSub(cExp(a), logB)
      // Allow -∞ intermediate (eml_neg path); only reject NaN or +∞ final results
      if (isNaN(result[0]) || isNaN(result[1])) return null
      stack.push(result)
    }
  }
  return stack.length === 1 ? stack[0] : null
}

export function complexMatch(a: C, b: C): boolean {
  if (!cFinite(a) || !cFinite(b)) return false
  const dr = a[0] - b[0]
  const di = a[1] - b[1]
  const scale = Math.abs(b[0]) + Math.abs(b[1]) + 1e-15
  return Math.sqrt(dr * dr + di * di) / scale < TOLERANCE
}

// ── RPN enumeration ───────────────────────────────────────────────────────────
// Valid EML RPN strings have odd length K = 2L−1 (L leaves, L−1 operators).
// At every prefix: stack ≥ 1; final stack = 1.

export function enumerateRpn(
  k: number,
  onFound: (rpn: string) => boolean  // return false to abort
): void {
  function recurse(current: string, stack: number, remaining: number): boolean {
    if (remaining === 0) {
      return stack === 1 ? onFound(current) : true
    }
    // Pruning: stack − remaining ≤ 1 (must be reducible to 1 by all-E suffix)
    if (stack - remaining > 1) return true

    // Try leaf tokens
    if (!recurse(current + '1', stack + 1, remaining - 1)) return false
    if (!recurse(current + 'x', stack + 1, remaining - 1)) return false

    // Try eml operator (needs ≥ 2 on stack)
    if (stack >= 2) {
      if (!recurse(current + 'E', stack - 1, remaining - 1)) return false
    }
    return true
  }
  recurse('', 0, k)
}

// ── Tree construction ─────────────────────────────────────────────────────────

export function rpnToEmlNode(rpn: string): EmlNode {
  const stack: EmlNode[] = []
  for (const ch of rpn) {
    if (ch === '1') stack.push({ kind: 'const', value: 1 })
    else if (ch === 'x') stack.push({ kind: 'var', name: 'x' })
    else {
      const right = stack.pop()!
      const left = stack.pop()!
      stack.push({ kind: 'eml', left, right })
    }
  }
  return stack[0]
}

export interface SearchResult {
  rpn: string
  tree: EmlNode
  nodeCount: number
  depth: number
}

export function buildSearchResult(rpn: string): SearchResult {
  const tree = rpnToEmlNode(rpn)
  return { rpn, tree, nodeCount: countNodes(tree), depth: treeDepth(tree) }
}
