import type { EmlNode } from '@/types'

export function treeToRpn(node: EmlNode): string {
  if (node.kind === 'const') return '1'
  if (node.kind === 'var') return node.name
  return treeToRpn(node.left) + treeToRpn(node.right) + 'E'
}

// Parse RPN string back to EML tree.
// Tokens: '1' = const, 'x' = var, 'E' = eml(pop, pop)
export function rpnToTree(rpn: string): EmlNode {
  const stack: EmlNode[] = []
  for (const ch of rpn) {
    if (ch === '1') {
      stack.push({ kind: 'const', value: 1 })
    } else if (ch === 'x') {
      stack.push({ kind: 'var', name: 'x' })
    } else if (ch === 'E') {
      const right = stack.pop()
      const left = stack.pop()
      if (!left || !right) throw new Error(`Invalid RPN: stack underflow at '${ch}'`)
      stack.push({ kind: 'eml', left, right })
    } else {
      throw new Error(`Invalid RPN token: '${ch}'`)
    }
  }
  if (stack.length !== 1) throw new Error(`Invalid RPN: leftover tokens`)
  return stack[0]
}

export function countNodes(node: EmlNode): number {
  if (node.kind !== 'eml') return 1
  return 1 + countNodes(node.left) + countNodes(node.right)
}

export function treeDepth(node: EmlNode): number {
  if (node.kind !== 'eml') return 1
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right))
}
