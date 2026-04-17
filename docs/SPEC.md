# EML Tree Visualizer — 기능 명세서 (SPEC)

## 1. 프로젝트 개요

### 1.1 목적

Andrzej Odrzywołek의 논문 "All elementary functions from a single binary operator" (arXiv:2603.21852)를 기반으로, 단일 이항 연산자 $\mathrm{eml}(x, y) = e^x - \ln y$ 와 단말 노드 $\{1,\, x\}$만으로 모든 초등 함수를 이진 트리로 표현하는 과정을 브라우저에서 인터랙티브하게 탐구하는 시각화 도구를 제공합니다.

### 1.2 핵심 수학 배경

**EML 문법 (Context-Free Grammar):**
```
S → 1 | x | eml(S, S)
```

**연산자 정의:**
```
eml(x, y) = exp(x) − ln(y)
```

**비가환성:** $\mathrm{eml}(x,y) \neq \mathrm{eml}(y,x)$이므로, 트리에서 왼쪽·오른쪽 자식의 구분이 핵심 정보입니다.

**RPN 표기법:** 트리를 후위 순회하여 단말 노드는 그 값(1, x)으로, eml 연산 노드는 `E`로 직렬화합니다.

| 함수 | RPN | Kolmogorov 복잡도 K |
|---|---|---|
| $e$ | `11E` | 3 |
| $e^x$ | `x1E` | 3 |
| $\ln x$ | `11xE1EE` | 7 |
| $-x$ | (완전 展開 시 K≈57) | 57 |
| $x \times y$ | (K≈41) | 41 |
| $\pi$ | (트리 깊이 193) | 193+ |

**수치 부트스트래핑 알고리즘:**
1. 알려진 원소 집합 $S_i$ (초기값: $\{1, x\}$)와 목표 집합 $C_i$ (찾으려는 함수들)를 유지합니다.
2. $S_i$ 원소들로 구성 가능한 모든 EML 트리를 K 깊이 한계까지 열거합니다.
3. 후보 트리를 대수적으로 독립인 초월수(Euler-Mascheroni 상수 $\gamma \approx 0.5772$, Glaisher-Kinkelin 상수 $A \approx 1.2824$)에 수치 대입하여 목표 함수와 일치 여부를 검증합니다.
4. 일치하는 트리 발견 시 해당 함수를 $C_i$에서 $S_{i+1}$로 이동합니다.
5. $C_i$가 공집합이 될 때까지 반복합니다.

### 1.3 목표 사용자

수학적 알고리즘, 컴파일러 설계(표현식 트리), 기호 회귀(Symbolic Regression), 아날로그 컴퓨팅에 관심 있는 개발자 및 연구자.

---

## 2. 기술 스택 및 아키텍처

### 2.1 기술 스택

| 계층 | 기술 | 역할 |
|---|---|---|
| Frontend Framework | React 18 | 컴포넌트 기반 UI |
| Build Tool | Vite 5 | HMR 개발 서버, 정적 빌드 |
| Runtime / PM | Bun | 의존성 관리, 스크립트 실행 |
| Tree Rendering | React Flow | 대규모 인터랙티브 이진 트리 |
| Math Core | math.js + complex.js | 복소수 평면 파싱·평가 |
| Background Thread | Web Workers API | UI 블로킹 없는 최적화 탐색 |
| Deployment | GitHub Pages + GitHub Actions | 자동화 정적 배포 |

### 2.2 프로젝트 디렉토리 구조

```
eml-visualizer/
├── public/
├── src/
│   ├── components/         # React UI 컴포넌트
│   │   ├── FormulaInput/   # F1: 수식 입력 영역
│   │   ├── EmlViewer/      # F3: 트리 시각화 캔버스
│   │   ├── ControlPanel/   # F2 모드 전환, F5 슬라이더
│   │   └── ExportBar/      # F4: RPN 스니펫 + 내보내기
│   ├── core/               # 비-UI 핵심 로직
│   │   ├── parser.ts       # 수식 → AST 파서
│   │   ├── compiler.ts     # AST → EML 트리 (Standard Mode)
│   │   ├── optimizer.ts    # 수치 부트스트래핑 (Optimized Mode)
│   │   ├── evaluator.ts    # EML 트리 복소수 평가기
│   │   └── rpn.ts          # EML 트리 ↔ RPN 문자열 변환
│   ├── workers/
│   │   └── optimizer.worker.ts  # Web Worker 진입점
│   ├── types/              # TypeScript 타입 정의
│   └── main.tsx
├── docs/
│   └── SPEC.md
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 배포 워크플로우
└── vite.config.ts
```

