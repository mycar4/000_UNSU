# [Goal] 실 서비스 구동 및 개발 마무리 (데이터베이스 및 에이전트 상태 영구 보존 완성)

실제 구동 환경에 맞춰 백엔드 API와 LangGraph 에이전트가 PostgreSQL(로컬 도커 및 클라우드 Supabase)과 올바르게 연동되어 동작하도록 데이터베이스 파이프라인 설정을 마무리하고 최종 로직을 검증합니다.

## User Review Required

> [!IMPORTANT]
> **마무리 개발 단계 승인 요청**
> 1. **PostgresSaver 실구동 및 상태 영구 보존**: 기사별 RAG 및 사주 대화 히스토리가 DB에 자동으로 누적 저장되도록 LangGraph의 `PostgresSaver`를 로컬 도커 DB 기반으로 연결하여 검증합니다.
> 2. **실서비스 E2E 기능 검증**: 프로필 설정, 오토파일럿 세무 정산, 리더보드 OCR 영수증 등록, 핫존 데이터 갱신 등 모든 비즈니스 API가 로컬 파일 fallback이 아닌 PostgreSQL 데이터베이스와 연동되어 에러 없이 SQL을 수행하는지 확인합니다.
> 3. **회원 탈퇴 및 3일 재가입 차단 보안 로직**: Supabase/PostgreSQL 스키마 상에서 탈퇴 후 3일 차단 기간 검증 쿼리(`isRejoinRestricted`)가 데이터베이스의 암호화 해시 정보와 정합하여 정상 작동하는지 확인합니다.

## Proposed Changes

### 1. 백엔드 데이터베이스 연결 및 에이전트 체크포인터 실가동

#### [MODIFY] [c:\000_UNSU\.env](file:///c:/000_UNSU/.env)
* 로컬 도커 Postgres 연결 정보(`DATABASE_URL`) 및 복호화용 `SECRET_KEY` 설정을 마쳤습니다. 

#### [MODIFY] [workflow.ts](file:///c:/000_UNSU/api/src/agents/workflow.ts)
* `DATABASE_URL` 유무에 따라 `MemorySaver`에서 `PostgresSaver`로의 연동 전환 로직 및 DB 스키마 셋업이 로컬 환경에서 정상 작동하는지 검증합니다.

#### [MODIFY] [db.ts](file:///c:/000_UNSU/api/src/utils/db.ts)
* 로컬 DB 파일(`local_db.json`) 대신 실제 DB 풀(`pg.Pool`)이 활성화되어 스키마 마이그레이션 및 Seeding이 원활히 동작하는지 확인합니다.

---

## Verification Plan

### Automated Tests
* 로컬 데이터베이스 도커 컨테이너를 가동하고 `npm run build`를 실행하여 컴파일 오류가 없는지 검증합니다.

### Manual Verification (로컬 E2E 테스트)
* **백엔드 기동 확인**: `npm run dev` 시 터미널 로그에 `[DB] PostgreSQL connection pool initialized.` 및 `[Workflow] PostgresSaver initialized for LangGraph.`가 정상 출력되는지 확인합니다.
* **프로필 가입 및 탈퇴 테스트**: 
  - 프론트오피스(/onboarding)에서 프로필을 가입하고, 해당 정보가 DB `public.drivers` 테이블에 암호화되어 정상 저장되는지 확인합니다.
  - 회원 탈퇴를 수행한 뒤, 즉시 재가입을 시도할 때 `isRejoinRestricted` 분기에 의해 `탈퇴 후 3일간은 재가입이 불가능합니다.` 403 에러가 반환되는지 확인합니다.
* **챗봇 세션 대화 테스트**: 대통이 AI 챗봇과 대화 시, DB의 LangGraph 체크포인트 테이블(`checkpoint_writes` 등)에 대화 상태(State)가 원활히 영구 보관되는지 검증합니다.
