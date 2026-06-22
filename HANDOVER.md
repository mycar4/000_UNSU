# UNSU 플랫폼 개발 인수인계서 (HANDOVER.md)

* **최종 작성일시**: 2026-06-22T17:45:00+09:00
* **작성자**: Antigravity AI 시스템 엔지니어

---

## 🛠️ 1. 현재 개발 상태 및 완료된 작업 (Current State & Completed Tasks)

### ① 공공 데이터 OpenAPI 실제 연동 완료 ([services/externalApi.ts](file:///c:/000_UNSU/api/src/services/externalApi.ts))
* **기상청 날씨 (Open-Meteo)**: 실시간 온도, 기상 상태 코드, 강수 확률을 연동했습니다.
* **서울시 실시간 교통 돌발 정보 (AccidentInfo)**: 실시간 도로 통제 및 사고 데이터를 파싱하여 바인딩했으며, 돌발 상황이 없을 시 `올림픽대로 원활`과 같은 정상 소통 상황을 동적으로 출력하도록 예외 흐름을 보완했습니다.
* **지하철 실시간 위치 (서울 열린데이터광장)**: 강남역 등 주요 지하철 실시간 도착 정보를 파싱 및 매핑 완료했습니다.
* **대중교통 (열차/광역철도/항공)**: 코레일 기차 정보, 수도권 광역전철 도착, 공항편 승객 출도착 정보를 API 바인딩했습니다. 미승인 API 키 혹은 에러 시 `try-catch` 가드를 통해 Zod 형식을 유지한 Mock 데이터로 Graceful Fallback 되도록 설계했습니다.
* **KOPIS 공연예술 API**: 실시간 연극/뮤지컬 정보를 수집하고 정규식(Regex)을 이용한 고속 XML 파서(`parseKopisXml`)를 직접 적용하여 JSON 스키마로 안정적으로 반환하도록 설계했습니다.

### ② 5분 주기 G-PAN 백그라운드 Polling 캐싱 구축 ([server.ts](file:///c:/000_UNSU/api/src/server.ts))
* 서버 구동 시 및 **5분(300,000ms)** 마다 백그라운드 타이머(`setInterval`)를 기동하여 날씨, 교통, 지하철, KTX, 항공, 공연 행사 정보를 일괄 수집하도록 구축했습니다.
* 수집 시 `'dashboard'`, `'transport'`, `events_[today]` 캐시를 강제 비동기 갱신(Warming Up)하여, 사용자 호출 시 초고속 응답을 보장하고 외부 Rate-Limit을 효과적으로 우회합니다.
* 수집 결과를 `apiConfig.ts`에 동기화하여 백오피스(BO)의 Scraper 헬스 대시보드에 실시간 정상/오류 수치가 매핑됩니다.

### ③ 데이터베이스 및 상태 보존 안전성 강화
* PostgreSQL 도커 컨테이너 정지 상황에서도 `MemorySaver`로 자동 fallback되어 백엔드 서버가 안정적으로 가동됩니다.
* LangGraph 에이전트 구동 시 `thread_id` 파라미터 조립을 완벽히 교정하여 대화 및 RAG 상태 보존 오류가 해결되었습니다.
* 탈퇴 처리 후 3일 이내 재온보딩 가입 시도 시 `403 Forbidden` 차단 기능 및 복호화 통제(`crypto.ts`)가 완벽히 연동됩니다.

---

## 🏃 2. 다음에 진행할 작업 (Next Tasks)

### 1순위: GILLOG 정적 만세력 이식 및 사주 스코어 계산 완성
* **타깃 파일**: `api/src/utils/manse.ts`
* **세부 작업**:
  * 기사의 생년월일시 복호화 데이터를 천문 연산 공식에 대입하여 육십간지(일진) 및 오행(목, 화, 토, 금, 수)의 분포를 정밀하게 도출하는 로직 구현.
  * 계산된 오행 분포 중 가장 부족한 오행 요소를 판별해 내는 내부 스코어 알고리즘 고도화.
  * 계산된 사주 점수를 기반으로 Gemini LLM 브리핑 가이드와 결합하여 비용 제로의 1차 행운 내러티브 생성.

### 2순위: '달의 뒷편' 여가 휴식 동선 추천 시스템 고도화
* **타깃 파일**: `api/src/server.ts` 내의 `/api/recommend/rest` 핸들러 및 프론트오피스 UI
* **세부 작업**:
  * 한국문화정보원 및 KOPIS 축제 데이터를 기사의 부족한 사주 오행 요소(태그)와 매칭하여 맞춤형 힐링 코스 제안.
  * 쉬는 날 혼잡한 지역(예: 축제/콘서트가 열려 도로가 정체되는 지역)을 필터링하여 우회 경로 조언 템플릿 강화.

### 3순위: 대통이 Talk AI 챗봇 프론트 전면 연동
* **타깃 파일**: `fo/src/components/chat/FloatingChatbot.tsx` (또는 FO 플로팅 대화창 위젯) 및 백엔드 `/api/chat`
* **세부 작업**:
  * 백엔드 RAG 챗봇 엔드포인트와 모바일 화면 우측 하단의 플로팅 대화창 위젯을 연결하여 실시간 양방향 대화 연동.

---

## ⚙️ 3. 개발 및 실행 환경 참고 사항 (Run Commands)

* **백엔드 API 서버**: `npm run dev --workspace=api` (또는 루트 폴더에서 `npm run dev`)
* **빌드 확인**: `npm run build` (워크스페이스 전체 clean build 통과 완료)
* **에이전트 워크플로우 테스트**: `npm run test:workflow --workspace=api`
