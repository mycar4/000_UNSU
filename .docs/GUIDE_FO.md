# FO (Frontend Office) 개발 가이드

> **목적:** SmartShopper AI 프론트엔드 애플리케이션의 아키텍처, 디자인 시스템 적용, 보안 정책, 개발 규칙을 정의합니다.  
> 새로운 페이지/컴포넌트 추가 시 본 문서를 먼저 확인하고 기존 패턴을 따르세요.

---

## 1. 기술 스택

| 항목 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | React | 19+ |
| 빌드 도구 | Vite | 8+ |
| CSS 프레임워크 | TailwindCSS (v4, `@tailwindcss/vite`) | 4.3+ |
| 라우팅 | React Router DOM | 7+ |
| UI 기초 컴포넌트 | Radix UI (Dialog, Label, Slot) | latest |
| XSS 방지 | DOMPurify | 3+ |
| 유틸리티 | clsx + tailwind-merge (`cn()`) | latest |
| 타입 시스템 | TypeScript | 6+ |

---

## 2. 디렉토리 구조 규칙

```
fo/
├── src/
│   ├── main.tsx              # 엔트리포인트 (StrictMode + createRoot)
│   ├── App.tsx               # 라우터 + 레이아웃 셸
│   ├── index.css             # @theme 토큰 + 커스텀 유틸리티 (DESIGN.md 참조)
│   ├── App.css               # App 레벨 추가 스타일
│   ├── components/
│   │   ├── TopAppBar.tsx     # 공통 상단 네비게이션
│   │   ├── BottomNavBar.tsx  # 모바일 하단 네비게이션 (선택)
│   │   └── ui/               # ⚠️ 순수 Presentational 컴포넌트만 (비즈니스 로직 금지)
│   │       ├── Button.tsx
│   │       ├── Dialog.tsx
│   │       ├── Input.tsx
│   │       └── Label.tsx
│   ├── pages/
│   │   ├── HomePage.tsx          # / 라우트
│   │   └── SearchResultPage.tsx  # /search?q={query} 라우트
│   ├── lib/
│   │   └── utils.ts          # cn() 등 공통 유틸리티
│   └── assets/               # 정적 리소스 (이미지, SVG)
├── index.html                # HTML 셸 (폰트 CDN 링크 포함)
├── vite.config.ts            # Vite + TailwindCSS + API 프록시 설정
├── tsconfig.json
└── package.json
```

### 디렉토리 규칙

| 디렉토리 | 역할 | 금지 사항 |
|---|---|---|
| `components/ui/` | DESIGN.md 기반 순수 UI 컴포넌트 | API 호출, 비즈니스 로직 코드 |
| `components/` | 공통 레이아웃 컴포넌트 (TopAppBar 등) | 페이지 특화 로직 |
| `pages/` | 라우트에 1:1 매핑되는 페이지 컴포넌트 | 하위 컴포넌트 직접 정의 (추출할 것) |
| `lib/` | 공유 유틸리티 함수 | React 컴포넌트 정의 |

---

## 3. 디자인 시스템 적용 규칙

### 3-1. DESIGN.md 토큰 참조 원칙

모든 색상, 타이포그래피, 간격은 **반드시** `DESIGN.md`에 정의된 토큰을 사용합니다.

```tsx
// ❌ 하드코딩된 색상
<div style={{ color: '#1a146b' }}>

// ✅ 디자인 토큰 클래스 사용
<div className="text-primary">
```

### 3-2. 타이포그래피 이중 클래스 패턴

Stitch 디자인 시스템에서는 `font-*`(폰트 패밀리)과 `text-*`(크기/행간/무게)를 **쌍으로** 적용합니다:

```tsx
// ✅ 항상 font-* + text-* 를 함께 사용
<h1 className="font-headline-md text-headline-md">제목</h1>
<p className="font-body-sm text-body-sm">본문</p>
<span className="font-label-caps text-label-caps uppercase">레이블</span>
<span className="font-price-lg text-price-lg">100,000원</span>
```