### 2.3 핵심 데이터 타입

```typescript
// EML 이진 트리 노드
type EmlNode =
  | { kind: 'const'; value: 1 }
  | { kind: 'var'; name: string }
  | { kind: 'eml'; left: EmlNode; right: EmlNode };

// 복소수 평가 결과
type ComplexValue = { re: number; im: number };

// 컴파일 모드
type CompileMode = 'standard' | 'optimized';

// 컴파일러 결과
interface CompileResult {
  tree: EmlNode;
  rpn: string;           // 예: "11xE1EE"
  nodeCount: number;
  depth: number;
  isOptimal: boolean;    // Optimized Mode에서 최적해 여부
}
```

---

## 3. 기능 명세 (Functional Specifications)

### F1. 수식 입력 및 해석 (Input & Parsing)

**목표:** 사용자가 일반적인 수학 표기법으로 수식을 입력하면 즉시 내부 AST로 파싱합니다.

**입력 필드:**
- 화면 상단 중앙에 단일 텍스트 입력 필드를 배치합니다.
- `debounce(300ms)` 후 자동 파싱을 실행합니다(엔터 입력 시 즉시 실행).

**지원 문법:**
- 기본 연산: `+`, `-`, `*`, `/`, `^` (거듭제곱)
- 초등 함수: `exp()`, `ln()`, `log()`, `sqrt()`, `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`
- 상수: `e`, `pi` 또는 `π`, `i` (허수 단위)
- 변수: `x` (단일 자유 변수)
- 괄호를 통한 우선순위 제어

**에러 처리:**
- 구문 오류 발생 시 입력 필드 하단에 인라인 에러 메시지를 표시합니다.
- 에러 위치(문자 인덱스)를 강조 표시합니다.
- 에러 상태에서 트리 뷰는 마지막 유효 트리를 유지합니다.

**복소수 컨텍스트:**
- 파서의 모든 리프 노드는 내부적으로 복소수 타입으로 표현됩니다.
- `i = eml(eml(1,1), eml(eml(eml(1,1),1), 1))` 형태로 트리 생성이 가능합니다.
- $\pi$ 생성 트리(깊이 193)는 Optimized Mode 탐색 결과를 캐시하여 재활용합니다.

---

### F2. EML 변환 및 최적화 엔진 (Compilation Engine)

**목표:** 파싱된 AST를 EML 문법의 이진 트리로 변환합니다.

#### F2-A. Standard Mode (즉시 컴파일)

논문의 기본 치환 규칙을 재귀적으로 적용하여 트리를 생성합니다. UI 스레드에서 동기 실행하며, 결과를 즉시 표시합니다.

**치환 규칙 예시 (논문 기반):**
```
exp(x)      → eml(x, 1)
ln(x)       → eml(1, eml(eml(1, x), 1))   // RPN: 11xE1EE
x + y       → eml(ln(eml(x,1)), eml(eml(1,1), eml(y,1)))  // exp(ln(x)+ln(y)) 변형
-x          → (depth-57 subtree)
```

#### F2-B. Optimized Mode (백그라운드 탐색)

**알고리즘:** 수치 부트스트래핑 기반 K-레벨 BFS

```
1. Web Worker 시작 (UI 블로킹 없음)
2. K=3부터 시작하여 해당 길이의 모든 유효 RPN 문자열 열거
3. 각 후보를 algebraically independent 상수값으로 수치 평가
4. 목표 함수와 수치 일치 여부 검증 (허용 오차: 1e-10)
5. 일치 발견 시 → 메인 스레드에 결과 postMessage
6. K를 1씩 증가하며 반복 (상한: K=9, 설정 가능)
```

**Web Worker 통신 프로토콜:**
```typescript
// 메인 → 워커
interface WorkerRequest {
  type: 'start' | 'stop';
  targetFn: string;   // 평가 대상 함수 문자열
  maxK: number;       // 탐색 깊이 상한
}

// 워커 → 메인
interface WorkerResponse {
  type: 'progress' | 'result' | 'done';
  progress?: { currentK: number; searched: number };
  result?: CompileResult;
}
```

