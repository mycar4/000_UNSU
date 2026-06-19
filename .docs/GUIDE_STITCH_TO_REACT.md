# Google Stitch HTML → React 전환 가이드

> **목적:** Google Stitch에서 생성된 정적 HTML 디자인을 Vite + React + TailwindCSS 환경으로 전환할 때 반복 발생하는 문제를 사전에 방지하기 위한 표준 작업 체크리스트입니다.

---

## 1. 디자인 토큰 전환 (DESIGN.md → CSS Variables)

### 1-1. 색상 토큰

Stitch HTML은 `tailwind.config`의 `theme.extend.colors`에 디자인 토큰을 인라인으로 정의합니다.  
React 프로젝트에서는 `index.css`의 `@theme` 블록에 CSS 커스텀 프로퍼티로 전환해야 합니다.

```css
/* ✅ 올바른 전환 (index.css @theme 블록) */
@theme {
  --color-primary: #1a146b;
  --color-secondary: #712ae2;
  --color-surface: #f8f9ff;
  --color-on-surface: #0d1c2e;
  --color-outline-variant: #c8c5d3;
  /* ... DESIGN.md의 모든 색상 토큰을 1:1 매핑 */
}
```

> [!IMPORTANT]
> Stitch HTML의 `tailwind.config` 내 색상 키 이름을 **그대로** CSS 변수명으로 사용해야 합니다.  
> 예: `"on-surface-variant": "#474651"` → `--color-on-surface-variant: #474651;`

### 1-2. 간격(Spacing) 토큰

```css
@theme {
  --spacing-margin-mobile: 16px;
  --spacing-margin-desktop: 32px;
  --spacing-container-max: 1280px;
  --spacing-gutter: 24px;
  --spacing-stack-xs: 4px;
  --spacing-stack-md: 16px;
  --spacing-stack-xl: 40px;
}
```

### 1-3. 타이포그래피 토큰 — ⚠️ 가장 빈번한 깨짐 원인

Stitch HTML은 `tailwind.config`의 `fontSize`에 `lineHeight`, `fontWeight`, `letterSpacing`을 튜플로 묶어 정의합니다.  
**TailwindCSS v4의 `@theme` 블록에서는 `--text-*` 변수에 font-size만 들어가므로**, 나머지 속성은 **별도의 CSS 유틸리티 클래스로 직접 선언**해야 합니다.

```css
/* ❌ 이것만으로는 부족합니다 — font-size만 적용됩니다 */
@theme {
  --text-body-sm: 14px;
}

/* ✅ 반드시 아래처럼 완전한 유틸리티 클래스를 추가 선언해야 합니다 */
.text-body-sm {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
}

.text-label-caps {
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.05em;
  font-weight: 600;
  text-transform: uppercase;  /* label-caps는 uppercase가 필수! */
}

.text-headline-md {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
}

.text-price-lg {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}

.text-display-lg {
  font-size: 48px;
  line-height: 56px;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.text-display-lg-mobile {
  font-size: 32px;
  line-height: 40px;
  letter-spacing: -0.01em;
  font-weight: 700;
}
```

> [!CAUTION]
> **DESIGN.md에 정의된 모든 타이포그래피 토큰**에 대해 위와 같은 유틸리티 클래스를 `index.css`에 수동 선언하지 않으면,  
> 폰트 크기는 맞지만 줄 간격·글꼴 굵기가 원본 HTML과 달라져 **레이아웃이 확연히 깨져 보입니다.**

---

## 2. Material Symbols Outlined 아이콘

### 문제 현상

Stitch HTML에서 `<span class="material-symbols-outlined">search</span>` 형태로 사용하는 아이콘이  
React에서는 "search", "notifications" 등의 **텍스트가 그대로 노출**되는 현상이 발생합니다.

### 원인

TailwindCSS 리셋(Preflight)이나 React 렌더링 타이밍에 의해 `material-symbols-outlined` 폰트 패밀리가  
상속 체인에서 밀려나거나, 폰트 로드 전에 렌더링이 완료되어 폴백 폰트로 표시됩니다.

