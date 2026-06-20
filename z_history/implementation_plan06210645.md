# PostgreSQL DB 구성 및 웹 배포(Vercel & Render.com) 이행 계획서

> **마스터 로드맵**: v3.0  
> **목적**: 로컬 모의 환경을 넘어 상용 수준의 데이터베이스를 연동하고, 프론트엔드/백오피스/API 백엔드를 실제 웹에 배포하여 누구나 접근 가능한 클라우드 환경을 구축합니다.

---

## 🛠️ User Review Required

> [!IMPORTANT]
> **데이터베이스 및 호스팅 플랫폼 선정**
> *   **데이터베이스 (Supabase)**: 제공되는 `database_schema.sql` 명세서가 Supabase의 RLS(Row Level Security) 정책 및 PostgreSQL 15+ 문법과 100% 호환되도록 설계되어 있습니다. 무료 티어로 즉시 데이터베이스를 개설할 수 있는 **Supabase** 사용을 강력히 권장합니다.
> *   **백엔드 API (Render.com)**: Express + Node.js + LangGraph 서버는 지속적인 프로세스 러닝이 필요하므로, 무료/저비용 호스팅이 가능한 **Render.com** 웹 서비스 환경을 제안합니다.
> *   **프론트엔드 & 백오피스 (Vercel)**: React + Vite 정적 빌드 배포에 최적화되고 글로벌 Edge CDN 가속을 지원하는 **Vercel**을 제안합니다.

---

## 📅 Open Questions

> [!NOTE]
> 1. 현재 사용 중이신 **Supabase 계정** 및 **Render.com / Vercel 계정**이 있으신가요? 없으시다면 회원가입 후 배포를 준비해주시면 됩니다.
> 2. 실제 운영 서버 배포 시, LangGraph 에이전트 구동에 필요한 `OPENAI_API_KEY`, `GEMINI_API_KEY`는 기존 `.env`에 설정된 키를 그대로 사용할 계획입니다. 이외의 추가적인 운영 전용 외부 API Key가 준비되셨는지 확인이 필요합니다.

---

## ⚙️ Proposed Changes

### 1. Database Configuration (Supabase PostgreSQL)

Supabase 프로젝트를 개설하고 데이터베이스를 연동하는 구체적 절차는 다음과 같습니다.

*   **Step 1: 프로젝트 생성**
    *   [Supabase Console](https://supabase.com)에 로그인 후 신규 프로젝트 `unsu-platform`을 생성합니다.
*   **Step 2: 스키마 실행**
    *   프로젝트 대시보드의 **SQL Editor**로 이동하여, 프로젝트 루트에 위치한 [database_schema.sql](file:///d:/000_UNSU/database_schema.sql) 파일의 전체 쿼리를 복사하여 붙여넣고 **Run**을 실행합니다.
    *   이 쿼리는 모든 비즈니스 테이블(drivers, daily_lucky_cards, recommended_courses, hot_zones 등), 인덱스 성능 튜닝, 그리고 보안 RLS 정책을 자동으로 빌드합니다.
*   **Step 3: 연결 문자열(Connection String) 추출**
    *   `Project Settings` -> `Database` 메뉴로 이동하여 **Connection string (URI)**을 복사합니다.
    *   형식: `postgresql://postgres.[ProjectRef]:[YourPassword]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
*   **Step 4: 백엔드 환경 변수 주입**
    *   API 서버의 `.env`에 복사한 URI를 주입합니다.
    *   `DATABASE_URL=복사한_Supabase_URI`

---

### 2. Backend API Deployment (Render.com)

Express로 제작된 `api` 폴더의 노드 백엔드를 Render.com에 올리는 빌드 및 구동 가이드입니다.

*   **Step 1: Render Web Service 등록**
    *   Render 대시보드에서 `New` -> `Web Service`를 선택하고 Git 저장소를 연동합니다.
*   **Step 2: 빌드 및 실행 명령어 설정**
    *   **Root Directory**: `api` (로컬 디렉토리 격리)
    *   **Build Command**: `npm install && npm run build` (tsconfig.json 컴파일러를 통해 `dist/` 빌드)
    *   **Start Command**: `npm start` (컴파일된 `node dist/server.js` 구동)
*   **Step 3: 환경 변수(Environment Variables) 설정**
    *   API 구동에 필수적인 변수들을 Render 환경설정에 추가합니다.
        *   `NODE_ENV=production`
        *   `DATABASE_URL=[Supabase Connection URI]`
        *   `OPENAI_API_KEY=[OpenAI Key]`
        *   `GEMINI_API_KEY=[Gemini Key]`
        *   `PORT=10000` (Render 기본 포트 매핑)
        *   `ENCRYPTION_KEY=[암복호화 Secret]`
        *   외부 공공데이터 API Keys (`KOPIS_API_KEY`, `DATA_GO_KR_API_KEY` 등)
*   **Step 4: 배포 후 API 호스트 확인**
    *   배포가 완료되면 Render가 제공하는 HTTPS API 주소(예: `https://unsu-api.onrender.com`)를 복사합니다.

---

### 3. Frontend & Back Office Deployment (Vercel)

Vite로 구성된 프론트엔드(`fo`)와 백오피스(`bo`) 정적 자산을 Vercel에 개별 배포하여 실제 모바일 기기 및 PC 브라우저에서 접근할 수 있도록 구성합니다.

#### 📱 Front Office (`fo`) 배포 설정
*   **Project Name**: `unsu-platform-fo`
*   **Root Directory**: `fo`
*   **Framework Preset**: `Vite` (Vercel이 자동 감지)
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Environment Variables**:
    *   `VITE_API_URL=[Render.com 배포된 API 호스트 주소]` (반드시 `/api` 경로를 포함하지 않고 호스트명만 입력)
        *   *예: `https://unsu-api.onrender.com`*

#### 🖥️ Back Office (`bo`) 배포 설정
*   **Project Name**: `unsu-platform-bo`
*   **Root Directory**: `bo`
*   **Framework Preset**: `Vite`
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Environment Variables**:
    *   `VITE_API_URL=[Render.com 배포된 API 호스트 주소]`
        *   *예: `https://unsu-api.onrender.com`*

---

## 🧪 Verification Plan

### Automated / Manual Tests
1. **DB Migration 확인**: 
   - 백엔드 서버가 시작될 때 Supabase 콘솔에서 `drivers` 테이블에 신규 컬럼 6종 및 `withdrawn_drivers` 테이블 생성 로그가 찍히는지 관찰합니다.
2. **API 연동 상태 확인**:
   - `https://unsu-api.onrender.com/api/admin/external-apis` 호출 시 200 OK와 함께 22개 API JSON 데이터가 출력되는지 확인합니다.
3. **E2E 로그인 및 분석 테스트**:
   - Vercel에 배포된 BO 페이지에서 로그인 시도 후 관리자 계정 생성, 기사 프로필 편집, 그리고 외부 API 연동 모드 토글 시 Supabase DB에 실시간 Audit Logs가 안전하게 쓰여지는지 확인합니다.
   - Vercel에 배포된 FO 모바일 화면에서 주소 검색 팝업이 정상 동작하고 온보딩 완료 후 실시간 날씨 및 G-PAN 레이더 분석 리포트가 정상 스트리밍되는지 확인합니다.
