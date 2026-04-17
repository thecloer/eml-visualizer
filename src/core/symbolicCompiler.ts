/**
 * Symbolic EML compiler — TypeScript port of eml_compiler_v4.py
 * (VA00/SymbolicRegressionPackage)
 *
 * Produces VALID (not K-minimal) EML trees for all elementary functions.
 * Modularized so the IEmlCompiler interface can be swapped with an Adam
 * optimizer implementation later.
 */

import type { EmlNode } from '@/types'
import { countNodes, treeDepth } from './rpn'
import { treeToRpn } from './rpn'
import type { CompileResult } from '@/types'

// ── Interface (swap point for Adam optimizer later) ───────────────────────────

export interface IEmlCompiler {
  /** Compile an already-parsed expression tree into a CompileResult. */
  compileExpr(expr: string): CompileResult
}

// ── Primitive constructors ────────────────────────────────────────────────────

function C1(): EmlNode { return { kind: 'const', value: 1 } }
function E(left: EmlNode, right: EmlNode): EmlNode { return { kind: 'eml', left, right } }

// ── Core building blocks ──────────────────────────────────────────────────────
// All formulas derived from: eml(a, b) = exp(a) − ln(b)

/** exp(f) = eml(f, 1) */
export function emlExp(f: EmlNode): EmlNode {
  return E(f, C1())
}

/** ln(f) = eml(1, eml(eml(1, f), 1))
 *  Proof: exp(1) − ln(eml(eml(1,f),1))
 *       = e − ln(exp(e−ln(f))) = e − (e−ln(f)) = ln(f) ✓
 */
export function emlLn(f: EmlNode): EmlNode {
  return E(C1(), E(E(C1(), f), C1()))
}

/** zero() = eml(eml(1, eml(eml(1, 1), 1)), 1) evaluates to 0
 *  i.e. ln(eml(1,1)) = ln(e) = 1, so eml(1, eml(1,1)) is ln(e)=1?
 *  Actually: zero = eml(ln(1), 1) = exp(ln(1)) - ln(1) = 1 - 0 = 1...
 *  Use: zero = eml(eml(1,e_node), 1) where e_node = eml(1,1)
 *  eml(1, eml(1,1)) = exp(1) - ln(eml(1,1)) = e - ln(e) = e - 1 ≠ 0
 *  Correct zero: we need something = 0.
 *  From paper: zero = eml(ln(1), exp(-∞)) -- uses IEEE behavior.
 *  Simplest: zero = eml(1,1) - e = eml(ln(e), exp(1)) -- circular.
 *  Use: eml_zero = the RPN 111E1EE is ln(x=1) = 0 when x=1, not general.
 *
 *  Paper approach: neg(x) = exp(-∞) - ln(exp(x)) needs exp(-∞)=0.
 *  zero() via: eml(eml(1, eml(eml(1,1), 1)), 1)
 *    inner: eml(eml(1,1), 1) = eml(e, 1) = exp(e) - ln(1) = exp(e)
 *    then: eml(1, exp(e)) = exp(1) - ln(exp(e)) = e - e = 0 ✓
 */
export function emlZero(): EmlNode {
  // eml(1, exp(e)) = e - e = 0
  // exp(e) = eml(eml(1,1), 1)
  const e_node = E(C1(), C1())          // eml(1,1) = e
  const exp_e = E(e_node, C1())         // eml(e, 1) = exp(e)
  return E(C1(), exp_e)                 // eml(1, exp(e)) = e - e = 0
}

/** sub(a, b) = a - b = eml(ln(a), exp(b))
 *  Proof: exp(ln(a)) − ln(exp(b)) = a − b ✓
 */
export function emlSub(a: EmlNode, b: EmlNode): EmlNode {
  return E(emlLn(a), emlExp(b))
}

/** neg(x) = 0 - x = sub(zero(), x) */
export function emlNeg(f: EmlNode): EmlNode {
  return emlSub(emlZero(), f)
}

/** inv(f) = 1/f = exp(-ln(f)) = exp(neg(ln(f)))
 *  = emlExp(emlNeg(emlLn(f)))
 */
export function emlInv(f: EmlNode): EmlNode {
  return emlExp(emlNeg(emlLn(f)))
}

/** add(a, b) = a + b = a - (-b) = sub(a, neg(b)) */
export function emlAdd(a: EmlNode, b: EmlNode): EmlNode {
  return emlSub(a, emlNeg(b))
}

/** mul(a, b) = a * b = exp(ln(a) + ln(b)) = exp(sub(ln(a), neg(ln(b)))) */
export function emlMul(a: EmlNode, b: EmlNode): EmlNode {
  return emlExp(emlAdd(emlLn(a), emlLn(b)))
}

/** div(a, b) = a / b = a * inv(b) */
export function emlDiv(a: EmlNode, b: EmlNode): EmlNode {
  return emlMul(a, emlInv(b))
}

/** pow(a, b) = a^b = exp(b * ln(a)) */
export function emlPow(a: EmlNode, b: EmlNode): EmlNode {
  return emlExp(emlMul(b, emlLn(a)))
}

// ── Integer/rational constants ────────────────────────────────────────────────

/** Builds integer n (n ≥ 1) as repeated addition of 1 */
export function emlInt(n: number): EmlNode {
  if (!Number.isInteger(n) || n < 1) throw new Error(`emlInt: n must be ≥ 1, got ${n}`)
  let acc: EmlNode = C1()
  for (let i = 1; i < n; i++) acc = emlAdd(acc, C1())
  return acc
}

/** Rational p/q */
export function emlRational(p: number, q: number): EmlNode {
  return emlDiv(emlInt(Math.abs(p)), emlInt(Math.abs(q)))
  // Sign handling: if negative, wrap in emlNeg — callers handle sign
}

// ── Higher functions (from paper's compiler) ──────────────────────────────────

/** sqrt(f) = f^(1/2) = exp(ln(f) / 2) */
export function emlSqrt(f: EmlNode): EmlNode {
  // div(ln(f), 2) then exp — same as pow(f, 1/2)
  const half = emlDiv(C1(), emlAdd(C1(), C1()))  // 1/(1+1) = 1/2
  return emlExp(emlMul(half, emlLn(f)))
}

/** cbrt(f) = f^(1/3) */
export function emlCbrt(f: EmlNode): EmlNode {
  const third = emlDiv(C1(), emlAdd(C1(), emlAdd(C1(), C1())))
  return emlExp(emlMul(third, emlLn(f)))
}

// sin/cos via Euler's formula: sin(x) = (e^(ix) - e^(-ix)) / (2i)
// Requires complex constant i. From paper: i can be built from EML trees.
// For now we skip sin/cos — too deep for practical visualization.

// ── Wrap into CompileResult ───────────────────────────────────────────────────

export function wrapResult(tree: EmlNode, isOptimal = false): CompileResult {
  const rpn = treeToRpn(tree)
  return { tree, rpn, nodeCount: countNodes(tree), depth: treeDepth(tree), isOptimal }
}