**UI 상태:**
- 탐색 중에는 진행률(현재 K, 검색된 후보 수)을 표시합니다.
- Standard Mode 결과를 먼저 표시하고, Optimized 결과가 도착하면 교체합니다.
- 사용자가 수식을 변경하면 실행 중인 워커를 즉시 종료(`terminate()`)합니다.

---

### F3. 인터랙티브 EML 트리 시각화 (EML Viewer)

**목표:** EML 트리를 React Flow 기반의 인터랙티브 캔버스로 렌더링합니다.

#### F3-A. 노드 스타일

**eml 노드 (내부 노드):**
- Op-Amp 기호에서 영감을 받은 방향성 다이아몬드 또는 삼각형 형태로 렌더링합니다.
- 왼쪽 입력 포트(exp 경로)와 오른쪽 입력 포트(ln 경로)를 시각적으로 구분합니다 (선 굵기 또는 라벨).
- 비가환성을 강조하기 위해 두 입력 포트에 `exp` / `ln` 라벨을 표시합니다.

**단말 노드 (Leaf node):**
- 상수 `1`: 단순 원형 노드, 텍스트 "1"
- 변수 `x`: 강조 색상 원형 노드, 텍스트 "x" (F5 슬라이더 연동 시 현재 값 병기)

**엣지 스타일:**
- 기본: 얇은 검정 곡선 (`bezier` 타입)
- F5 데이터 흐름 활성화 시: 계산 경로를 따라 강조 색상으로 순차 애니메이션

#### F3-B. 노드 폴딩 (Node Folding)

- eml 노드를 클릭하면 해당 하위 트리 전체를 단일 "접힌 노드"로 축약합니다.
- 접힌 노드에는 하위 트리의 노드 수(예: `[47 nodes]`)를 표시합니다.
- 재클릭 시 원래 하위 트리로 복원합니다.
- 접힌 상태는 트리 레이아웃을 즉시 재계산하여 여백을 최소화합니다.

#### F3-C. 레이아웃 및 네비게이션

- **자동 레이아웃:** Dagre 알고리즘을 사용해 트리를 위→아래 방향으로 자동 배치합니다.
- **미니맵:** 우측 하단에 전체 트리의 축소 윤곽을 표시합니다. 현재 뷰포트 위치를 반전 색상 사각형으로 표시합니다.
- **컨트롤:** 줌 인/아웃 버튼, "Fit to View" 버튼을 캔버스 좌측 하단에 배치합니다.
- **대형 트리 최적화:** 뷰포트 바깥의 노드는 렌더링에서 제외합니다(React Flow 기본 가상화).

---

### F4. 결과물 공유 및 내보내기 (Export & Share)

#### F4-A. RPN 코드 스니펫

- 캔버스 하단 또는 사이드바에 현재 트리의 RPN 문자열을 상시 표시합니다.
- "Copy" 버튼: 클릭 시 클립보드에 복사 후 "Copied!" 피드백(1.5초).
- RPN 문자열은 트리 변경 시 즉시 업데이트됩니다.

**RPN 직렬화 규칙:**
```
단말 노드 1   → "1"
단말 노드 x   → "x"
eml(L, R)    → serialize(L) + serialize(R) + "E"
예: eml(1, eml(eml(1, x), 1)) → "11xE1EE"
```

#### F4-B. 이미지 내보내기

- **SVG 내보내기:** React Flow의 뷰포트를 SVG로 직렬화합니다. 배경 투명, 노드와 엣지만 포함합니다.
- **PNG 내보내기:** SVG를 `<canvas>`에 래스터라이즈 후 PNG Blob으로 다운로드합니다. 기본 해상도: 2x (고해상도 디스플레이 대응).
- 파일명 기본값: `eml-tree-{수식요약}-{timestamp}.svg|png`

---

### F5. 동적 파라미터 튜닝 (Dynamic Parameter Tuning)

**목표:** 변수 $x$에 값을 대입하여 계산 결과와 데이터 흐름을 실시간으로 확인합니다.

**슬라이더 UI:**
- 캔버스 하단에 접이식(collapsible) 패널로 배치합니다.
- 슬라이더 범위: `-10.0` ~ `10.0`, 스텝: `0.01` (텍스트 직접 입력도 지원).
- 현재 $x$ 값과 최종 계산 결과 $f(x)$를 나란히 표시합니다.
- 복소수 결과인 경우 실수부/허수부를 분리하여 표시합니다 (예: `3.14 + 0.00i`).

