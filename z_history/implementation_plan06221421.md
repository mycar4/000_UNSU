# [Goal] 클라우드 프로덕션 환경(Supabase + Gemini) 배포 및 연동

현재 로컬 샌드박스(JSON/Mock 기반)에서 완벽하게 구동되는 UNSU 플랫폼을 실제 클라우드 인프라에 안착시키기 위한 마이그레이션 계획입니다. 데이터베이스는 Supabase(PostgreSQL), 에이전트 추론은 Gemini API를 활용합니다.

## User Review Required

> [!IMPORTANT]
> **보안 환경 변수 파일 템플릿 생성**
> 배포 환경(Render/Vercel)과 로컬 구동 환경에서 안전하게 사용할 `.env` 파일의 템플릿(`.env.example`)을 먼저 프로젝트에 생성할 예정입니다. 이 템플릿을 승인하시면 제가 코드를 작성하겠습니다.

## Open Questions

> [!WARNING]
> **필수 연동 키(Key) 입력이 필요합니다.**
> 실제 DB 및 AI 연결 코드를 테스트하려면 아래 두 가지 정보가 필수적으로 필요합니다. 보안이 걱정되신다면 프로젝트 최상단 폴더에 `.env.local` 파일을 임의로 만드신 후 아래 변수들을 직접 입력해 두셔도 됩니다. (제가 파일에서 읽어가겠습니다.)
> 1. `DATABASE_URL` (Supabase Transaction Connection String - 예: `postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`)
> 2. `GEMINI_API_KEY` (구글 AI 스튜디오 발급)

## Proposed Changes

### 1. 환경 변수 템플릿 구성
#### [NEW] [api/.env.example](file:///c:/000_UNSU/api/.env.example)
* 백엔드 API 및 LangGraph 구동에 필요한 환경변수 명세 작성 (`PORT`, `DATABASE_URL`, `GEMINI_API_KEY`, `SECRET_KEY`).

#### [NEW] [.env.example](file:///c:/000_UNSU/.env.example)
* 프로젝트 루트(Vite 프론트/백오피스) 빌드를 위한 환경변수 명세 작성 (`VITE_API_URL`).

### 2. 백엔드 DB 및 AI 연동 코드 수정
#### [MODIFY] [api/src/utils/db.ts](file:///c:/000_UNSU/api/src/utils/db.ts)
* `DATABASE_URL`을 바라보는 실제 `pg` 모듈 기반 커넥션 풀을 구성하고, Supabase의 테이블을 직접 읽고 쓰도록 데이터베이스 레이어를 활성화합니다. (현재 JSON Fallback 코드가 있다면 전환)

#### [MODIFY] [api/src/agents/workflow.ts](file:///c:/000_UNSU/api/src/agents/workflow.ts)
* LangGraph의 `checkpointer`를 인메모리 방식에서 `@langchain/langgraph-checkpoint-postgres` 플러그인을 사용하여 Supabase에 에이전트 상태(State)가 영구 보존되도록 전환합니다.
* LLM 호출 노드에 실제 `GEMINI_API_KEY`가 주입되도록 수정합니다.

## Verification Plan

### Automated Tests
- `npm run build`: 수정 후 타입/빌드 에러가 없는지 다시 확인합니다.
- `tsx src/test_workflow.ts`: 실제 Supabase DB 커넥션을 맺고 Gemini API를 타서 LangGraph 파이프라인이 정상적으로 동작하는지 통합 테스트를 수행합니다.

### Manual Verification
- 유저님께서 Supabase 대시보드에 직접 접속하셔서, LangGraph 워크플로우 실행 시 생성되는 `checkpoint` 테이블들과 `drivers` 정보가 성공적으로 기록(Insert/Update)되는지 시각적으로 확인합니다.