### 3-3. 커스텀 CSS 클래스

| 클래스 | 용도 | 사용 예시 |
|---|---|---|
| `glass-card` | 반투명 카드 (Glassmorphism) | 상품 카드, AI 리포트 컨테이너 |
| `hero-gradient` | 히어로 섹션 배경 | HomePage 상단 영역 |
| `ai-pulse` | AI 아이콘 애니메이션 | `auto_awesome` 아이콘에 적용 |

---

## 4. 라우팅 규칙

### 4-1. 라우트 정의 (App.tsx)

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/search" element={<SearchResultPage />} />
  {/* 새 페이지 추가 시 아래에 등록 */}
</Routes>
```

### 4-2. 페이지 간 이동

```tsx
// ✅ React Router의 navigate 사용
const navigate = useNavigate();
navigate(`/search?q=${encodeURIComponent(query)}`);

// ❌ window.location 직접 조작 금지
window.location.href = '/search?q=...';
```

### 4-3. 쿼리 파라미터 읽기

```tsx
const location = useLocation();
const queryParams = new URLSearchParams(location.search);
const query = queryParams.get('q') || '';
```

---

## 5. API 연동 패턴

### 5-1. Vite 프록시 설정

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

### 5-2. SSE (Server-Sent Events) 스트리밍 패턴

검색 결과 페이지의 실시간 데이터 수신에 사용합니다:

```tsx
useEffect(() => {
  if (!query) return;
  setIsStreaming(true);

  const eventSource = new EventSource(
    `/api/recommend/stream?q=${encodeURIComponent(query)}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'products':
        setProducts(data.products);
        break;
      case 'report':
        setReportContent(prev => prev + data.text + '\n');
        break;
      case 'error':
        setErrorMsg(data.message);
        break;
    }
  };

  eventSource.onerror = () => {
    setIsStreaming(false);
    eventSource.close();
  };

  return () => { eventSource.close(); };
}, [query]);
```

> [!IMPORTANT]
> `useEffect`의 cleanup 함수에서 반드시 `eventSource.close()`를 호출하여 연결을 해제해야 합니다.

---

## 6. 보안 규칙 (필수)

### 6-1. DOMPurify — HTML 삽입 시 필수

```tsx
import DOMPurify from 'dompurify';

// ✅ 올바른 사용 (속성 화이트리스트 포함)
const safeHtml = DOMPurify.sanitize(rawHtml, {
  ADD_ATTR: ['target', 'rel', 'referrerpolicy']
});
return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
```

> [!WARNING]
> `ADD_ATTR`를 설정하지 않으면 `target="_blank"`, `rel`, `referrerpolicy`가 DOMPurify에 의해 **자동 삭제**되어  
> 외부 링크가 현재 탭에서 열리거나 리퍼러 정보가 유출됩니다.

### 6-2. 외부 링크 — 리퍼러 차단 필수

```tsx
<a
  href={product.url}
  target="_blank"
  rel="noopener noreferrer"
  referrerPolicy="no-referrer"
>
```

> [!CAUTION]
> 네이버 쇼핑 등은 `localhost` 리퍼러를 감지하면 `device_prevent.nhn` 봇 차단 페이지로 리다이렉트합니다.  
> `rel="noopener noreferrer"` + `referrerPolicy="no-referrer"` 는 **모든 외부 링크에 필수**입니다.

### 6-3. `dangerouslySetInnerHTML` 사용 조건

- **허용:** DOMPurify.sanitize()를 통과한 콘텐츠만 사용 가능
- **금지:** 사용자 입력값이나 외부 API 응답을 직접 삽입하는 행위

---

## 7. 마크다운 렌더링 패턴

AI 리포트 스트리밍 결과의 마크다운을 HTML로 파싱하는 표준 패턴:

```tsx
const renderMarkdown = (md: string) => {
  if (!md) return { __html: "" };

  const lines = md.split('\n');
  const htmlLines = lines.map(line => {
    const trimmed = line.trim();
    let processed = line;

    // 헤더 처리 (순서 중요: ### → ## → # 순서로 매칭)
    if (trimmed.startsWith('### '))
      processed = `<h3 class="...">${trimmed.slice(4)}</h3>`;
    else if (trimmed.startsWith('## '))
      processed = `<h2 class="...">${trimmed.slice(3)}</h2>`;
    // 리스트 처리
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* '))
      processed = `<li class="...">${trimmed.slice(2)}</li>`;
    // 구분선
    else if (trimmed === '---')
      processed = `<hr class="..." />`;

    // 인라인: 볼드 + 링크
    processed = processed
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">$1</a>');

    return processed;
  });

  const html = htmlLines.join('\n');
  return { __html: DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel', 'referrerpolicy'] }) };
};
```

> [!NOTE]
> `dangerouslySetInnerHTML`에 주입되는 HTML에서는 `className`이 아닌 `class` 속성을 사용해야 합니다.  
> React의 JSX가 아닌 순수 HTML 문자열이기 때문입니다.

---

## 8. 컴포넌트 작성 규칙

### 8-1. UI 컴포넌트 (`components/ui/`)

Radix UI 기반의 헤드리스 패턴을 따릅니다:

```tsx
// cn() 유틸리티를 사용한 조건부 클래스 병합
import { cn } from '@/lib/utils';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-label-caps text-label-caps",
        variant === 'primary' && "bg-primary text-on-primary",
        variant === 'secondary' && "bg-secondary text-on-secondary",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
```

### 8-2. 페이지 컴포넌트 (`pages/`)

```tsx
// 페이지 컴포넌트 표준 구조
const SearchResultPage: React.FC = () => {
  // 1. 라우팅 Hook
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';

  // 2. 상태 관리
  const [products, setProducts] = useState<Product[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // 3. API 연동 (useEffect)
  useEffect(() => { /* SSE 연결 */ }, [query]);

  // 4. 렌더링
  return (
    <main className="pt-24 pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      {/* 컨텐츠 */}
    </main>
  );
};
```

---

## 9. 조건부 렌더링 패턴

### 라우트 기반 UI 분기

```tsx
// TopAppBar에서 현재 라우트에 따라 검색창 표시/숨기기
const location = useLocation();

{location.pathname === '/search' && (
  <form onSubmit={handleSearch} className="...">
    <input ... />
  </form>
)}
```

### 스트리밍 상태 기반 로딩 UI

```tsx
{isStreaming && products.length === 0 && (
  <div className="glass-card rounded-2xl p-8 text-center">
    <span className="material-symbols-outlined ai-pulse">auto_awesome</span>
    <h2>지능형 쇼핑 에이전트 실시간 분석 중</h2>
    {/* 로딩 체크리스트 */}
  </div>
)}
```

---

## 10. 빌드 및 검증

```bash
# TypeScript 타입 체크 (빌드 없이 검증만)
npx tsc --noEmit

# 개발 서버 실행
npm run dev          # → http://localhost:5173

# 프로덕션 빌드
npm run build
```

---

## 11. 자주 발생하는 문제 (FAQ)

| 증상 | 원인 | 해결 |
|---|---|---|
| Material Icons가 텍스트로 표시됨 | 폰트 CSS 우선순위 밀림 | `index.css`에 `!important` 포함 폰트 선언 |
| 폰트 크기/굵기가 원본 HTML과 다름 | TailwindCSS v4 @theme에 font-size만 등록됨 | 유틸리티 클래스 수동 선언 필요 |
| 외부 링크 클릭 시 인증 페이지 표시 | 리퍼러 유출 | `rel="noopener noreferrer"` + `referrerPolicy="no-referrer"` |
| 마크다운 링크가 현재 탭에서 열림 | DOMPurify가 `target` 속성 삭제 | `ADD_ATTR: ['target', 'rel', 'referrerpolicy']` |
| API 호출 시 CORS 에러 | 프록시 미설정 | `vite.config.ts`의 `server.proxy` 확인 |

---

## 12. Supabase Auth (인증) 연동 및 환경 변수 가이드

프론트엔드 단에서 사용자 가입, 로그인 상태 관리, 소셜(OAuth) 로그인 처리를 안전하게 처리하기 위한 표준 가이드라인입니다.

### 12-1. 패키지 의존성 및 초기화
Supabase 퍼블릭 API 클라이언트 라이브러리를 사용하며, 프론트엔드에서는 절대 `service_role` 키를 사용해서는 안 됩니다. (오직 `anon_key`만 사용 가능)

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] 환경 변수가 누락되었습니다. 로그인 기능을 사용할 수 없습니다.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 12-2. OAuth (Google) 로그인 구현 패턴
소셜 로그인 성공 후, 기존 세션 페이지 또는 지정된 콜백 도메인으로 매끄럽게 리다이렉트하도록 설정합니다.

```tsx
import { supabase } from '@/lib/supabaseClient';

const handleGoogleSignIn = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 배포 환경과 로컬 호스트를 모두 지원하도록 window.location.origin 자동 파싱
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });
    
    if (error) throw error;
  } catch (error: any) {
    console.error('[Auth] 구글 로그인 요청 오류:', error.message || error);
    alert('구글 로그인에 실패했습니다. 다시 시도해 주세요.');
  }
};
```

### 12-3. 사용자 인증 상태 변경 감지 (State Subscription)
App 레벨이나 전역 Context에서 사용자의 로그인 상태를 실시간 감지하여 UI를 동적으로 바인딩합니다.

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 현재 액티브 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. 인증 상태 변경 감지 리스너 등록
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 3. 컴포넌트 언마운트 시 리스너 해제
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, handleSignOut };
}
```

### 12-4. 배포 시 Vercel 환경 변수 명세
Vercel 배포 시, Settings > Environment Variables 항목에 아래 정보를 반드시 등록하십시오.
* **`VITE_SUPABASE_URL`**: Supabase Project URL (`https://xxx.supabase.co`)
* **`VITE_SUPABASE_ANON_KEY`**: Supabase anon public API Key (클라이언트 브라우저 노출 가능)
* **`VITE_API_URL`**: Render.com에 배포된 백엔드 API 서버 URL (SSE 스트리밍 엔드포인트 수신용)

