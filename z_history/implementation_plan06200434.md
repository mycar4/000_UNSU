# [Plan] 데이터베이스 연동 및 백엔드 API 고도화 개발 계획

백오피스(BO)와 프론트오피스(FO)의 모의(Mock) 상태 전이 아키텍처를 실제 데이터베이스(Supabase PostgreSQL)와 API로 전환하여 실서비스 수준으로 연동하는 개발 계획입니다.

## User Review Required

> [!IMPORTANT]
> **DB 및 API 실연동 전환 절차**
> 1. **데이터베이스 스키마 반영**: 제공된 `database_schema.sql`을 PostgreSQL 데이터베이스에 테이블(기사, 사주 카드, 핫존, 영수증 인증 내역, 관리자 등)로 빌드합니다.
> 2. **API 서버 DB 클라이언트 탑재**: `api/src` 내에 Supabase 또는 PostgreSQL 커넥터를 구축합니다.
> 3. **API 엔드포인트 실로직 구현**: Mock 상태인 `/api/recommend/stream` 및 각 도메인별 API(온보딩 저장, 제휴사 정산 이행, 영수증 OCR 대조, 관리자 계정 생성)를 DB CRUD 쿼리와 결합합니다.
> 4. **FO 및 BO 화면 API 결합**: 로컬 스토리지(`localStorage`) 및 임시 메모리 상태로 구동되던 프론트엔드와 백오피스의 데이터 연동부를 실제 REST/SSE API 호출로 마이그레이션합니다.

---

## Proposed Changes

### [NEW] [db.ts](file:///d:/000_UNSU/api/src/utils/db.ts)
*   PostgreSQL 또는 Supabase JS 클라이언트를 구성하여 데이터베이스 연동 세션을 생성합니다.

### [MODIFY] [server.ts](file:///d:/000_UNSU/api/src/server.ts)
*   아래 엔드포인트들을 Zod 검증과 함께 실주입 쿼리로 작성합니다:
    *   `POST /api/drivers` / `GET /api/drivers/:id`: 기사 온보딩 프로필 연동
    *   `GET /api/routine/:id`: 기사별 오늘의 루틴 사주/경로 정보 조회
    *   `GET /api/gpan/hotzones` / `POST /api/gpan/update`: 실시간 핫존 및 수동 갱신 연동
    *   `POST /api/board/ocr`: 영수증 OCR 판독 및 카드 정산액 대조 검증
    *   `GET /api/board/leaderboard`: 오늘 실시간 매출 리더보드
    *   `POST /api/admin/login` / `GET /api/admin/accounts`: 관리자 인증 및 추가 등록 관리

### [MODIFY] [scrape.ts](file:///d:/000_UNSU/api/src/agents/nodes/scrape.ts) 외 LangGraph 노드군
*   기상청/서울시 API 및 데이터베이스의 `hot_zones` 데이터를 RAG 컨텍스트로 불러와 임베딩 및 유사도 매칭을 실행하는 실주입 RAG 상태 머신으로 교체합니다.

### [MODIFY] [FO & BO Pages](file:///d:/000_UNSU/fo/src/pages/)
*   `localStorage` 데이터를 대체하여 실제 백엔드 API 호스트(`VITE_API_URL`)와 비동기 연동을 마칩니다.

---

## Verification Plan

### Automated Tests
*   `npx ts-node api/src/test_workflow.ts`: LangGraph 파이프라인의 API/DB 연계성 단독 테스트 수행.

### Manual Verification
*   **온보딩 & 로그인**: 실제 기사 프로필 가입 및 BO 관리자 신규 가입 시 DB 테이블(`public.drivers`, `public.admin_accounts`)에 마스킹된 데이터 및 해시 레코드가 올바르게 반영되는지 검증.
*   **영수증 검증**: 영수증 업로드 시 실제 OCR 분석이 구동되어 리더보드(`public.revenue_leaderboards`)의 랭킹을 갱신하는지 확인.
