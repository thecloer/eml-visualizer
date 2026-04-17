import type { EmlNode, ComplexNum } from '@/types'

type C = [number, number]

function cExp([re, im]: C): C {
  // Short-circuit when im=0: avoids Inf*0=NaN for edge cases (re=±Inf)
  if (im === 0) return [Math.exp(re), 0]
  const er = Math.exp(re)
  return [er * Math.cos(im), er * Math.sin(im)]
}

// IEEE 754-compatible: ln(0) = -∞, ln(∞) = ∞
function cLog([re, im]: C): C {
  const r2 = re * re + im * im
  if (r2 === 0) return [Number.NEGATIVE_INFINITY, 0]
  return [0.5 * Math.log(r2), Math.atan2(im, re)]
}

function cSub([ar, ai]: C, [br, bi]: C): C {
  return [ar - br, ai - bi]
}

function evalNode(node: EmlNode, x: C): C {
  if (node.kind === 'const') return [1, 0]
  if (node.kind === 'var') return x
  const a = evalNode(node.left, x)
  const b = evalNode(node.right, x)
  return cSub(cExp(a), cLog(b))
}

export function evalTree(node: EmlNode, x: ComplexNum): ComplexNum {
  const [re, im] = evalNode(node, [x.re, x.im])
  return { re, im }
}