## 13. AI 리포트 품질 피드백 연동 (LangSmith)

생성된 AI 추천 리포트의 품질을 모니터링하기 위해 백엔드의 LangSmith 파이프라인과 연동하는 피드백 루프입니다.

### 13-1. 보안 주의사항
> [!CAUTION]  
> 프론트엔드 소스코드에는 **절대로** LangSmith API Key나 `@langchain/core` 로깅 관련 SDK를 포함해서는 안 됩니다. 랭스미스와의 통신은 100% 백엔드 API를 경유하여(Proxy) 처리합니다.

### 13-2. 피드백 전송 핸들러 구현
리포트 스트리밍 완료 후, 백엔드로부터 전달받은 `runId`를 기반으로 사용자의 평가를 백엔드로 전송합니다.

```tsx
// src/pages/SearchResultPage.tsx 내 피드백 핸들러 예시

const handleFeedback = async (runId: string, isPositive: boolean) => {
  try {
    const cleanBaseUrl = API_BASE_URL.replace(/\/$/, '');
    await fetch(`${cleanBaseUrl}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: runId,
        score: isPositive ? 1 : 0 // 1: 좋아요, 0: 싫어요
      })
    });
    alert('AI 엔진 개선을 위한 피드백이 반영되었습니다. 감사합니다!');
  } catch (error) {
    console.error('피드백 전송 실패:', error);
  }
};

// UI 렌더링 부 (리포트 하단)
// <button onClick={() => handleFeedback(currentRunId, true)}>👍 유용해요</button>
// <button onClick={() => handleFeedback(currentRunId, false)}>👎 아쉬워요</button>
