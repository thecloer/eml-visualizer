import type { Node, Edge } from '@xyflow/react'
import type { EmlNode } from '@/types'

const V_GAP = 90   // vertical gap between levels
const H_GAP = 20   // minimum horizontal gap between adjacent leaves
const NODE_W = 56
const NODE_H = 44

export interface NodeData {
  kind: 'eml' | 'const' | 'var'
  label: string
  folded?: boolean
  foldedCount?: number
  value?: number | null
  isActive?: boolean
  isError?: boolean
}

export type NodeMap = Map<string, EmlNode>

export interface LayoutResult {
  nodes: Node[]
  edges: Edge[]
  nodeMap: NodeMap
}

let idSeq = 0
const newId = () => `n${idSeq++}`

// ── Pass 1: assign stable ids and measure subtree width ──────────────────────

interface IdTree {
  id: string
  emlNode: EmlNode
  left?: IdTree
  right?: IdTree
  width: number   // total bounding-box width of this subtree
}

function assignIds(node: EmlNode, foldedIds: Set<string>): IdTree {
  const id = newId()

  if (node.kind === 'const' || node.kind === 'var') {
    return { id, emlNode: node, width: NODE_W }
  }

  if (foldedIds.has(id)) {
    return { id, emlNode: node, width: NODE_W }
  }

  const left = assignIds(node.left, foldedIds)
  const right = assignIds(node.right, foldedIds)
  const width = left.width + H_GAP + right.width

  return { id, emlNode: node, left, right, width }
}

// ── Pass 2: assign absolute (x, y) positions ─────────────────────────────────

function assignPositions(
  tree: IdTree,
  depth: number,
  xOffset: number,         // left edge of this subtree's bounding box
  foldedIds: Set<string>,
  rfNodes: Node[],
  rfEdges: Edge[],
  nodeMap: NodeMap,
  activeEdgeIds: Set<string>,
  errorEdgeIds: Set<string>,
  nodeValues: Map<string, number | null>,
) {
  const { id, emlNode, left, right } = tree
  nodeMap.set(id, emlNode)

  const y = depth * V_GAP
  const x = xOffset + tree.width / 2 - NODE_W / 2

  if (emlNode.kind === 'const') {
    rfNodes.push(leafNode(id, 'const', '1', x, y, nodeValues.get(id) ?? null))
    return
  }

  if (emlNode.kind === 'var') {
    rfNodes.push(leafNode(id, 'var', 'x', x, y, nodeValues.get(id) ?? null))
    return
  }

  const folded = foldedIds.has(id)
  const count = folded ? countSubtree(emlNode) : undefined

  rfNodes.push({
    id,
    type: 'emlNode',
    position: { x, y },
    data: {
      kind: 'eml',
      label: 'eml',
      folded,
      foldedCount: count,
      value: nodeValues.get(id) ?? null,
    } satisfies NodeData,
    width: NODE_W,
    height: NODE_H,
  })

  if (folded || !left || !right) return

  // Left child (exp branch)
  const edgeL = `e${id}L`
  rfEdges.push(makeEdge(edgeL, id, left.id, 'exp', activeEdgeIds, errorEdgeIds))
  assignPositions(left, depth + 1, xOffset, foldedIds, rfNodes, rfEdges, nodeMap, activeEdgeIds, errorEdgeIds, nodeValues)

  // Right child (ln branch)
  const edgeR = `e${id}R`
  rfEdges.push(makeEdge(edgeR, id, right.id, 'ln', activeEdgeIds, errorEdgeIds))
  assignPositions(right, depth + 1, xOffset + left.width + H_GAP, foldedIds, rfNodes, rfEdges, nodeMap, activeEdgeIds, errorEdgeIds, nodeValues)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function buildLayout(
  root: EmlNode,
  foldedIds: Set<string> = new Set(),
  activeEdgeIds: Set<string> = new Set(),
  errorEdgeIds: Set<string> = new Set(),
  nodeValues: Map<string, number | null> = new Map(),
): LayoutResult {
  idSeq = 0
  const rfNodes: Node[] = []
  const rfEdges: Edge[] = []
  const nodeMap: NodeMap = new Map()

  const idTree = assignIds(root, foldedIds)
  assignPositions(idTree, 0, 0, foldedIds, rfNodes, rfEdges, nodeMap, activeEdgeIds, errorEdgeIds, nodeValues)

  return { nodes: rfNodes, edges: rfEdges, nodeMap }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function leafNode(id: string, kind: 'const' | 'var', label: string, x: number, y: number, value: number | null): Node {
  return {
    id,
    type: 'emlLeaf',
    position: { x, y },
    data: { kind, label, value } satisfies NodeData,
    width: NODE_W,
    height: NODE_H,
  }
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  label: 'exp' | 'ln',
  activeEdgeIds: Set<string>,
  errorEdgeIds: Set<string>,
): Edge {
  const isActive = activeEdgeIds.has(id)
  const isError = errorEdgeIds.has(id)
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    label,
    labelStyle: { fontSize: 9, fill: '#999' },
    style: {
      stroke: isError ? '#FF3B30' : isActive ? '#0066FF' : '#333',
      strokeWidth: isActive ? 2.5 : 1.5,
    },
  }
}

function countSubtree(node: EmlNode): number {
  if (node.kind !== 'eml') return 1
  return 1 + countSubtree(node.left) + countSubtree(node.right)
}
