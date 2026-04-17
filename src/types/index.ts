// EML binary tree node
export type EmlNode =
  | { kind: 'const'; value: 1 }
  | { kind: 'var'; name: 'x' }
  | { kind: 'eml'; left: EmlNode; right: EmlNode }

export type CompileMode = 'standard' | 'optimized'

export interface CompileResult {
  tree: EmlNode
  rpn: string
  nodeCount: number
  depth: number
  isOptimal: boolean
}

export interface ComplexNum {
  re: number
  im: number
}

// Web Worker messages
export interface WorkerRequest {
  type: 'start' | 'stop'
  targetExpr?: string
  maxK?: number
}

export interface WorkerResponse {
  type: 'progress' | 'result' | 'error' | 'done'
  progress?: { currentK: number; searched: number }
  result?: CompileResult
  error?: string
  // 'done': search exhausted all K ≤ maxK without finding a match
  totalSearched?: number
  maxKReached?: number
}