### 해결 방법

`index.css`에 아래 클래스를 **반드시** 포함시켜야 합니다:

```css
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined' !important;
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}
```

그리고 `index.html`의 `<head>`에 폰트 시트 로드를 확인합니다:

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

---

## 3. Glassmorphism / Custom CSS 클래스 전환

Stitch HTML의 `<style>` 블록에 정의된 커스텀 CSS 클래스는 React의 `index.css`로 옮겨야 합니다.

### 필수 전환 대상 클래스 체크리스트

| Stitch HTML 클래스 | 용도 | CSS 정의 |
|---|---|---|
| `.glass-card` | 반투명 카드 배경 | `background: rgba(255,255,255,0.7); backdrop-filter: blur(12px);` |
| `.hero-gradient` | 히어로 섹션 배경 그라데이션 | `background: radial-gradient(...)` |
| `.ai-pulse` | AI 아이콘 펄스 애니메이션 | `@keyframes pulse-glow { ... }` |
| `.ai-glow` | AI 카드 미세 그림자 | `box-shadow: 0 0 20px rgba(113,42,226,0.1);` |
| `.custom-scrollbar` | 커스텀 스크롤바 | `::-webkit-scrollbar { width: 4px; }` |

---

## 4. HTML 속성 → JSX 속성 변환 규칙

| HTML 속성 | JSX 속성 | 비고 |
|---|---|---|
| `class="..."` | `className="..."` | 가장 기본적인 변환 |
| `for="..."` | `htmlFor="..."` | `<label>` 태그에서 사용 |
| `tabindex="0"` | `tabIndex={0}` | camelCase + 숫자는 `{}` |
| `onclick="..."` | `onClick={handler}` | 인라인 JS → 함수 바인딩 |
| `data-icon="..."` | `data-icon="..."` | `data-*` 속성은 그대로 유지 |
| `style="color: red"` | `style={{ color: 'red' }}` | 객체 형태로 전환 |

---

## 5. 라우팅 및 페이지 분리

### Stitch HTML 구조 → React Router 매핑

| Stitch HTML 파일 | React Route | React 컴포넌트 |
|---|---|---|
| `main_home_ko.html` | `/` | `pages/HomePage.tsx` |
| `search_result_ko.html` | `/search?q={query}` | `pages/SearchResultPage.tsx` |
| `product_detail_ko.html` | `/product/:id` | `pages/ProductDetailPage.tsx` |
| `shopping_report_ko.html` | `/report` | `pages/ReportPage.tsx` |

### 공통 컴포넌트 추출 대상

- **TopAppBar** (header): 모든 HTML에서 반복되는 상단 네비게이션 → `components/TopAppBar.tsx`
- **BottomNavBar** (mobile nav): 하단 모바일 탭 바 → `components/BottomNavBar.tsx`
- **FAB** (우측 하단 플로팅 버튼): → `components/FloatingActionButton.tsx`

---

## 6. 동적 데이터 바인딩 전환

### 6-1. 정적 상품 카드 → API 연동 동적 렌더링

Stitch HTML에 하드코딩된 상품 정보(이름, 가격, 이미지 URL)는 **모두 삭제**하고,  
API 응답 데이터를 기반으로 `map()`을 사용한 동적 렌더링으로 대체합니다.

```tsx
// ❌ Stitch HTML의 하드코딩된 카드
<div class="product-card">
  <h3>MacBook Pro 14</h3>
  <span>4,300,000원</span>
</div>

// ✅ React 동적 렌더링
{products.map((product, idx) => (
  <div key={idx} className="glass-card rounded-2xl p-6">
    <h3>{product.name}</h3>
    <span>{product.price.toLocaleString()}원</span>
  </div>
))}
```

### 6-2. 검색 이벤트 전환

```tsx
// ❌ Stitch HTML의 window.location 기반 이동
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    window.location.href = `search_result_ko.html?q=${val}`;
  }
});

// ✅ React Router navigate 사용
const navigate = useNavigate();
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  if (query.trim()) {
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }
};
```

