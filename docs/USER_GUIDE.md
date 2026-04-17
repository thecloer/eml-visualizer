# EML Tree Visualizer — User Guide

> **Paper:** Andrzej Odrzywołek, "All elementary functions from a single binary operator" (arXiv:2603.21852, 2026)

**[한국어 버전 →](USER_GUIDE.kr.md)**

---

## Table of Contents

1. [What is EML?](#1-what-is-eml)
2. [Interface Overview](#2-interface-overview)
3. [Entering Formulas](#3-entering-formulas)
4. [Understanding the Two Modes](#4-understanding-the-two-modes)
5. [Reading the Tree Visualization](#5-reading-the-tree-visualization)
6. [RPN Notation and K Complexity](#6-rpn-notation-and-k-complexity)
7. [Computing Values with the Parameter Panel](#7-computing-values-with-the-parameter-panel)
8. [Using the Example Buttons](#8-using-the-example-buttons)
9. [Step-by-Step Walkthroughs](#9-step-by-step-walkthroughs)
10. [Supported Functions and Operators](#10-supported-functions-and-operators)
11. [FAQ](#11-faq)

---

## 1. What is EML?

### The Core Idea

What if every elementary function — exponentials, logarithms, trigonometric functions, roots, and more — could be generated from a single binary operator?

Odrzywołek's 2026 paper identifies exactly such an operator:

$$\mathrm{eml}(x,\, y) = e^x - \ln y$$

With this one operator and two terminal nodes — the constant **1** and the variable **x** — the following simple grammar generates every elementary function over the complex plane as a binary tree:

```
S  →  1  |  x  |  eml(S, S)
```

### Striking Examples

| Function             | EML expression                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| $e^x$                | $\mathrm{eml}(x,\; 1)$                                                   |
| $e$ (Euler's number) | $\mathrm{eml}(1,\; 1)$                                                   |
| $\ln x$              | $\mathrm{mathrm{eml}(1,\; \mathrm{eml}(\mathrm{eml}(1,\; x),\; 1))$ |
| $-x$                 | Depth-8 tree built from the above                                              |
| $\sqrt{x}$           | Depth-33 tree                                                                  |

$e^x$ is just a single EML node: "send $x$ down the exp path and constant $1$ down the ln path."

### Why Does This Matter?

- **Analog computing:** A single circuit element is sufficient to compute any function.
- **Symbolic regression:** The search space for discovering formulas from data is radically simplified.
- **Mathematical beauty:** Extraordinary complexity emerges from a single, minimal rule.

EML Tree Visualizer lets you explore this transformation interactively in your browser.

---

## 2. Interface Overview

```
┌──────────────────────────────────────────────────────────┐
│  [Formula input]                   [Standard | Optimized] │  ← Input area
│  ─────────────────────────────────────────────────────── │
│  Standard  [exp(x)] [ln(x)] [e] [exp(exp(x))] [ln(ln(x))]│  ← Example buttons
│  Optimized [exp(ln(x))] [ln(exp(x))]                     │
│  Deep(K≫19)  sin(x)   cos(x)                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│               EML Tree Canvas (React Flow)               │  ← Main view
│                                                          │
│  [−] [+] [fit]                              [minimap]    │
├──────────────────────────────────────────────────────────┤
│  RPN: x1E    K=3  3 nodes  depth 1  ✓ optimal  [Copy]    │  ← Result bar
├──────────────────────────────────────────────────────────┤
│  ▼ x =  1.00  [────●────────────]  f(x) = 2.718282+0i    │  ← Parameter panel
└──────────────────────────────────────────────────────────┘
```

| Area                | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| **Input area**      | Enter formulas, switch modes, select examples           |
| **EML Tree Canvas** | Interactive binary tree visualization                   |
| **Result bar**      | RPN string, K complexity, node count, depth, optimality |
| **Parameter panel** | Set x and compute f(x)                                  |

---

## 3. Entering Formulas

### Basic Input

Type a formula into the top input field. The tree updates automatically after a **350 ms** debounce. Press `Enter` for an immediate update.

```
exp(x)         → exponential function
ln(x)          → natural logarithm
sqrt(x)        → square root
x^2            → squaring
-x             → negation
x + 1          → addition
x * x          → multiplication
x / 2          → division
exp(x) + ln(x) → compound expression
```

### Supported Constants

| Input      | Meaning                                               |
| ---------- | ----------------------------------------------------- |
| `1`        | The primitive EML terminal node                       |
| `e`        | Euler's number ≈ 2.71828                              |
| `2` – `10` | Integer constants (built from repeated addition of 1) |
| `0`        | Zero (built symbolically)                             |

> **Note:** `pi`, `i`, and non-integer constants like `3.14` are not yet supported. π requires a tree of depth 193+, which is far beyond the current search range.

### When an Error Appears

A red error message appears below the input field. For example:

```
Function 'sin' is not directly supported in Standard Mode.
```

If a **"Try Optimized →"** button appears alongside the error, click it to switch to Optimized Mode automatically.

---

## 4. Understanding the Two Modes

Switch between modes using the toggle button in the top-right corner.

### Standard Mode — Instant Compilation

**Characteristics:** Results in milliseconds.

Applies the symbolic compilation rules from the paper directly and recursively. The resulting tree is always mathematically correct, but **does not guarantee the minimum K value.**

All supported functions are compiled immediately, even complex expressions like `sqrt(x)` or `x^2 + 1` that produce trees with hundreds of nodes.

```
exp(x)   → K=3    (optimal)
ln(x)    → K=7    (optimal)
sqrt(x)  → K=139  (valid but not minimal)
-x       → K=17   (valid but not minimal; paper's minimum is K≈57)
```

### Optimized Mode — Minimum-K Search

**Characteristics:** Takes longer but finds the shortest representation.

Enumerates every valid RPN string from K=1 to K=13 and searches for one that numerically matches the target function. Runs in a Web Worker so **the UI stays responsive.**

Progress is shown while searching:

```
Searching… K=5 · 14,532 candidates
```

When a shorter tree than Standard Mode's result is found, the display updates immediately.

```
exp(ln(x)) → Standard K=9  →  Optimized K=1  (= x, the identity function!)
ln(exp(x)) → Standard K=9  →  Optimized K=1  (= x)
```

If the search finishes without finding a match within K≤13:

```
Not found within K≤13 (20,134 candidates searched).
This function likely requires a much deeper EML tree.
```

> **Tip:** Try `exp(ln(x))` or `ln(exp(x))` in Optimized Mode. The algorithm automatically discovers that these simplify to K=1 — the single node `x`.

---

## 5. Reading the Tree Visualization

### Node Types

```
┌─────────────┐
│ eml         │   ← Internal node: rectangle labeled "eml"
│  exp │  ln  │     left child = exp path, right child = ln path
└──────┴──────┘
      │       │
    (left)  (right)
   exp path  ln path

   ┌───┐      ┌───┐
   │ 1 │      │ x │   ← Terminal nodes: circles
   └───┘      └───┘
 const (black)  var (blue)
```

### Edge Labels

Every edge is labeled either `exp` or `ln`. This makes the **non-commutativity** visible at a glance.

- **Left edge (exp):** the child's value is passed into $e^{(\cdot)}$
- **Right edge (ln):** the child's value is passed into $\ln(\cdot)$

Since $\mathrm{eml}(x,y) = e^x - \ln y$, swapping left and right gives a completely different function.

### Canvas Navigation

| Action        | How                                             |
| ------------- | ----------------------------------------------- |
| Pan           | Click and drag on empty space                   |
| Zoom          | Mouse wheel, or `+` / `−` buttons (bottom-left) |
| Fit to screen | `fit` button (bottom-left)                      |
| Overview      | Minimap (bottom-right)                          |

### When the Tree is Very Large

`sqrt(x)`, `-x`, and other symbolically compiled results can have dozens or hundreds of nodes. In that case:

1. Press the **`fit` button** to auto-scale the tree to fit the viewport.
2. Use the **minimap** (bottom-right) to orient yourself.
3. Scroll to zoom in on a specific region.

---

## 6. RPN Notation and K Complexity

### What is RPN?

The EML tree is serialized into a one-line string by a post-order traversal.

| Token | Meaning                |
| ----- | ---------------------- |
| `1`   | Constant terminal node |
| `x`   | Variable terminal node |
| `E`   | EML operator node      |

**How to read it:** Process tokens left-to-right. Push `1` and `x` onto a stack. When you see `E`, pop the top two values and form `eml(second, top)`.

**Example: `11xE1EE` = ln(x)**

```
Tokens: 1  1  x  E  1  E  E

Stack trace:
[1]
[1, 1]
[1, 1, x]
[1, eml(1,x)]          ← E: pop x and 1 → eml(1, x)
[1, eml(1,x), 1]
[1, eml(eml(1,x), 1)]  ← E: pop 1 and eml(1,x) → eml(eml(1,x), 1)
[eml(1, eml(eml(1,x), 1))]  ← E: final result

= exp(1) − ln(eml(eml(1,x), 1))
= e − ln(exp(e − ln(x)))
= e − (e − ln(x)) = ln(x) ✓
```

### K Complexity

**K = length of the RPN string** = total number of nodes in the tree (leaves + operators).

A smaller K means a more concise EML representation — the Kolmogorov complexity of the function in the EML model.

| K                | Total candidates | Approx. search time |
| ---------------- | ---------------- | ------------------- |
| 1                | 2                | < 1 ms              |
| 3                | 4                | < 1 ms              |
| 5                | 14               | < 1 ms              |
| 7                | 42               | < 1 ms              |
| 9                | 132              | < 1 ms              |
| 11               | 429              | < 10 ms             |
| 13               | 1,430            | < 100 ms            |
| **Total (K≤13)** | **20,134**       | **< 1 s**           |

### Reading the Result Bar

```
RPN: 11xE1EE    K=7   7 nodes   depth 3   [Copy]
                 ▲       ▲          ▲
           RPN length  node count  max depth
```

The `✓ optimal` badge means Optimized Mode confirmed this is the shortest possible representation within K≤13.

---

## 7. Computing Values with the Parameter Panel

Expand the panel at the bottom of the screen (click ▼) to set x and see f(x).

### Using the Slider

```
x =  2.00  [───────●────────────]  →  f(x) = 7.389056 + 0.000000i
              -10            +10
```

Drag the slider or type a value directly into the number input. Range: −10.0 to +10.0.

### Interpreting the Result

Results are always displayed as complex numbers:

```
f(x) = 7.389056 + 0.000000i   → real result  (exp(2) ≈ 7.389)
f(x) = 0.000000 + 1.000000i   → imaginary result
f(x) = Infinity                → diverges (e.g. ln(0))
f(x) = NaN                    → undefined
```

### Things to Try

- Enter `ln(x)`, set x = 1 → f(x) = 0
- Enter `exp(ln(x))` in Optimized Mode → K=1; verify f(x) = x for any x
- Enter `sqrt(x)`, set x = 4 → f(x) = 2.000
- Enter `-x`, set x = 3 → f(x) = −3.000

---

## 8. Using the Example Buttons

Three rows of example buttons appear below the input field.

### Standard Examples

| Button        | Formula       | Notes                         |
| ------------- | ------------- | ----------------------------- |
| `1`           | `1`           | Simplest terminal node, K=1   |
| `e`           | `e`           | Euler's number, K=3           |
| `exp(x)`      | `exp(x)`      | Exponential, K=3 (optimal)    |
| `ln(x)`       | `ln(x)`       | Natural log, K=7 (optimal)    |
| `exp(exp(x))` | `exp(exp(x))` | Double exponential, K=5       |
| `ln(ln(x))`   | `ln(ln(x))`   | Double log, K=13              |
| `sqrt(x)`     | `sqrt(x)`     | Square root, K=139 (symbolic) |
| `x^2`         | `x^2`         | Square, K=75 (symbolic)       |
| `-x`          | `-x`          | Negation, K=17 (symbolic)     |

### Optimized Examples

| Button       | Formula      | Notes                            |
| ------------ | ------------ | -------------------------------- |
| `exp(ln(x))` | `exp(ln(x))` | Standard K=9 → **Optimized K=1** |
| `ln(exp(x))` | `ln(exp(x))` | Standard K=9 → **Optimized K=1** |

> These demonstrate that the optimizer automatically discovers mathematical identities: $e^{\ln x} = x$ and $\ln(e^x) = x$.

### Deep (K ≫ 19) — Informational Only

`sin(x)` and `cos(x)` require complex intermediate values and K in the hundreds. They are shown with a dashed border and are not clickable — they serve as a reminder of the depth of the EML representation space.

---

## 9. Step-by-Step Walkthroughs

### Walkthrough 1: Understanding the ln(x) Tree

1. Type `ln(x)` in the input field.
2. Check the result bar: `RPN: 11xE1EE  K=7`.
3. Trace the tree manually:
   - Root: `eml(1, subtree)`
   - Subtree: `eml(eml(1, x), 1)`
   - Formula: $e^1 - \ln(e^{e - \ln x} - 0) = e - (e - \ln x) = \ln x$ ✓
4. In the parameter panel, set x = e (≈ 2.718) → f(x) = 1.000.

### Walkthrough 2: Discovering an Identity with Optimized Mode

1. Switch to **Optimized** mode using the top-right toggle.
2. Type `exp(ln(x))`.
3. Watch the status: `Starting search…`
4. After a moment: `RPN: x  K=1  1 nodes  depth 0  ✓ optimal`
5. The canvas shows a single blue circle node labeled `x`.
6. Interpretation: $e^{\ln x} = x$ — the optimizer found this identity automatically.

### Walkthrough 3: Exploring the sqrt(x) Symbolic Tree

1. Type `sqrt(x)` (Standard Mode).
2. Result bar shows: `K=139  depth=33` — a large tree.
3. Press **`fit`** to scale it to fit the viewport.
4. Use the minimap to explore the structure.
5. Set x = 4 in the parameter panel → f(x) = 2.000 ✓

### Walkthrough 4: Compound Expressions

1. Type `x^2 + 1`.
2. Standard Mode instantly produces the tree (K ≈ 101).
3. Set x = 3 → f(x) = 10.000 (3² + 1 = 10) ✓
4. Switch to Optimized Mode — the optimizer exhausts K≤13 without finding a shorter form:
   ```
   Not found within K≤13 (20,134 candidates searched).
   ```

---

## 10. Supported Functions and Operators

### Operators

| Example | Supported   | Notes                |
| ------- | ----------- | -------------------- |
| `x + y` | ✅ Standard | Symbolic compilation |
| `x - y` | ✅ Standard | Symbolic compilation |
| `x * y` | ✅ Standard | Symbolic compilation |
| `x / y` | ✅ Standard | Symbolic compilation |
| `x ^ n` | ✅ Standard | Symbolic compilation |
| `-x`    | ✅ Standard | Symbolic compilation |

### Functions

| Example           | Supported   | Notes                        |
| ----------------- | ----------- | ---------------------------- |
| `exp(x)`          | ✅ Standard | K=3, optimal                 |
| `ln(x)`, `log(x)` | ✅ Standard | K=7, optimal                 |
| `sqrt(x)`         | ✅ Standard | Symbolic (K=139)             |
| `cbrt(x)`         | ✅ Standard | Cube root, symbolic          |
| `eml(x, y)`       | ✅ Standard | Direct EML operator input    |
| `sin(x)`          | ❌          | K >> 19, not yet implemented |
| `cos(x)`          | ❌          | K >> 19, not yet implemented |
| `tan(x)`          | ❌          | Not yet implemented          |

### Constants

| Input      | Supported | Notes                  |
| ---------- | --------- | ---------------------- |
| `1`        | ✅        | EML primitive terminal |
| `e`        | ✅        | `eml(1,1)`, K=3        |
| `0`        | ✅        | Built symbolically     |
| `2` – `10` | ✅        | Repeated addition of 1 |
| `pi`       | ❌        | Requires K=193+        |
| `i`        | ❌        | Not yet implemented    |

---

## 11. FAQ

**Q: Standard Mode produced a large K. Is there a shorter representation?**

There might be. Switch to Optimized Mode — it searches all representations up to K=13. If the minimum K exceeds 13, Optimized Mode will report "Not found" but the Standard result is still mathematically correct.

---

**Q: Optimized Mode found K=1 for `exp(ln(x))`. Is that right?**

Yes, completely. Since $e^{\ln x} = x$, the function is just the identity, representable by a single node `x` with K=1. The optimizer found this mathematical identity automatically.

---

**Q: Why does `sin(x)` produce an error?**

Representing $\sin(x)$ as an EML tree requires Euler's formula with complex intermediates, and the minimum K is estimated at well over 19. This is beyond the current search range. Support via a deeper search backend (Adam optimizer) is planned for the future.

---

**Q: The tree doesn't fit on screen.**

Click the **`fit`** button (bottom-left of the canvas) to auto-fit the entire tree to the viewport. Use the minimap (bottom-right) to navigate large trees.

---

**Q: Can I trust the Standard Mode result's computed value?**

Absolutely. While Standard Mode does not guarantee minimum K, the generated tree is always **mathematically exact**. You can verify this in the parameter panel: `sqrt(4)` → 2.000, `-3` → −3.000, etc.

---

**Q: Can I type RPN directly to draw a tree?**

Not currently. The app only accepts standard mathematical notation as input and converts it automatically. Direct RPN input is planned for a future release.

---

**Q: How long does Optimized Mode take?**

Typically under one second for K≤13 (20,134 candidates). If you type a new formula while searching, the current search is terminated immediately and a new one begins.

---

## Appendix: Key Formula Proofs

### exp(x) = eml(x, 1)

$$\mathrm{eml}(x, 1) = e^x - \ln 1 = e^x - 0 = e^x \checkmark$$

### ln(x) = eml(1, eml(eml(1, x), 1))

Step 1: $\mathrm{eml}(1, x) = e^1 - \ln x = e - \ln x$

Step 2: $\mathrm{eml}(e - \ln x,\ 1) = \exp(e - \ln x) - 0 = \exp(e - \ln x)$

Step 3: $\mathrm{eml}(1,\ \exp(e - \ln x)) = e - \ln(\exp(e - \ln x)) = e - (e - \ln x) = \ln x \checkmark$

### e = eml(1, 1)

$$\mathrm{eml}(1, 1) = e^1 - \ln 1 = e - 0 = e \checkmark$$

### neg(x) = sub(zero, x)

$$\mathrm{zero} = \mathrm{eml}(1,\ \exp(e)) = e^1 - \ln(\exp(e)) = e - e = 0$$

$$\mathrm{sub}(a, b) = \mathrm{eml}(\ln a,\ \exp b) = \exp(\ln a) - \ln(\exp b) = a - b$$

$$\mathrm{neg}(x) = \mathrm{sub}(0, x) = 0 - x = -x \checkmark$$

---

_Paper: [All elementary functions from a single binary operator — Andrzej Odrzywołek (arXiv:2603.21852)](https://arxiv.org/abs/2603.21852)_
