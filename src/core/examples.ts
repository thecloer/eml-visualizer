// Functions from "All elementary functions from a single binary operator"
// K = Kolmogorov complexity = RPN token count (minimum representable length)

export interface FunctionExample {
  label: string
  expr: string
  rpn: string      // known optimal RPN ('' = must search)
  k: number        // known K (0 = unknown / too large to search)
  mode: 'standard' | 'optimized'
  description: string
}

export const EXAMPLES: FunctionExample[] = [
  // ── Terminal nodes ─────────────────────────────────────────────────────────
  {
    label: '1',
    expr: '1',
    rpn: '1',
    k: 1,
    mode: 'standard',
    description: 'Constant 1 — primitive leaf node',
  },
  {
    label: 'e',
    expr: 'e',
    rpn: '11E',
    k: 3,
    mode: 'standard',
    description: "eml(1,1) = exp(1) − ln(1) = e",
  },

  // ── Core functions ─────────────────────────────────────────────────────────
  {
    label: 'exp(x)',
    expr: 'exp(x)',
    rpn: 'x1E',
    k: 3,
    mode: 'standard',
    description: 'eml(x,1) = exp(x) − ln(1) = exp(x)',
  },
  {
    label: 'ln(x)',
    expr: 'ln(x)',
    rpn: '11xE1EE',
    k: 7,
    mode: 'standard',
    description: '3-level nesting: eml(1, eml(eml(1,x), 1))',
  },

  // ── Compositions ──────────────────────────────────────────────────────────
  {
    label: 'exp(exp(x))',
    expr: 'exp(exp(x))',
    rpn: 'x1E1E',
    k: 5,
    mode: 'standard',
    description: 'eml(eml(x,1), 1) — double exponential',
  },
  {
    label: 'ln(ln(x))',
    expr: 'ln(ln(x))',
    rpn: '1111xE1EEE1EE',
    k: 13,
    mode: 'standard',
    description: 'Double logarithm — K=13',
  },

  // ── Symbolic compiler: arithmetic & sqrt ─────────────────────────────────
  {
    label: 'sqrt(x)',
    expr: 'sqrt(x)',
    rpn: '',
    k: 0,
    mode: 'standard',
    description: 'sqrt(x) = exp(ln(x)/2) — symbolic compiler (not K-minimal)',
  },
  {
    label: 'x^2',
    expr: 'x^2',
    rpn: '',
    k: 0,
    mode: 'standard',
    description: 'x² = exp(2·ln(x)) — symbolic compiler',
  },
  {
    label: '-x',
    expr: '-x',
    rpn: '',
    k: 0,
    mode: 'standard',
    description: 'Negation via eml_sub(zero, x) — symbolic compiler',
  },

  // ── Optimized Mode: simplification examples ────────────────────────────────
  // These show that Optimized Mode reduces over-compiled Standard trees
  // to the minimal-K form. Great for understanding Kolmogorov complexity.
  {
    label: 'exp(ln(x))',
    expr: 'exp(ln(x))',
    rpn: 'x',           // exp(ln(x)) = x → optimal K=1 !
    k: 1,
    mode: 'optimized',
    description: 'Standard→K=9, Optimized finds K=1: exp(ln(x))=x',
  },
  {
    label: 'ln(exp(x))',
    expr: 'ln(exp(x))',
    rpn: 'x',           // ln(exp(x)) = x → optimal K=1
    k: 1,
    mode: 'optimized',
    description: 'Standard→K=9, Optimized finds K=1: ln(exp(x))=x',
  },
  {
    label: 'eml(x,x)',
    expr: 'exp(x)',      // eml(x,x) = exp(x) − ln(x) — try eml directly
    rpn: '',
    k: 0,
    mode: 'optimized',
    description: 'Optimized search for shortest form of exp(x)−ln(x)',
  },
]

// ── Deep functions — cannot be found by K≤13 brute-force search ───────────────
// These require complex intermediate values and/or very large K.
// Shown as "informational" only (not clickable search targets).
export const DEEP_FUNCTION_INFO = [
  { label: 'sin(x)', minK: null, note: 'Requires complex intermediates, K >> 19 — not yet supported' },
  { label: 'cos(x)', minK: null, note: 'Requires complex intermediates, K >> 19 — not yet supported' },
]

export const STANDARD_EXAMPLES = EXAMPLES.filter(e => e.mode === 'standard')
export const OPTIMIZED_EXAMPLES = EXAMPLES.filter(e => e.mode === 'optimized')
