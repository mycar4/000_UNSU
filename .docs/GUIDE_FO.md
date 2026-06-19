# UNSU Platform FO (Front Office) 개발 가이드

> **목적:** 장년층(개인 및 프리미엄 대형 택시 기사) 대상의 UNSU 프론트엔드 애플리케이션 아키텍처, 디자인 시스템 적용, 보안 정책, 개발 규칙을 정의합니다.
> 새로운 페이지나 컴포넌트 추가 시 본 문서를 우선 확인하고 기존 패턴(극강의 심플 UI 및 감성 인게이지먼트)을 따르세요.

---

## 1. 기술 스택

| 항목 | 기술 | 비고 |
|---|---|---|
| 프레임워크 | React 19+ | 최신 React Hooks 및 동시성 기능 활용 |
| 빌드 도구 | Vite 6+ | HMR 및 빠른 빌드 |
| CSS 프레임워크 | TailwindCSS v4 | `@theme` 기반 OKLCH 디자인 토큰 관리 |
| 라우팅 | React Router DOM 7+ | SPA 라우팅 |
| XSS 방지 | DOMPurify 3+ | 외부 큐레이션 마크다운/HTML 안전 렌더링 |
| 유틸리티 | clsx + tailwind-merge | 동적 클래스 병합 (`cn()` 유틸리티) |

---

## 2. 정보 아키텍처 및 폴더 구조 규칙

장년층 최적화 극강의 심플 UI 디자인 규격을 적용하여 선언된 4대 핵심 메뉴 구조를 따릅니다.

```
fo/
├── src/
│   ├── main.tsx              # 엔트리포인트
│   ├── App.tsx               # 라우터 세팅 및 전역 네비게이션
│   ├── index.css             # Tailwind v4 @theme 토큰 (DESIGN.md 기반)
│   ├── components/
│   │   ├── TopAppBar.tsx     # 공통 상단 네비게이션
│   │   ├── BottomNavBar.tsx  # 하단 탭 (4대 메뉴 이동)
│   │   └── ui/               # ⚠️ 순수 Presentational 컴포넌트
│   ├── pages/
│   │   ├── GillogPage.tsx      # MENU 01: 오늘의 루틴 (행운 카드, 아침 브리핑)
│   │   ├── GPanRadarPage.tsx   # MENU 02: G-PAN 레이더 (Zero-Touch TTS, 핫존)
│   │   ├── RoadboarderPage.tsx # MENU 03: 로드보더 (매출 탑 보더 및 광장 피드)
│   │   └── AutopilotPage.tsx   # MENU 04: 오토파일럿 (세무 정산, 누적 수입 대시보드)
│   ├── lib/
│   │   └── utils.ts          # cn() 등 공통 유틸리티
│   └── assets/               # 정적 리소스 (SVG 아이콘 등)
└── vite.config.ts
```

---

## 3. 디자인 시스템 적용 규칙 (DESIGN.md 연동)

### 3-1. OKLCH 기반 색상 토큰 원칙
하드코딩된 색상 사용을 엄격히 금지합니다.
*   **주요 배경/텍스트**: `bg-background`, `text-foreground`
*   **컴포넌트/카드**: `bg-card`, `text-card-foreground`
*   **주요 액션 (가독성 최우선)**: `bg-primary text-primary-foreground`
*   **강조 포인트 (수익/대박 구역)**: `text-gold` 또는 `bg-gold`

### 3-2. 장년층 최적화 타이포그래피
*   기본 글씨 크기를 130% 상향하여 설계되었습니다.
*   헤드라인, 숫자(매출), 영문 라벨에는 **Instrument Sans** (또는 JetBrains Mono 등 선언된 폰트)를 사용하며 `text-body-lg` (20px 이상) 등 큼직한 가독성 토큰을 사용합니다.

### 3-3. 프리미엄 데코레이션 유틸리티
배경이나 컴포넌트에 감성적이고 모던한 UI를 제공하기 위한 커스텀 유틸리티를 적극 활용합니다.
```tsx
// 격자선 배경 (G-PAN 레이더 뷰 등)
<div className="grid-lines bg-background w-full h-screen">...</div>

// 도트 조명 (행운 카드 효과)
<div className="dot-field absolute inset-0">...</div>

// 미세 반응형 탭 액션 (시니어 터치 피드백)
<button className="tap bg-primary text-primary-foreground p-4 rounded-xl">출근 시작</button>
```

---

## 4. 핵심 기능 구현 패턴

### 4-1. SSE (Server-Sent Events) 스트리밍 패턴
G-PAN 실시간 관제 및 오디오 스트리밍 텍스트 피드백 시 사용합니다.

```tsx
useEffect(() => {
  const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/api/gpan/stream`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'hotzone') {
      setHotzones(data.payload);
    } else if (data.type === 'audio_text') {
      setRadioFeed(prev => prev + data.text);
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => { eventSource.close(); };
}, []);
```

### 4-2. Risk Shield 컴플라이언스 샌드박스 원칙
*   **타 플랫폼 간섭 금지**: FO에서는 카카오T, 타다 등 타 앱의 DOM을 읽거나 직접 호출하는 로직을 절대로 구현하지 않습니다.
*   **OS 비동기 의존**: 데이터 수집은 철저히 백엔드 API에 의존하거나, 브라우저가 제공하는 표준 위치/알림 API의 읽기 권한만을 활용하여 정책 제재를 우회합니다.

---

## 5. 보안 및 글로벌 가드레일 (Global Policy)

### 5-1. DOMPurify 기반 XSS 필터링 필수
RSS 데이터나 백엔드 LLM이 내려주는 택린이 콘텐츠 렌더링 시 필수적입니다.

```tsx
import DOMPurify from 'dompurify';

const safeHtml = DOMPurify.sanitize(rawFeed, {
  ADD_ATTR: ['target', 'rel', 'referrerpolicy']
});
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

### 5-2. WHATWG URL 및 리퍼러 차단 (외부 링크)
택시 용품, 정비소 제휴 아웃링크 시 브라우저 스레드 제어권 탈취 예방을 위해 보안 속성을 강제합니다.

```tsx
<a
  href={partnerUrl}
  target="_blank"
  rel="noopener noreferrer"
  referrerPolicy="no-referrer"
>
  타이어 제휴몰 이동
</a>
```

### 5-3. Zod 스키마 검증
프론트엔드에서도 백엔드로 전송하는 모든 페이로드(예: 오토파일럿 수동 세무 정산 요청 등)를 전송 전 `Zod`로 1차 검증합니다.
