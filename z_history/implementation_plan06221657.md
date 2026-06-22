# [Plan] G-PAN 레이더 실체화 및 공공 데이터 API 연동 이행 계획서 (v6.0)

본 계획서는 `UNSU (운수)` 플랫폼의 G-PAN 레이더 핵심 기능을 완성하기 위해, 기존의 Mock 데이터를 배제하고 실제 공공 데이터 API(서울시 돌발 교통, 코레일 KTX, KOPIS 공연예술, 기상청 등)를 백엔드에 바인딩하며, 5분 주기의 백그라운드 Polling 동기화 시스템을 가동하여 캐시 및 시스템 안정성을 확보하기 위한 이행 계획입니다.

## User Review Required

> [!IMPORTANT]
> **핵심 검토 사항**
> 1. **결함 격리 (Fallback) 구조**: API 호출 실패, 타임아웃(3~5초), 혹은 인증키 오류(401, 500 등) 발생 시 전체 시스템에 장애가 전파되지 않도록, 기존의 안정적인 Mock 데이터를 Fallback으로 사용하여 기사 서비스 가동을 100% 보장합니다.
> 2. **경량 XML 파서 도입**: 외부 라이브러리 추가 없이 정규식(Regex)을 이용한 고속 XML 파서를 적용하여 KOPIS API 응답(XML 형식)을 JSON 객체로 파싱하고 `Zod` 스키마로 검증합니다.
> 3. **5분 주기 Polling 시스템**: 서버 기동 시 백그라운드 타이머(`setInterval`)를 통해 5분 주기로 교통/대중교통/문화행사 API 데이터를 병렬 동기화하여 캐시를 사전 갱신하고, 사용자 API 호출 응답 속도를 극대화합니다.

## Proposed Changes

### [Component] Backend Services & Server (API Binding & Polling)

#### [MODIFY] [externalApi.ts](file:///c:/000_UNSU/api/src/services/externalApi.ts)
* **서울시 실시간 돌발 정보 API 바인딩**: `fetchTrafficInfo()`에서 서울 Open API `AccidentInfo` 서비스를 실제 호출하고, 결과를 파싱하여 `TrafficInfoSchema`에 유효한 객체로 매핑합니다.
* **KOPIS 공연예술 API 바인딩**: `fetchAggregatedEvents()`와 `fetchLocalEvents()`에서 `KOPIS_API_KEY`를 사용해 공연 목록을 XML로 받아와 정규식으로 안전하게 파싱하여 `RawEvent[]` 형태로 수집합니다.
* **대중교통(열차/광역철도) API 바인딩**: `fetchTrainStatus()` 및 `fetchMetroSubway()`에서 공공데이터포털(apis.data.go.kr) API 명세에 근거한 fetch 호출을 작성하되, 제공된 인증키로 호출 실패 시 Mock 데이터로 전환되도록 견고하게 가드합니다.

#### [MODIFY] [server.ts](file:///c:/000_UNSU/api/src/server.ts)
* **5분 주기 백그라운드 Polling 시스템 가동**:
  * 서버 시작 시 5분(`300,000ms`) 주기 타이머를 실행하여 `fetchWeather()`, `fetchTrafficInfo()`, `fetchAirportFlights()`, `fetchTrainStatus()`, `fetchSeoulSubway()`, `fetchMetroSubway()`, `fetchAggregatedEvents()` 데이터를 비동기 병렬 수집하고 캐시를 갱신합니다.
  * API 호출의 성공/실패 여부를 `apiConfig.ts`의 `recordApiCall`을 통해 백오피스 모니터링 대시보드와 동기화합니다.

---

## Verification Plan

### Automated Tests
* **빌드 검증**: `npm run build`를 실행하여 컴파일 에러 및 의존성 문제가 없는지 검증합니다.
* **워크플로우 테스트**: `npm run test:workflow --workspace=api`를 실행하여 핫존 및 RAG 요약 에이전트 노드가 정상 작동하는지 확인합니다.

### Manual Verification
* **백엔드 폴링 로그 확인**: 백엔드 서버 콘솔에 `[G-PAN Polling] Running 5-minute background synchronization...` 메시지와 각 API 수집 상태 및 헬스 체크 결과가 기록되는지 확인합니다.
* **API 호출 응답 검증**: Postman 또는 브라우저에서 `/api/external/dashboard`, `/api/external/events`, `/api/external/transport` 엔드포인트를 호출하여 실제 바인딩된 응답값의 포맷이 Zod 스키마와 부합하는지 교차 검증합니다.