**데이터 흐름 애니메이션:**
- 슬라이더를 조작하면 모든 노드의 중간 계산값을 즉시 재평가합니다.
- 각 엣지에 해당 경로를 흐르는 값의 크기(절댓값)에 비례한 굵기 또는 불투명도를 적용합니다.
- 최종 출력 노드에서 루트까지의 활성 경로를 단일 강조 색상으로 순차 점등합니다(200ms 딜레이 간격).
- 무한대(`Infinity`) 또는 `NaN` 값이 발생하는 경로는 적색으로 표시합니다.

---

## 4. UI/UX 디자인 원칙

### 4.1 레이아웃 구조

```
┌────────────────────────────────────────────┐
│  [수식 입력 필드]              [Mode: Std|Opt] │  ← 상단 바
├────────────────────────────────────────────┤
│                                            │
│          EML Tree Canvas (React Flow)      │  ← 메인 캔버스
│                                       [🗺] │    (우하단: 미니맵)
│  [±][fit]                                  │    (좌하단: 줌 컨트롤)
├────────────────────────────────────────────┤
│  RPN: 11xE1EE  [Copy]  [↓SVG] [↓PNG]      │  ← 하단 바
│  ▼ x = 1.00 ────●──────── f(x) = 2.718    │    (접이식 슬라이더)
└────────────────────────────────────────────┘
```

### 4.2 색상 팔레트

| 역할 | 색상 |
|---|---|
| 배경 | `#FFFFFF` |
| 기본 텍스트 | `#111111` |
| 기본 엣지/선 | `#333333` |
| 비활성 노드 | `#E5E5E5` |
| 단일 강조 색 | `#0066FF` (파란색 계열, 협의 후 확정) |
| 에러/NaN 경로 | `#FF3B30` |

### 4.3 타이포그래피

- 수식 입력 및 RPN 스니펫: 고정폭 폰트 (`monospace`)
- 노드 라벨: 고정폭 폰트, 10–12px
- UI 레이블: 시스템 폰트, 12–14px

### 4.4 반응형

- 데스크톱(1024px+) 기준 설계입니다. 모바일 레이아웃은 MVP 범위 외입니다.
- 캔버스 영역은 창 크기에 맞게 100% 높이로 동적으로 조정됩니다.

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

| 항목 | 목표 |
|---|---|
| Standard Mode 컴파일 응답 시간 | < 50ms (K≤20 수준의 일반 수식 기준) |
| Optimized Mode 탐색 (K=7) | < 5s (Web Worker 내 실행, UI 비블로킹) |
| 트리 렌더링 (노드 ≤ 200) | 60fps 유지 |
| 초기 페이지 로드 | < 2s (GitHub Pages CDN 기준) |
| 브라우저 지원 | Chrome/Edge 최신 2버전, Firefox 최신 2버전 |

---

## 6. 개발 및 배포 파이프라인

### 6.1 로컬 개발

```bash
bun install       # 의존성 설치
bun run dev       # Vite 개발 서버 (http://localhost:5173)
bun run build     # 프로덕션 빌드 (dist/)
bun run preview   # 빌드 결과 로컬 프리뷰
```

### 6.2 GitHub Actions 자동 배포

`main` 브랜치 푸시 시 자동 실행:

```yaml
# .github/workflows/deploy.yml 개요
# 1. Bun 런타임 설치
# 2. bun install
# 3. bun run build  (vite build --base=/eml-visualizer/)
# 4. dist/ → GitHub Pages (actions/deploy-pages)
```

**주의:** Vite `base` 옵션을 리포지토리명(`/eml-visualizer/`)으로 설정해야 GitHub Pages에서 정적 자산 경로가 올바르게 해석됩니다.

### 6.3 수학 핵심 로직 개발 전략

수치 부트스트래핑(F2-B)과 복소수 EML 트리 파싱(F1)은 수학적 정확성이 중요한 구간입니다. 각 치환 규칙과 평가 함수에 대해 논문의 검증 상수($\gamma$, $A$)를 사용한 단위 테스트를 먼저 작성하고 구현합니다.

---

_Reference: Odrzywołek, A. "All elementary functions from a single binary operator." arXiv:2603.21852 (2026)_
