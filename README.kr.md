# EML Tree Visualizer

> **"All elementary functions from a single binary operator"**  
> Andrzej Odrzywołek (arXiv:2603.21852, 2026)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.0+-000000.svg?logo=bun&logoColor=white)

단 하나의 이항 연산자로 모든 초등 함수를 표현하는 수학적 구조를 브라우저에서 인터랙티브하게 탐구하는 시각화 도구입니다.

**[사용 설명서 →](docs/USER_GUIDE.kr.md)** | **[English README →](README.en.md)**

---

## EML 연산자란?

$$\mathrm{eml}(x,\, y) = e^x - \ln y$$

이 하나의 연산자와 두 가지 단말 노드(상수 `1`, 변수 `x`)만으로 복소수 평면 위의 모든 초등 함수를 이진 트리로 표현할 수 있습니다.

```
S  →  1  |  x  |  eml(S, S)
```

이것이 논문의 핵심 발견입니다. 예를 들어:

| 함수       | EML 이진 트리                                                             | RPN       | K   |
| ---------- | ------------------------------------------------------------------------- | --------- | --- |
| $e$        | $\mathrm{eml}(1,\ 1)$                                               | `11E`     | 3   |
| $e^x$      | $\mathrm{eml}(x,\ 1)$                                               | `x1E`     | 3   |
| $\ln x$    | $\mathrm{eml}(1,\ \mathrm{eml}(\mathrm{mathrm{eml}(1,x),\ 1))$ | `11xE1EE` | 7   |
| $\sqrt{x}$ | $\exp(\frac{1}{2}\ln x)$를 EML 빌딩블록으로 전개                          | —         | 139 |
| $-x$       | $\mathrm{sub}(0,\ x)$를 EML 빌딩블록으로 전개                       | —         | 17  |

K는 RPN 프로그램의 길이로, 트리의 최소 표현 크기(Kolmogorov 복잡도)에 해당합니다.

**비가환성:** $\mathrm{eml}(x,y) \neq \mathrm{eml}(y,x)$ — 좌/우 입력의 순서가 결과를 결정합니다. 트리에서 왼쪽 엣지는 `exp` 경로, 오른쪽 엣지는 `ln` 경로입니다.

---

## 주요 기능

### Standard Mode — 즉각 컴파일

수식을 입력하면 350ms 이내에 EML 트리가 생성됩니다. 논문의 심볼릭 컴파일 규칙을 직접 적용하며, `exp`, `ln`, `sqrt`, `cbrt`, `+`, `-`, `*`, `/`, `^` 을 포함한 모든 기본 연산을 지원합니다.

```
exp(x)      →  K=3,  depth=1   (최적)
ln(x)       →  K=7,  depth=3   (최적)
sqrt(x)     →  K=139, depth=33  (유효, 비최적)
-x          →  K=17,  depth=8   (유효, 비최적)
x^2 + 1     →  K=101, depth=23  (유효, 비최적)
```

### Optimized Mode — K-최솟값 탐색

Web Worker 백그라운드에서 K=1 ~ K=13 범위의 모든 RPN 후보(최대 20,134개)를 열거하여 수치적으로 일치하는 최단 트리를 자동 탐색합니다.

```
exp(ln(x))  →  Standard K=9  ──→  Optimized K=1  (= x, 항등함수)
ln(exp(x))  →  Standard K=9  ──→  Optimized K=1  (= x)
```

수치 검증에는 대수적으로 독립인 초월수(Euler-Mascheroni 상수, Glaisher-Kinkelin 상수 등)를 복소 테스트 포인트로 사용하여 우연한 수치 일치를 방지합니다.

### 인터랙티브 트리 뷰어

- React Flow 기반 캔버스 — 드래그, 줌, 미니맵
- `exp` / `ln` 엣지 라벨로 비가환성 시각화
- 파라미터 패널: x 슬라이더로 f(x) 실시간 계산

### 결과 바

현재 트리의 RPN 문자열, K값, 노드 수, 트리 깊이, 최적 여부를 표시하고 RPN을 원클릭으로 클립보드에 복사합니다.

---

## 구현 구조

```
src/
├── core/
│   ├── symbolicCompiler.ts   # EML 빌딩블록 (emlExp, emlLn, emlSub, emlMul, …)
│   ├── compiler.ts           # 수식 → EML 트리 (Standard Mode)
│   ├── optimizer.ts          # RPN 열거 + 복소수 평가 (Optimized Mode)
│   ├── evaluator.ts          # EML 트리 수치 평가 (IEEE 754 호환)
│   └── rpn.ts                # EML 트리 ↔ RPN 직렬화
├── workers/
│   └── optimizer.worker.ts   # Web Worker 진입점
└── components/
    ├── FormulaInput/         # 입력 + 모드 전환 + 예시 버튼
    ├── EmlViewer/            # React Flow 트리 캔버스
    ├── ExportBar/            # RPN 결과 + 복사
    └── ParameterPanel/       # x 슬라이더 + f(x) 표시
```

`symbolicCompiler.ts`는 `IEmlCompiler` 인터페이스를 구현하며, 향후 Adam optimizer 기반 탐색으로 교체 가능하도록 모듈화되어 있습니다.

---

## 시작하기

### 필요 환경

- [Bun](https://bun.sh/) 1.0+

### 설치 및 실행

```bash
git clone https://github.com/thecloer/eml-visualizer.git
cd eml-visualizer

bun install
bun run dev       # http://localhost:5173
```

### 빌드 및 배포

```bash
bun run build     # dist/ 생성

# main 브랜치 푸시 → GitHub Actions가 GitHub Pages 자동 배포
git push origin main
```

---

## 문서

| 문서                              | 설명                                   |
| --------------------------------- | -------------------------------------- |
| [사용 설명서](docs/USER_GUIDE.md) | 기능 설명, 사용법, 예시 따라하기, FAQ  |
| [기능 명세 (SPEC)](docs/SPEC.md)  | 아키텍처, 데이터 타입, 비기능 요구사항 |

---

## 기술 스택

| 역할              | 기술                                |
| ----------------- | ----------------------------------- |
| Frontend          | React 18, TypeScript                |
| Build             | Vite 8, Bun                         |
| Tree Rendering    | React Flow (@xyflow/react)          |
| Math              | math.js (파싱), 순수 JS (트리 평가) |
| Background Worker | Web Workers API                     |
| Deployment        | GitHub Pages + GitHub Actions       |

---

## 참고 문헌

Odrzywołek, A. (2026). _All elementary functions from a single binary operator._ arXiv:2603.21852.  
[https://arxiv.org/abs/2603.21852](https://arxiv.org/abs/2603.21852)

---

MIT License
