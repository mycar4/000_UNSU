# UNSU Platform FO (Front Office) 개발 가이드 (v2.0)

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

장년층 최적화 극강의 심플 UI 디자인 규격을 적용하여 선언된 5대 핵심 메뉴 구조를 따릅니다.

```
fo/
├── src/
│   ├── main.tsx              # 엔트리포인트
│   ├── App.tsx               # 라우터 세팅 및 전역 네비게이션
│   ├── index.css             # Tailwind v4 @theme 토큰 (DESIGN.md 기반)
│   ├── components/
│   │   ├── TopAppBar.tsx     # 공통 상단 네비게이션
│   │   ├── BottomNavBar.tsx  # 하단 탭 (4대 메뉴 이동)
│   │   └── ui/               # 순수 Presentational 컴포넌트
│   ├── pages/
│   │   ├── OnboardingPage.tsx  # [NEW] FO-00-ONBOARDING: 기사 마스터 프로필 설정
│   │   ├── GillogPage.tsx      # MENU 01: 오늘의 루틴 (행운 카드, 아침 브리핑)
│   │   ├── GPanRadarPage.tsx   # MENU 02: G-PAN 레이더 (Zero-Touch Native TTS, 핫존)
│   │   ├── RoadboarderPage.tsx # MENU 03: 로드보더 (매출 리더보드 및 광장 피드)
│   │   └── AutopilotPage.tsx   # MENU 04: 오토파일럿 (간이과세자 정산, 누적 수입 대시보드)
│   ├── lib/
│   │   └── utils.ts          # cn() 등 공통 유틸리티
│   └── assets/               # 정적 리소스 (SVG 아이콘 등)
└── vite.config.ts
```

---

## 3. 디자인 시스템 적용 규칙 (DESIGN.md 연동)

### 3-1. OKLCH 기반 색상 토큰 원칙
하드코딩된 색상 사용을 엄격히 금지하며, Day/Sunset/Night 동적 테마 연동을 보장해야 합니다.
*   **주요 배경/텍스트**: `bg-background`, `text-foreground`
*   **컴포넌트/카드**: `bg-card`, `text-card-foreground`
*   **주요 액션 (가독성 최우선)**: `bg-primary text-primary-foreground`
*   **강조 포인트 (수익/대박 구역)**: `text-gold` 또는 `bg-gold`

### 3-2. 장년층 최적화 타이포그래피
*   기본 글씨 크기를 130% 상향하여 설계되었습니다.
*   헤드라인, 숫자(매출), 영문 라벨에는 **Instrument Sans**를 사용하며, 통계 및 랭킹 데이터 표출 시 고정폭 폰트인 **JetBrains Mono**(`.mono-label`)를 믹스하여 시인성을 높입니다.

### 3-3. 프리미엄 데코레이션 및 미세 반응형 탭 액션
*   격자 무늬(`.grid-lines`), 도트 필드(`.dot-field`), 그리고 터치 피드백 트랜지션(`.tap`)을 적극 바인딩하여 인터랙션 일관성을 유지합니다.

---

## 4. 핵심 기능 구현 패턴

### 4-1. Client-side Native TTS 합성 패턴 (G-PAN 레이더)
*   **아키텍처**: 서버에서의 고비용 오디오 스트리밍을 지양하고, 텍스트 데이터만 다운로드하여 브라우저 내장 Web Speech API(`SpeechSynthesis`)를 호출해 로컬 리소스로 소리를 합성합니다. 통신이 순간적으로 끊겨도 끊김 없는 오디오 브리핑을 보장합니다.

```tsx
export function useNativeTTS() {
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // 이전 발화 취소
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // 장년층을 고려한 차분하고 다소 느린 말속도
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('이 브라우저는 Web Speech API를 지원하지 않습니다.');
    }
  };
  return { speakText };
}
```

### 4-2. 간편 영수증 OCR 스캔 패턴 (로드보더)
*   여신협회 등 실시간 민간 API의 보안 연동 장벽을 해결하기 위해 기사가 당일 카드 영수증을 모바일 카메라로 캡처하여 업로드하는 구조를 채택합니다.
*   프론트엔드에서는 이미지 사이즈를 압축(Compress)한 뒤 백엔드 OCR API로 안전하게 전송하여 검증 대기 상태로 등록합니다.

---

## 5. 보안 및 글로벌 가드레일 (Global Policy)

### 5-1. DOMPurify 기반 XSS 필터링 필수
*   기사 광장의 자유로운 게시글 렌더링 시, 런타임 스크립트 실행 방지를 위해 React standard text-binding을 강제하며, HTML 해석이 필요할 시 반드시 `DOMPurify.sanitize()` 파이프라인을 통과해야 합니다.

### 5-2. WHATWG URL 및 리퍼러 차단 (외부 제휴몰 아웃링크)
*   파트너 정비소, 타이어몰 등의 아웃링크 호출 시 화이트리스트(`http:`, `https:`) 검사를 통과한 자원만 서빙하고, 제어권 탈취 방지를 위해 `target="_blank" rel="noopener noreferrer"`를 강제 바인딩합니다.

### 5-3. Zod 스키마 검증 (폼 유효성)
*   온보딩 마스터 프로필(`DriverProfileSchema`) 및 세무 환급 신청 등 기사 입력의 모든 페이로드에 대해 전송 전 `Zod` 스키마 검증 및 적절한 에러 문구 노출이 선행되어야 합니다.