---

## 7. 보안 체크리스트

### 7-1. 마크다운/HTML 렌더링 보안

```tsx
// ✅ DOMPurify 새니타이제이션 필수 적용 + 필요 속성 화이트리스트
import DOMPurify from 'dompurify';

const safeHtml = DOMPurify.sanitize(rawHtml, {
  ADD_ATTR: ['target', 'rel', 'referrerpolicy']
});
return { __html: safeHtml };
```

> [!WARNING]
> `DOMPurify.sanitize()`의 기본 설정은 `target`, `rel`, `referrerpolicy` 속성을 **자동 삭제**합니다.  
> 외부 링크가 새 창에서 열려야 한다면 반드시 `ADD_ATTR` 옵션을 추가하세요.

### 7-2. 외부 아웃링크 보안

모든 외부 쇼핑몰 링크에 아래 속성을 반드시 포함합니다:

```tsx
<a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  referrerPolicy="no-referrer"
>
```

| 속성 | 목적 |
|---|---|
| `target="_blank"` | 새 탭에서 열기 |
| `rel="noopener noreferrer"` | `window.opener` 접근 차단 + Referer 유출 방지 |
| `referrerPolicy="no-referrer"` | 네이버쇼핑 등의 `device_prevent.nhn` 봇 차단 우회 |

### 7-3. URL 검증 (WHATWG 표준)

```typescript
export function validateShoppingUrl(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
```

---

## 8. SSE(Server-Sent Events) 스트리밍 연동

Stitch HTML의 `EventSource` 패턴을 React Hook으로 전환합니다:

```tsx
useEffect(() => {
  if (!query) return;
  setIsStreaming(true);

  const eventSource = new EventSource(`/api/recommend/stream?q=${encodeURIComponent(query)}`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'products') {
        setProducts(data.products);
      } else if (data.type === 'report') {
        setReportContent(prev => prev + data.text + '\n');
      } else if (data.type === 'error') {
        setErrorMsg(data.message);
      }
    } catch { /* 일반 텍스트 폴백 */ }
  };

  eventSource.onerror = () => {
    setIsStreaming(false);
    eventSource.close();
  };

  return () => { eventSource.close(); };
}, [query]);
```

---

## 9. 전환 작업 순서 (권장)

```
1. DESIGN.md 분석 → @theme 블록에 색상/간격/폰트 CSS 변수 등록
2. index.css에 타이포그래피 유틸리티 클래스 수동 선언
3. index.css에 glass-card, ai-pulse 등 커스텀 CSS 클래스 이전
4. index.html에 Material Symbols + Inter 폰트 CDN 링크 확인
5. 공통 컴포넌트(TopAppBar, BottomNavBar) 먼저 추출
6. 각 HTML 페이지를 React 페이지 컴포넌트로 전환
7. 정적 상품 데이터를 API 연동 동적 렌더링으로 교체
8. DOMPurify + referrer 보안 속성 적용
9. TypeScript 타입 에러 체크 (tsc --noEmit)
10. 브라우저에서 원본 HTML과 비교 검증
```

---

## 10. 최종 검증 체크리스트

- [ ] 모든 색상이 DESIGN.md의 토큰과 일치하는가?
- [ ] 타이포그래피(font-size, line-height, font-weight)가 원본 HTML과 동일한가?
- [ ] Material Symbols 아이콘이 텍스트가 아닌 그래픽으로 표시되는가?
- [ ] glass-card, hero-gradient 등 커스텀 CSS가 정상 적용되는가?
- [ ] 외부 링크가 새 창에서 열리며 referrer가 유출되지 않는가?
- [ ] 마크다운 렌더링 시 XSS 공격 벡터가 차단되는가?
- [ ] `tsc --noEmit` 에 에러가 없는가?
- [ ] 모바일 반응형 레이아웃이 원본과 동일하게 동작하는가?
