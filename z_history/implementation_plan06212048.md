# PostgreSQL DB 구성 및 웹 배포(Vercel & Render.com) 이행 계획서

> **마스터 로드맵**: v3.0  
> **목적**: 로컬 모의 환경을 넘어 상용 수준의 데이터베이스를 연동하고, 프론트엔드/백오피스/API 백엔드를 실제 웹에 배포하여 누구나 접근 가능한 클라우드 환경을 구축합니다.

---

## 🛠️ User Review Required

> [!IMPORTANT]
> **로컬 BO(백오피스) 기존 오류 관련 확인 요청**
> 올려주신 에러 화면(백오피스 캡처 화면)과 관련하여, 현재 백그라운드 환경 문제로 인해 정확한 UI 에러 내역을 식별하지 못했습니다. 
> 혹시 발생했던 **어드민 페이지의 문제(예: 특정 버튼 클릭 시 무반응, 드라이버 상세 정보 호출 시 500 에러, 화면 깨짐 등)**가 무엇인지 조금만 자세히 코멘트해 주시면, 즉각 소스코드(`App.tsx` 또는 API)를 수정하여 로컬 검증을 완벽히 마치겠습니다.

---

## 📅 Open Questions

> [!NOTE]
> 1. 현재 사용 중이신 **Supabase 계정** 및 **Render.com / Vercel 계정**이 준비되셨는지요? (가입 후 빈 프로젝트만 만드시면 바로 세팅이 가능합니다)
> 2. 실제 운영 서버 배포 시, 현재 사용 중인 `.env`의 `OPENAI_API_KEY`, `GEMINI_API_KEY` 외에 추가로 준비해야 할 환경 변수가 있는지요?

---

## ⚙️ Proposed Changes

### 1. 백오피스(BO) 기존 오류 정밀 수정 (수집 후 진행)
* 사용자가 전달해준 에러 현상(API 연동 실패, 렌더링 버그, 상태 업데이트 등)을 기반으로 `bo/src/App.tsx` 또는 `api/src/server.ts`의 버그를 즉각적으로 픽스합니다.

### 2. Database Configuration (Supabase PostgreSQL 연동)
*   **Step 1**: [Supabase Console](https://supabase.com)에서 새 프로젝트(`unsu-platform`) 생성.
*   **Step 2**: 프로젝트 대시보드의 **SQL Editor**에 `database_schema.sql` 전체 복사 후 실행하여 테이블 및 보안 정책(RLS) 구축.
*   **Step 3**: `Project Settings -> Database`에서 Connection string (URI) 추출.
*   **Step 4**: 백엔드(`.env`)에 `DATABASE_URL=복사한_Supabase_URI` 주입 및 연결 테스트 진행.

### 3. Backend API Deployment (Render.com)
*   Render Web Service 신규 생성 및 Root 디렉토리 `api` 지정.
*   **Build Command**: `npm install && npm run build`
*   **Start Command**: `npm start` (컴파일된 `node dist/server.js` 구동)
*   환경변수 세팅: `NODE_ENV=production`, `DATABASE_URL`, 각종 API Key 및 `ENCRYPTION_KEY` 등록.
*   배포된 API 호스트 주소(예: `https://unsu-api.onrender.com`) 확보.

### 4. Frontend & Back Office Deployment (Vercel)
*   **Front Office (`fo`)**: Vercel에 `unsu-platform-fo`로 연결 후 환경변수 `VITE_API_URL`에 Render API 호스트 주소 입력 후 배포.
*   **Back Office (`bo`)**: Vercel에 `unsu-platform-bo`로 연결 후 환경변수 `VITE_API_URL` 적용 후 정적 배포.

---

## 🧪 Verification Plan

1. **로컬 무결성 테스트**:
   - BO 버그 수정 후, 로컬에서 `npm run dev` 구동하여 어드민 대시보드와 드라이버 프로필 페이지의 오류가 완전히 사라졌는지 확인합니다.
2. **클라우드 연동 테스트**:
   - Vercel에 배포된 BO 페이지에서 로그인 시도 후 Supabase DB에 실시간 Audit Logs가 안전하게 쓰여지는지 확인합니다.
   - Vercel에 배포된 FO 모바일 화면에서 AI 오디오 파이프라인(G-PAN)이 정상적으로 스트리밍되는지 확인합니다.
