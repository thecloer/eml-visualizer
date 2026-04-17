import { parse, type MathNode, OperatorNode, FunctionNode, ConstantNode, SymbolNode, ParenthesisNode } from 'mathjs'
import type { EmlNode, CompileResult } from '@/types'
import { treeToRpn, countNodes, treeDepth } from './rpn'
import {
  emlExp, emlLn, emlSqrt, emlCbrt,
  emlAdd, emlSub, emlMul, emlDiv, emlPow, emlNeg,
  emlInt, emlZero,
} from './symbolicCompiler'

const CONST_1: EmlNode = { kind: 'const', value: 1 }
const VAR_X: EmlNode = { kind: 'var', name: 'x' }

function eml(left: EmlNode, right: EmlNode): EmlNode {
  return { kind: 'eml', left, right }
}

// e = eml(1, 1) = exp(1) − ln(1) = e
const E_NODE: EmlNode = eml(CONST_1, CONST_1)

// Compile a mathjs MathNode to an EmlNode (Standard Mode).
// Supports: 1, e, x, exp(f), ln(f), log(f), eml(f,g), and parentheses.
// Throws a CompilerError for unsupported constructs.
export class CompilerError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'CompilerError'
  }
}

function compileNode(node: MathNode): EmlNode {
  // Strip parentheses
  if (node instanceof ParenthesisNode) {
    return compileNode((node as ParenthesisNode).content)
  }

  // Constant nodes
  if (node instanceof ConstantNode) {
    const v = Number(node.value)
    if (v === 1) return CONST_1
    if (Number.isInteger(v) && v >= 2 && v <= 10) return emlInt(v)
    if (v === 0) return emlZero()
    throw new CompilerError(
      `Constant '${node.value}' is not directly representable in EML.\n` +
      `Only integer constants 0–10 and 'e' are supported.`
    )
  }

  // Symbol nodes: x or e
  if (node instanceof SymbolNode) {
    if (node.name === 'x') return VAR_X
    if (node.name === 'e') return E_NODE
    if (node.name === 'pi' || node.name === 'π') {
      throw new CompilerError(
        `π requires a depth-193 EML tree. Use Optimized Mode to generate it.`
      )
    }
    if (node.name === 'i') {
      throw new CompilerError(
        `The imaginary unit i requires a complex EML tree. Use Optimized Mode.`
      )
    }
    throw new CompilerError(`Unknown symbol '${node.name}'.`)
  }

  // Function nodes: exp, ln, log, eml
  if (node instanceof FunctionNode) {
    const fn = node.fn.toString()
    const args: MathNode[] = (node as FunctionNode).args

    if (fn === 'exp') {
      if (args.length !== 1) throw new CompilerError(`exp() requires exactly 1 argument.`)
      return emlExp(compileNode(args[0]))
    }

    if (fn === 'ln' || fn === 'log') {
      if (args.length !== 1) throw new CompilerError(`${fn}() requires exactly 1 argument.`)
      return emlLn(compileNode(args[0]))
    }

    if (fn === 'eml') {
      if (args.length !== 2) throw new CompilerError(`eml() requires exactly 2 arguments.`)
      return eml(compileNode(args[0]), compileNode(args[1]))
    }

    if (fn === 'sqrt') {
      if (args.length !== 1) throw new CompilerError(`sqrt() requires exactly 1 argument.`)
      return emlSqrt(compileNode(args[0]))
    }

    if (fn === 'cbrt') {
      if (args.length !== 1) throw new CompilerError(`cbrt() requires exactly 1 argument.`)
      return emlCbrt(compileNode(args[0]))
    }

    if (fn === 'sin' || fn === 'cos' || fn === 'tan') {
      throw new CompilerError(
        `${fn}(x) requires K >> 19 using complex intermediates.\nSwitch to Optimized Mode.`
      )
    }

    throw new CompilerError(
      `Function '${fn}' is not directly supported in Standard Mode.\n` +
      `Supported: exp(), ln(), log(), sqrt(), cbrt(), eml(). Switch to Optimized Mode for other functions.`
    )
  }

  // Operator nodes — use symbolic compiler building blocks
  if (node instanceof OperatorNode) {
    const op = (node as OperatorNode).op
    const args: MathNode[] = (node as OperatorNode).args

    if (op === '-' && args.length === 1) {
      return emlNeg(compileNode(args[0]))
    }
    if (op === '-' && args.length === 2) {
      return emlSub(compileNode(args[0]), compileNode(args[1]))
    }
    if (op === '+' && args.length === 2) {
      return emlAdd(compileNode(args[0]), compileNode(args[1]))
    }
    if (op === '*' && args.length === 2) {
      return emlMul(compileNode(args[0]), compileNode(args[1]))
    }
    if (op === '/' && args.length === 2) {
      return emlDiv(compileNode(args[0]), compileNode(args[1]))
    }
    if ((op === '^' || op === '**') && args.length === 2) {
      return emlPow(compileNode(args[0]), compileNode(args[1]))
    }
  }

  throw new CompilerError(`Unsupported expression node: ${node.type}`)
}

export function compileStandard(expr: string): CompileResult {
  let mathNode: MathNode
  try {
    mathNode = parse(expr)
  } catch (e) {
    throw new CompilerError(`Parse error: ${e instanceof Error ? e.message : String(e)}`)
  }

  const tree = compileNode(mathNode)
  const rpn = treeToRpn(tree)
  return {
    tree,
    rpn,
    nodeCount: countNodes(tree),
    depth: treeDepth(tree),
    isOptimal: false,
  }
}
