# [Plan] UNSU 플랫폼 컴파일 오류 해결 및 프로덕션 배포(Supabase + Render.com + Vercel) 계획

이전 대화 로그(`chat_log_06220342.jsonl`)의 맥락을 분석하고, 로컬 구동 중 발생한 컴파일 및 타입 에러를 신속히 수정한 뒤 실제 웹 프로덕션 환경(Supabase 데이터베이스, Render.com 백엔드 API, Vercel 프론트엔드/백오피스)으로의 안전한 마이그레이션 및 배포를 지원하기 위한 통합 실행 계획입니다.

## User Review Required

> [!IMPORTANT]
> **컴파일 오류 수정 및 배포 준비 완료**
> - **조치 완료**: 이미 로컬 monorepo의 TypeScript 컴파일 오류(중복 임포트, Zod 타입 유추 실패, manse.ts 변수 선언/중복 키)를 해결하였으며, `npm run build` 및 `npm run test:workflow`를 실행하여 무결성을 자동 검증했습니다.
> - **승인 요청**: 아래의 Supabase 스키마 셋업과 Render.com(백엔드) 및 Vercel(프론트엔드) 배포 계획을 검토해 주시고 승인해 주시면, 클라우드 환경 변수 주입 가이드 제공 및 배포 설정 파일 구성을 최종 지원하겠습니다.

## Open Questions

> [!WARNING]
> - **Supabase 데이터베이스 연결**: 현재 로컬 JSON 샌드박스로 가동 중인데, 실제 Supabase PostgreSQL 연결 문자열(`DATABASE_URL`)을 발급받으셨나요? 배포 진행 시 Supabase Dashboard에서 `Transaction Connection String` 또는 `Session Connection String`을 발급받아 환경 변수에 바인딩해야 합니다.
> - **Gemini API 키**: 구글 AI 스튜디오에서 발급받으신 `GEMINI_API_KEY`가 배포 시 비밀 환경 변수로 등록될 예정입니다.

## Proposed Changes

### Backend API Configuration

#### [MODIFY] [server.ts](file:///c:/000_UNSU/api/src/server.ts)
* **조치 완료**: `fetchWeather` 및 `fetchAggregatedEvents` 중복 import 구문(919라인)을 제거하여 중복 선언(TS2300) 오류를 해소했습니다.

#### [MODIFY] [externalApi.ts](file:///c:/000_UNSU/api/src/services/externalApi.ts)
* **조치 완료**: Zod `.safeParse()` 결과 반환 시 TypeScript 타입 호환성(Strict assignability) 문제를 극복하기 위해 `as WeatherData`, `as TrafficInfo`, `as FlightInfo[]`, `as TrainInfo[]` 단언(Assertion)을 추가하여 빌드 에러를 완치했습니다.

#### [MODIFY] [manse.ts](file:///c:/000_UNSU/api/src/utils/manse.ts)
* **조치 완료**: `ELEMENT_MAP` 내 중복된 '신': '금' 키를 하나로 통합(TS1117 해소)하고, 사주 계산에 필요한 `dayGan` 및 `dayJi` 변수를 정상 선언(TS2552 해소)하여 연산 로직을 견고히 보강했습니다.

---

### Cloud Deployment Strategy (웹 프로덕션 배포 계획)

#### 1. Database: Supabase PostgreSQL Setup
* Supabase 프로젝트를 생성하고 SQL Editor에 `database_schema.sql` 소스를 실행하여 테이블(drivers, daily_lucky_cards, hot_zones, admin_accounts 등)과 RLS(Row Level Security) 정책 및 인덱스를 구축합니다.

#### 2. Backend API: Render.com Deployment
* `api/` 워크스페이스의 백엔드를 Render.com의 Web Service로 배포합니다.
* **환경 변수 구성**:
  - `PORT`: `3001`
  - `DATABASE_URL`: Supabase Connection String (포트 5432, pg풀러 대응)
  - `GEMINI_API_KEY`: 구글 AI 스튜디오 API Key
  - `SECRET_KEY`: AES-256-GCM 암호화에 사용할 임의의 안전한 32바이트 대칭키

#### 3. Frontend & Backoffice: Vercel Deployment
* `fo/` (프론트오피스)와 `bo/` (백오피스)를 Vercel 프로젝트로 각각 배포합니다.
* **환경 변수 구성**:
  - `VITE_API_URL`: Render.com에 배포된 백엔드 API 서비스 URL (예: `https://unsu-api.onrender.com`)

---

## Verification Plan

### Automated Tests
* [x] `npm run build`: Monorepo 전체 빌드가 경고/에러 없이 성공적으로 수행되는지 검증 완료.
* [x] `npm run test:workflow --workspace=api`: 로컬 캐시/JSON 폴백 상태에서 LangGraph RAG 에이전트 노드들이 순차적으로 정상 연산 및 보고서를 생성해내는지 검증 완료.

### Manual Verification
* **Supabase 연동 실 테스트**: 로컬 `.env`에 실제 Supabase URL을 주입한 상태에서 온보딩 기사 생성 시 Supabase 대시보드 테이블에 암호화된 `hometax_id` 컬럼이 적재되는지 E2E 검증.
