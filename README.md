# UNSU Platform - Enterprise AI Agent

> **Platform for Premium Taxis**  
> *"AI 개발은 코딩보다 설명서를 잘 만드는 것이 먼저다."*

본 프로젝트는 '올라운드 플레이어(All-Round Player)' 방법론에 입각하여, Google Stitch의 정적 자산 디자인 분석부터 LangSmith의 프로덕션 관제 파이프라인까지 무결점으로 수렴하도록 설계된 개인 및 프리미엄 대형 택시 기사 대상 지능형 경영 플랫폼입니다.

---

## 1. 아키텍처 개요 (System Overview)

UNSU 플랫폼은 카카오 T 벤티, 타다 넥스트 등 대형 프리미엄 및 개인택시 자영업 기사들의 지속 가능한 성장을 지원하는 엔터프라이즈 플랫폼입니다. 

기사의 시동/출근 루틴을 선점하는 **감성 인게이지먼트 엔진(GILLOG)**, 전방 주시 중심의 안전 주행을 보장하는 **지능형 오디오 관제 엔진(G-PAN)**, 복잡한 세무 행정을 자동화하는 **금융 정산 엔진(Tax Autopilot)**, 그리고 플랫폼의 규제 제재를 우회하는 **보안 방벽(Risk Shield Sandbox)**이 유기적으로 통합된 선형 에이전트 파이프라인으로 구성되어 있습니다.

---

## 2. 주요 기능 (Core Features)

*   **GILLOG 출근 루틴 선점 (Morning On-boarding)**
    *   매일 오전 07:00 시동 시점에 맞춰 브라우저 기반 오늘의 띠/사주 기반 행운 카드 웹 푸시 송출.
    *   '택린이' 브랜드 자산(블로그, 유튜브) 연동을 통한 정서적 락인 형성.
*   **G-PAN 지능형 오디오 관제 엔진 (Zero-Touch TTS Engine)**
    *   기상청, 서울시 돌발 트래픽, 공항 연착 및 지하철 지연 Open API 데이터를 비동기 융합하여 실시간 핫존(대박 구역) 추정.
    *   라디오 방송 형태의 오디오 피드백 무인 스트리밍 가동.
*   **Tax Autopilot 경영 자율비행 코어 (FinTech Integration)**
    *   CODEF/쿠콘 핀테크 API 브로커를 통해 여신금융협회 카드 매출 및 차량 유지비 지출 데이터를 실시간 스크래핑.
    *   국세청 홈택스 자동 세무 신고 및 부가세 환급 최적화 실행.
*   **Risk Shield 컴플라이언스 샌드박스 (Security Barrier)**
    *   거대 호출 플랫폼의 다중 호출앱 직접 제어 제재 규정을 우회하기 위한 설계.
    *   OS 레벨 알림 가로채기 및 비동기 외부 맥락 수집 메커니즘을 통한 안전 우회로 보장.

---

## 3. 기술 스택 (Tech Stack)

| 레이어 | 기술 스택 명세 | 비고 |
| :--- | :--- | :--- |
| **Front-end** | React 19, TypeScript, Vite, Tailwind CSS v4 (`@theme`) | 장년층 최적화 극강의 심플 UI (타이포 130% 상향) |
| **Back-end / AI** | Node.js, TypeScript, LangGraph, Gemini API | 단일 책임 노드(SRP) 기반 자율 상태 머신 |
| **Data / Storage** | Supabase (PostgreSQL, Vector DB, Schema Engine) | 주행 궤적 비동기 적재 및 관계형 스키마 빌드 |
| **Observability** | LangSmith (Tracing, Dataset Building) | 실시간 런타임 추적 관제 및 데이터 플라이휠 가동 |
| **Deployment** | Vercel (Front Office) / Render.com (Backend API) | 멀티 클라우드 물리 격리 및 가속 CDN 적용 |

---

## 4. 시작하기 (Getting Started)

### 환경 변수 설정 (`.env`)
루트 및 하위 파트 폴더에 `.env` 파일을 생성하고 아래의 런타임 변수를 주입합니다.

```env
# Front Office 빌드 타임 주입 API 주소
VITE_API_URL=https://api.unsu-platform.internal

# 핀테크 인터페이스 보안 인증 키
KUCON_API_BROKER_KEY=unsu_fintech_secure_token_prod

# LangSmith 통합 추적 관제 엔진 활성화
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__unsu_enterprise_secret_stream
LANGCHAIN_PROJECT=unsu-platform-core-prod
```

### 의존성 설치 및 로컬 개발 서버 구동

```bash
# 1. 의존성 모듈 트리 컴파일 및 프로덕션 빌드
npm install

# 2. 로컬 개발 컴파일러 및 HMR(Hot Module Replacement) 런타임 활성화
npm run dev
```

---

## 5. 디렉토리 배치 및 명세 구조 (Directory Architecture)

본 프로젝트는 불변 명세 체계와 도메인 격리 원칙을 엄격하게 준수합니다.

```text
unsu-platform-root/ (프로젝트 루트)
│
├── 📄 README.md # [마스터] 시스템 대문 및 런타임 CLI 가이드서
├── 📄 SPEC.md # [마스터] 전체 기획 명세, 아키텍처, 기능 정의 요구사항서 (v0.3)
├── 📄 DESIGN.md # [마스터] 장년층 전용 타이포 토큰 및 수석 디자이너 페르소나 설정서
│
├── 📁 .docs/ # [도메인 격리] 아키텍처 하위 서브 가이드북
│ ├── 📄 GUIDE_FO.md # [서브 가이드] 기사 인터페이스 UI 로직 및 스트리밍 가이드
│ ├── 📄 GUIDE_BO.md # [서브 가이드] 플랫폼 본사 관리자 화면 명세 및 제휴 몰 정산서
│ ├── 📄 GUIDE_API.md # [서브 가이드] Open Data & 핀테크 엔드포인트 규격서
│ └── 📄 GUIDE_STITCH_TO_REACT.md # [작업 표준서] Stitch HTML 자산을 React v19 코드로
│
├── 📁 fo/ # [실제 코드] 프론트엔드 모바일 클라이언트 (Vite + React)
├── 📁 bo/ # [실제 코드] 백오피스 관제 및 B2B 제휴 시스템
└── 📁 api/ # [실제 코드] LangGraph 기반 코어 서버 (Node.js + TS)
```