# UNSU AI 플랫폼 고도화 및 옵시디언(Obsidian) 통합 구현 계획서

본 계획서는 Next.js 대시보드(`unsu-ai-dashboard`)의 실시간 AI 스트리밍 API 연동, LangGraph 노드의 AI 브리핑 고도화, 그리고 옵시디언(Obsidian) PKM 연동을 위한 감사 로그 및 AI 리포트의 마크다운 자동 출력 시스템을 구축하기 위한 아키텍처 및 구현 사양을 정의합니다.

## User Review Required

> [!IMPORTANT]
> **1. 백엔드와 Next.js 간의 포트 및 도메인 바인딩**
> * Next.js 대시보드가 로컬에서 작동(http://localhost:3000)할 때, Express API 서버(http://localhost:3001)의 `/api/recommend/stream` 스트리밍 엔드포인트를 호출하기 위해 CORS 구성 및 프론트 브라우저에서의 WHATWG URL 표준 검증 계층을 마련합니다.
>
> **2. Obsidian 연동용 마크다운 파일 자동 기록 경로**
> * 옵시디언에서 Dataview 쿼리와 그래프 뷰를 활용할 수 있도록, 시스템 감사 로그 및 기사 리포트 파일 생성 시 `d:/000_UNSU/z_history/audit_logs/` 및 `d:/000_UNSU/z_history/reports/` 경로 하위에 마크다운 파일(`.md`) 형태로 즉시 자동 생성하여 쓰기 작업을 수행합니다.

## Proposed Changes

---

### [Component 1] Next.js 대시보드 (`unsu-ai-dashboard`)

정적 컴포넌트로만 구성되어 있던 랜딩 페이지의 "AI 분석 리포트 미리보기" 컴포넌트를 실제 Express 백엔드의 Server-Sent Events(SSE) 에이전트 스트리밍 엔드포인트와 연동하여 실시간으로 받아 타이핑하듯이 렌더링되게 만듭니다.

#### [MODIFY] [report-preview.tsx](file:///d:/000_UNSU/unsu-ai-dashboard/components/report-preview.tsx)
* 사용자가 검색창에 "강남역", "인천공항" 등을 입력한 뒤 제출(Submit)하면, 백엔드 API인 `/api/recommend/stream?q={query}`를 `EventSource` 또는 `fetch` ReadableStream으로 구독하여 실시간 누적 출력하도록 코드를 전면 개편합니다.
* 에이전트 요약 보고서를 렌더링할 때 React 19의 안전한 렌더링 가이드를 따라, **DOMPurify**를 사용해 살균(Sanitize)한 뒤 HTML 마크다운 렌더러에 포워딩하여 스크립트 주입(XSS)을 방지합니다.

---

### [Component 2] LangGraph AI 백엔드 (`api`)

단순 하드코딩된 모의 텍스트를 출력하던 `summarizer` 노드를 실제 환경 변수 및 상태의 매개변수를 참조하여 리포트를 작성하도록 고도화하고, 감시 로그 및 보고서 생성 즉시 옵시디언 Vault가 읽을 수 있는 마크다운 파일 형태로 자동 기록(YAML Frontmatter 삽입)하는 어댑터를 설계합니다.

#### [MODIFY] [summarizer.ts](file:///d:/000_UNSU/api/src/agents/nodes/summarizer.ts)
* `state.hotzones`와 `state.userQuery`를 받아, 실제 돌발 트래픽/기상 현상 맥락을 바탕으로 가독성이 우수한 시니어 전용 마크다운 보고서(130% 가독성 향상 어투) 및 DJ 라디오 방송용 TTS 스크립트를 작성하도록 템플릿과 연산 로직을 보완합니다.
* AI 리포트 컴파일이 완료되는 시점에, 백그라운드에서 `d:/000_UNSU/z_history/reports/report_[timestamp].md` 경로로 파일을 자동 저장하는 파일 라이터 기능을 추가합니다.
  * 리포트 파일 상단에는 옵시디언 Dataview를 위한 YAML 프론트매터(`type: report`, `query: ...`, `status: ...`, `date: ...`)를 강제 삽입합니다.

#### [MODIFY] [db.ts](file:///d:/000_UNSU/api/src/utils/db.ts)
* 백오피스 감사 로그를 기록하는 `saveAuditLog(operator, action, targetId, details)` 함수 내부를 보완합니다.
* 관계형 데이터베이스(`pg`/Supabase)에 레코드를 적재하는 것과 동시에, `d:/000_UNSU/z_history/audit_logs/audit_[timestamp].md` 파일 경로에 옵시디언용 YAML 프론트매터(`type: audit-log`, `operator: ...`, `action: ...`, `date: ...`)를 포함한 감사 로그 보고서 마크다운을 자동으로 작성하도록 파일 쓰기 로직을 주입합니다.

---

## Verification Plan

### Automated Tests
* 백엔드 API 서버를 실행하고 Next.js 대시보드 컴포넌트에서 SSE 요청이 에러 없이 안전하게 정렬되는지 브라우저 개발자 도구의 Network(SSE) 탭을 통해 전송 패킷을 직접 검증합니다.
* `npm run test:workflow` 스크립트를 기동하여 LangGraph 상태 머신이 정상적으로 예외 없이 마감되는지 점검합니다.

### Manual Verification
* `npm run watch:history`가 구동된 상태에서, 백오피스 또는 API Playground에서 기사 정보를 수정하거나 AI 스트리밍을 요청한 뒤, `d:/000_UNSU/z_history/audit_logs/` 및 `d:/000_UNSU/z_history/reports/` 폴더 아래에 YAML 프론트매터가 정밀하게 조립된 마크다운 파일이 오차 없이 즉시 자동 생성되는지 디렉터리 내 생성 파일들을 검사합니다.
