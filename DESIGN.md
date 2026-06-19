# DESIGN SYSTEM SPECIFICATION - UNSU PLATFORM (v0.3)

> **디자인 테마:** Warm Editorial Modern with Gold Accents (우아하고 따뜻한 미니멀리즘 대시보드)
> 본 문서는 `unsu-ai-dashboard` 디자인 자산을 기반으로 작성된 싱글 소스 오브 트루스(SSOT) 디자인 토큰 문서입니다.

---

## 1. 디자인 토큰 및 CSS 변수 (CSS Custom Properties)

### 1-1. 색상 토큰 (OKLCH Color System)

| 토큰명 | Light Mode (Cream) | Dark Mode (Deep Slate) | 비고 |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(0.985 0.003 92)` | `oklch(0.155 0.006 70)` | 메인 레이아웃 배경색 |
| `--foreground` | `oklch(0.16 0.008 60)` | `oklch(0.96 0.004 90)` | 메인 텍스트 컬러 |
| `--card` | `oklch(0.995 0.002 92)` | `oklch(0.19 0.007 70)` | 카드 컨테이너 배경색 |
| `--card-foreground` | `oklch(0.16 0.008 60)` | `oklch(0.96 0.004 90)` | 카드 텍스트 컬러 |
| `--primary` | `oklch(0.18 0.008 60)` | `oklch(0.96 0.004 90)` | 핵심 액션 단추 배경 |
| `--primary-foreground`| `oklch(0.985 0.003 92)` | `oklch(0.16 0.006 70)` | 핵심 액션 단추 글씨 |
| `--secondary` | `oklch(0.955 0.004 92)` | `oklch(0.24 0.008 70)` | 보조 단추 배경 |
| `--secondary-foreground`| `oklch(0.18 0.008 60)` | `oklch(0.96 0.004 90)` | 보조 단추 글씨 |
| `--gold` | `oklch(0.72 0.15 68)` | `oklch(0.78 0.15 72)` | 황금 동선/매출 등 번영 강조색 |
| `--border` | `oklch(0.9 0.005 80)` | `oklch(1 0 0 / 11%)` | 구분선 및 경계선 |

### 1-2. 둥글기 (Border Radius)
*   **`--radius`**: `0.875rem` (14px)
*   **Small (`rounded-sm`)**: `calc(var(--radius) * 0.5)` (7px)
*   **Medium (`rounded-md`)**: `calc(var(--radius) * 0.75)` (10.5px)
*   **Large (`rounded-lg`)**: `var(--radius)` (14px)
*   **Extra Large (`rounded-xl`)**: `calc(var(--radius) * 1.5)` (21px)

---

## 2. 타이포그래피 (Typography)

장년층 기사들의 가독성 최적화를 위해 기본 폰트 크기 및 높이를 130% 상향 조정하며, 헤드라인과 단원 제목에는 세련된 인스트루먼트 산스(Instrument Sans)를 사용합니다.

```css
/* 타이포그래피 수동 유틸리티 클래스 매핑 */
.hero-head {
  font-family: var(--font-heading);
  font-size: clamp(3rem, 11vw, 7.5rem);
  font-weight: 500;
  line-height: 0.92;
  letter-spacing: -0.04em;
}

.mono-label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.text-body-lg {
  font-size: 1.25rem; /* 20px - 시니어 가독성 */
  line-height: 1.8;
  font-weight: 400;
}
```

---

## 3. 프리미엄 데코레이션 및 특수 유틸리티 (Decoration & Effects)

### 3-1. 격자 보더 패턴 (`.grid-lines`)
배경 뒤에 얇고 모던한 느낌을 주는 세로 격자선을 배치합니다.
```css
.grid-lines {
  background-image: linear-gradient(to right, var(--line) 1px, transparent 1px);
  background-size: 12.5% 100%;
}
```

### 3-2. 도트 조명 필드 (`.dot-field`)
```css
.dot-field {
  background-image: radial-gradient(var(--muted-foreground) 1px, transparent 1.4px);
  background-size: 22px 22px;
  opacity: 0.18;
  mask-image: radial-gradient(circle at 70% 35%, black 0%, transparent 70%);
}
```

### 3-3. 미세 반응형 탭 액션 (`.tap`)
시니어 기사들이 터치 피드백을 직관적으로 인지할 수 있도록 스케일 다운 트랜지션을 내장합니다.
```css
.tap {
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease;
}
.tap:active {
  transform: scale(0.97);
}
```
