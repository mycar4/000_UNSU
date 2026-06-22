# UNSU 플랫폼 개발 인수인계서 (HANDOVER.md)

* **최종 작성일시**: 2026-06-23T01:00:00+09:00
* **작성자**: Antigravity AI 시스템 엔지니어

---

## 🛠️ 1. 현재 개발 상태 및 완료된 작업 (Current State & Completed Tasks)

### ① GILLOG 정적 만세력 알고리즘 완벽 교정 및 본원 기준 교정
* **대상 파일**: [manse.ts](file:///d:/000_UNSU/api/src/utils/manse.ts)
* **상세**:
  * 1970-01-01 기점 일진 오프셋을 천문역학적 기준인 **신사(辛巳)일** (Gan=7, Ji=5)로 수학적 보정을 적용하여 신뢰도를 확립했습니다.
  * 사주 분석 시 개인의 핵심 자아를 판정하는 본원(`myElement`)의 판정 기준을 기존 년천간에서 실제 표준 역학 규격인 **일천간(dayGan)** 기준으로 변경했습니다.
  * 24절기 월별 입절 기준일 근사치 배열(`JOEL_DAYS`)을 조율하여 월주/년주 판정의 정확도를 상향 조정했습니다.
  * `deficientElement` (부족한 오행) 계산 결과를 `ManseResult` 인터페이스 및 API 반환 값에 추가하여 연동성을 높였습니다.

### ② '달의 뒷편' 오행 힐링지 확충 및 RAG 혼잡 회피 필터 도입
* **대상 파일**: [server.ts](file:///d:/000_UNSU/api/src/server.ts), [DarksidePage.tsx](file:///d:/000_UNSU/fo/src/pages/DarksidePage.tsx)
* **상세**:
  * 결여되어 있던 **화(Fire)** 및 **금(Metal)** 오행 테마의 고품격 힐링지 4곳을 추가하여 5대 오행 밸런스를 구축했습니다.
  * 기사의 부족 오행(`deficientElement`) 정보를 바탕으로 맞춤 명소가 1순위 매칭되도록 규칙을 조율했습니다.
  * 백엔드에 `/api/recommend/rest` POST 라우터를 신설하여 기존 `/api/external/darkside`와 인수인계 호환성을 마련했습니다.
  * 1만 명 이상 밀집 구역의 교통 정체 및 우회 경로 팁을 지시하는 AI 브리핑 RAG 프롬프트를 강화했습니다.
  * 상단 헤더(`TopAppBar.tsx`)의 `ON/OFF DUTY` 상태 뱃지 클릭 시 즉시 `/darkside` 페이지로 이동하도록 링크를 연결하고, 글로벌 영업/휴식 상태가 양방향으로 동기화되도록 연동 완료했습니다.

### ③ 대통이 Talk AI 챗봇 컴포넌트 분리 리팩토링 및 빌드 에러 해결
* **대상 파일**: [FloatingChatbot.tsx](file:///d:/000_UNSU/fo/src/components/chat/FloatingChatbot.tsx), [AppLayout.tsx](file:///d:/000_UNSU/fo/src/components/layout/AppLayout.tsx)
* **상세**:
  * `AppLayout.tsx` 내에 수십 줄에 걸쳐 인라인으로 작성되어 있던 챗봇 상태값과 메시지 전송 로직을 독립 컴포넌트인 `<FloatingChatbot />`로 완전 이관 및 리팩토링했습니다.
  * 빌드 과정에서 발생했던 `useEffect` 내의 반환값 타입 불일치(TS7030: Not all code paths return a value) 에러를 방어 코드로 수정하여 해결했습니다.

### ④ Supabase DB 연결 및 인프라 최적화
* **대상 파일**: [.env](file:///d:/000_UNSU/.env), [server.ts](file:///d:/000_UNSU/api/src/server.ts)
* **상세**:
  * `DATABASE_URL`을 활성화된 Supabase 프로젝트 ID(`dfnbqgycggqusweetfzn`)로 일치시켰습니다.
  * 로컬 환경에 따라 IPv6 우선 순위로 연결하여 발생하는 `ENETUNREACH` 에러 해결을 위해 Node.js DNS 해석 방식을 IPv4 우선(`dns.setDefaultResultOrder('ipv4first')`)으로 일괄 패치 적용 완료했습니다.

---

## 🏃 2. 다음에 진행할 작업 (Next Tasks)

### 1순위: Supabase 실시간 데이터 및 마이그레이션 확인
* **세부 작업**:
  * 브라우저 Supabase Dashboard 화면의 테이블 (`drivers`, `hot_zones`, `daily_lucky_cards` 등) 데이터가 프론트오피스 동작에 맞춰 제대로 삽입/갱신되는지 테이블 데이터 정합성 확인.

### 2순위: Gemini API 연동을 통한 실시간 채팅 기능 검증
* **세부 작업**:
  * `.env` 파일에 유효한 `GEMINI_API_KEY`를 설정한 후, 대통이 Talk 챗봇을 통해 사주 일진 기반 날씨/교통 RAG 컨텍스트 대화가 실시간으로 매끄럽게 응답하는지 최종 확인.

### 3순위: GPS 위치 기반 날씨/교통 실시간 추천 고도화
* **세부 작업**:
  * 브라우저 Geolocation API를 연동하여, 실제 드라이버의 위치(구/동 단위) 정보에 맞춰 local weather 및 traffic 정보가 동적으로 반영되도록 정밀 수신 조율.

---

## ⚙️ 3. 개발 및 실행 환경 참고 사항 (Run Commands)

* **백엔드 API 서버**: `npm run dev` (루트 폴더에서 dev 기동 중)
* **빌드 확인**: `npm run build`
* **에이전트 워크플로우 테스트**: `npm run test:workflow --workspace=api`
