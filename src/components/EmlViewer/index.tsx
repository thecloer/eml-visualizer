import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { EmlNode } from '@/types'
import { buildLayout } from '@/core/treeLayout'
import { EmlOperatorNode } from './EmlOperatorNode'
import { EmlLeafNode } from './EmlLeafNode'

const nodeTypes: NodeTypes = {
  emlNode: EmlOperatorNode,
  emlLeaf: EmlLeafNode,
}

interface Props {
  tree: EmlNode | null
  paramX: number
}

export function EmlViewer({ tree, paramX: _paramX }: Props) {
  const { nodes, edges } = useMemo<{ nodes: Node[]; edges: Edge[] }>(() => {
    if (!tree) return { nodes: [], edges: [] }
    return buildLayout(tree)
  }, [tree])

  const onNodeClick = useCallback<NodeMouseHandler>((_evt, node) => {
    console.log('node clicked', node.id)
    // TODO: folding toggle
  }, [])

  if (!tree) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa',
          fontSize: 13,
          fontFamily: 'monospace',
        }}
      >
        Enter an expression above to generate an EML tree.
      </div>
    )
  }

  return (
    <div style={{ flex: 1, width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={3}
        attributionPosition="bottom-left"
        nodesConnectable={false}
        nodesDraggable={true}
        elementsSelectable={true}
      >
        <Background color="#e8e8e8" gap={20} />
        <Controls position="bottom-left" />
        <MiniMap
          className="responsive-minimap"
          position="bottom-right"
          nodeColor={(n) => (n.type === 'emlLeaf' ? '#0066FF' : '#333')}
          maskColor="rgba(255,255,255,0.85)"
        />
      </ReactFlow>
    </div>
  )
}
