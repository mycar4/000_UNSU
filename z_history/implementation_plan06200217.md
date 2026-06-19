# FO 앱 프리미엄 디자인(Stitch) 업그레이드 계획

기존 `unsu-ai-dashboard`의 고급스러운 "Warm Editorial" 퀄리티를 새로운 앱 뼈대(FO)에 완벽하게 이식하기 위한 전면적인 디자인 리팩토링 계획입니다. 뼈대(Scaffolding) 위주의 거친 UI를 버리고, 실제 프리미엄 웹앱 수준의 디테일을 살립니다.

## User Review Required
아래의 디자인 복원 및 업그레이드 계획을 확인해 주세요. 동의하시면 즉시 CSS 토큰 확장 및 페이지별 프리미엄 UI 렌더링 작업을 시작하겠습니다!

## 1. 문제 원인 분석
현재 FO의 UI는 "기능적인 라우팅 뼈대"만 잡혀 있어, 기존 디자인(`globals.css`, `hero.tsx` 등)에 있던 아래의 고급 요소들이 누락되었습니다.
*   세밀한 음영 토큰 누락 (`--muted`, `--accent`, `--popover` 등)
*   타이포그래피 디테일 누락 (`hero-head`의 clamp 스케일링, `mono-label` 포인트)
*   유려한 여백(Spacing)과 Glassmorphism(반투명/블러) 처리 부재

## 2. 해결 및 업그레이드 계획

### [MODIFY] `fo/src/index.css` (디자인 토큰 전면 복원)
*   기존 `globals.css`에 있던 전체 OKLCH 변수(`muted`, `accent`, `ring`, `input` 등)를 Day/Sunset/Night 테마별로 모두 확장 정의합니다.
*   `hero-head`, `mono-label`, `text-balance`, `text-pretty` 등 프리미엄 텍스트 렌더링을 위한 유틸리티 클래스를 복원합니다.

### [MODIFY] `fo/src/components/layout/` (레이아웃 고급화)
*   **TopAppBar**: 배경에 `bg-background/80 backdrop-blur-md` 글래스모피즘 효과를 강화하고 선을 더 얇고 우아하게(`border-border`) 처리합니다.
*   **BottomNavBar**: 시니어의 조작감을 살리면서도 둔탁하지 않게, 아이콘과 라벨의 비율을 조정하고 액티브 상태일 때 부드러운 배경 하이라이트(`bg-accent`)를 추가합니다.

### [MODIFY] `fo/src/pages/` (4대 핵심 페이지 프리미엄 렌더링)
*   단순한 박스 형태(`bg-card p-6`)를 벗어나, 기존 `hero.tsx`의 퀄리티처럼 섬세한 폰트 대비(`text-muted-foreground`), 컴포넌트 간의 넉넉하고 우아한 여백(Fluid Typography 적용), 미세한 테두리(`divide-border`)를 적용하여 퀄리티를 최상으로 끌어올립니다.
*   **Zero-Touch 오디오 버튼 (G-PAN)**: 네온 글로우 효과와 맥동(Pulse) 애니메이션을 추가하여 운전 중에도 압도적인 시인성을 제공합니다.
*   **데이터 차트/리더보드**: 숫자는 모두 `JetBrains Mono` 등의 고정폭 폰트(`mono-label`)를 믹스하여 데이터의 신뢰감을 높입니다.

## 3. 검증 계획
*   업그레이드 후, `unsu-ai-dashboard`의 랜딩 페이지 퀄리티와 동일한지 시각적으로 비교 확인합니다.
*   다크모드(Night) 및 노을(Sunset) 테마 전환 시 디자인 토큰이 어색함 없이 모두 매핑되는지 점검합니다.
