# EML Tree Visualizer

> **"All elementary functions from a single binary operator"**  
> Andrzej Odrzywołek (arXiv:2603.21852, 2026)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.0+-000000.svg?logo=bun&logoColor=white)

An interactive browser-based visualizer that explores how every elementary function can be expressed as a binary tree built from a single operator.

**[User Guide →](docs/USER_GUIDE.md)** | **[한국어 README →](README.kr.md)**

---

## What is the EML Operator?

$$\mathrm{eml}(x,\, y) = e^x - \ln y$$

With just this one binary operator and two terminal nodes — the constant `1` and the variable `x` — the following grammar generates every elementary function over the complex plane as a binary tree:

```
S  →  1  |  x  |  eml(S, S)
```

This is the central result of Odrzywołek's 2026 paper. Some examples:

| Function   | EML binary tree                                                           | RPN       | K   |
| ---------- | ------------------------------------------------------------------------- | --------- | --- |
| $e$        | $\mathrm{eml}(1,\ 1)$                                               | `11E`     | 3   |
| $e^x$      | $\mathrm{eml}(x,\ 1)$                                               | `x1E`     | 3   |
| $\ln x$    | $\mathrm{eml}(1,\ \mathrm{eml}(\mathrm{eml}(1,x),\ 1))$ | `11xE1EE` | 7   |
| $\sqrt{x}$ | Expanded via EML building blocks                                          | —         | 139 |
| $-x$       | $\mathrm{sub}(0,\ x)$ via EML building blocks                       | —         | 17  |

**K** is the length of the RPN program — the minimum description length of the tree, corresponding to Kolmogorov complexity in the EML model.

**Non-commutativity:** $\mathrm{eml}(x,y) \neq \mathrm{eml}(y,x)$ — the order of left and right inputs determines the result. In the tree, the left edge is the `exp` path and the right edge is the `ln` path.

---

## Features

### Standard Mode — Instant Compilation

Converts a formula to an EML tree in under 350 ms by directly applying the symbolic compilation rules from the paper. Supports `exp`, `ln`, `sqrt`, `cbrt`, `+`, `-`, `*`, `/`, and `^`.

```
exp(x)    →  K=3,   depth=1   (optimal)
ln(x)     →  K=7,   depth=3   (optimal)
sqrt(x)   →  K=139, depth=33  (valid, non-minimal)
-x        →  K=17,  depth=8   (valid, non-minimal)
x^2 + 1   →  K=101, depth=23  (valid, non-minimal)
```

### Optimized Mode — Minimum-K Search

Runs in a Web Worker so the UI never blocks. Enumerates all valid RPN strings from K=1 up to K=13 (up to 20,134 candidates) and finds the shortest tree that numerically matches the target function.

```
exp(ln(x))  →  Standard K=9  ──→  Optimized K=1  (= x, identity)
ln(exp(x))  →  Standard K=9  ──→  Optimized K=1  (= x, identity)
```

Numeric verification uses algebraically independent transcendentals (Euler–Mascheroni constant, Glaisher–Kinkelin constant, etc.) as complex test points, preventing accidental matches.

### Interactive Tree Viewer

- React Flow canvas — drag, zoom, minimap
- `exp` / `ln` edge labels visualize non-commutativity
- Parameter panel: set x with a slider and compute f(x) in real time

### Result Bar

Displays the RPN string, K value, node count, tree depth, and optimality flag for the current tree. One-click copy to clipboard.

---

## Architecture

```
src/
├── core/
│   ├── symbolicCompiler.ts   # EML building blocks (emlExp, emlLn, emlSub, emlMul, …)
│   ├── compiler.ts           # Formula → EML tree (Standard Mode)
│   ├── optimizer.ts          # RPN enumeration + complex evaluation (Optimized Mode)
│   ├── evaluator.ts          # Numeric EML tree evaluation (IEEE 754 compatible)
│   └── rpn.ts                # EML tree ↔ RPN serialization
├── workers/
│   └── optimizer.worker.ts   # Web Worker entry point
└── components/
    ├── FormulaInput/         # Input + mode toggle + example buttons
    ├── EmlViewer/            # React Flow tree canvas
    ├── ExportBar/            # RPN result + copy button
    └── ParameterPanel/       # x slider + f(x) display
```

`symbolicCompiler.ts` implements the `IEmlCompiler` interface and is designed to be swappable with an Adam-optimizer-based search backend in the future.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.0+

### Install & Run

```bash
git clone https://github.com/thecloer/eml-visualizer.git
cd eml-visualizer

bun install
bun run dev       # http://localhost:5173
```

### Build & Deploy

```bash
bun run build     # outputs to dist/

# Push to main → GitHub Actions deploys to GitHub Pages automatically
git push origin main
```

---

## Documentation

| Document                         | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| [User Guide](docs/USER_GUIDE.md) | Feature walkthrough, usage examples, FAQ              |
| [Spec](docs/SPEC.md)             | Architecture, data types, non-functional requirements |

---

## Tech Stack

| Layer             | Technology                                   |
| ----------------- | -------------------------------------------- |
| Frontend          | React 18, TypeScript                         |
| Build             | Vite 8, Bun                                  |
| Tree Rendering    | React Flow (@xyflow/react)                   |
| Math              | math.js (parsing), pure JS (tree evaluation) |
| Background Worker | Web Workers API                              |
| Deployment        | GitHub Pages + GitHub Actions                |

---

## Reference

Odrzywołek, A. (2026). _All elementary functions from a single binary operator._ arXiv:2603.21852.  
[https://arxiv.org/abs/2603.21852](https://arxiv.org/abs/2603.21852)

---

MIT License
