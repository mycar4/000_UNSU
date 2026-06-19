# UNSU 플랫폼 세부 가이드 문서 업데이트 요약

이 문서에서는 기존의 `SmartShopper AI` 템플릿으로 남아 있던 3개의 세부 가이드(`GUIDE_FO.md`, `GUIDE_BO.md`, `GUIDE_API.md`)를 마스터 문서(`README.md`, `SPEC.md`, `DESIGN.md`)에 기반하여 **UNSU 플랫폼(프리미엄 대형 택시 플랫폼)** 전용으로 맞춤형 커스텀 재작성한 결과를 요약합니다.

---

## 1. 프론트엔드 가이드 개편 ([GUIDE_FO.md](file:///d:/000_UNSU/.docs/GUIDE_FO.md))

일반 쇼핑몰 구조에서 **프리미엄 택시 기사 대상 인터페이스**로 전환되었습니다.

*   **4대 핵심 메뉴 라우팅 규격화**:
    1.  `GillogPage.tsx` (오늘의 루틴 / 사주 행운 카드)
    2.  `GPanRadarPage.tsx` (G-PAN 레이더 실시간 관제)
    3.  `RoadboarderPage.tsx` (커뮤니티 / 매출 리더보드)
    4.  `AutopilotPage.tsx` (세무/정산 자율비행 대시보드)
*   **디자인 시스템 적용 규칙 명세**:
    *   `DESIGN.md`의 OKLCH 컬러 기반 테마 적용.
    *   장년층 최적화 130% 상향 타이포그래피(Instrument Sans 우선) 규칙.
    *   `.grid-lines`, `.dot-field` 특수 데코레이션 클래스 사용 가이드.
*   **보안 원칙 강화**:
    *   DOMPurify XSS 방지 및 외부 링크 `WHATWG URL` 프로토콜 검증.
    *   Risk Shield 샌드박스 원칙에 따른 타사 앱 DOM 엑세스 일절 금지.

## 2. 백오피스 가이드 개편 ([GUIDE_BO.md](file:///d:/000_UNSU/.docs/GUIDE_BO.md))

단순 스크래핑 관제 화면에서 **플랫폼 본사 관리자 및 B2B 제휴 정산 통합 화면**으로 전환되었습니다.

*   **핵심 관리 도메인 명세**:
    *   **Tax Autopilot 정산 관제**: 핀테크 API 연동을 통한 기사별 부가세 대행 현황 및 수수료 징수 모니터링.
    *   **제휴 스토어 정산**: 차량 정비, 타이어 네트워크 파트너들의 월별 정산금 집계 도메인.
    *   **G-PAN 알고리즘 관제**: 실시간 기상청/돌발 트래픽 API의 Health Check 및 핫존 추정 로그 분석.
*   **보안 및 DB 연동**:
    *   Supabase RLS(Row Level Security) 설정 및 본사 관리자 도메인 접근 제한.
    *   Audit Trail: 정산 및 정책 변경 시 행위자 로깅 필수 명세.

## 3. 백엔드 API 가이드 개편 ([GUIDE_API.md](file:///d:/000_UNSU/.docs/GUIDE_API.md))

단순 추천 챗봇 에이전트에서 **주행 관제 및 세무 융합 처리를 위한 LangGraph 자율 상태 머신**으로 전환되었습니다.

*   **LangGraph 단일 책임 노드(SRP) 아키텍처**:
    *   `트래픽 수집 ➔ 임베딩 ➔ 핫존 매칭 ➔ Gemini 오디오 요약 ➔ TTS 송출`의 선형 파이프라인.
    *   결함 감지 시 `{ error }` 반환을 통한 즉각적인 `END` 라우팅으로 **LLM 비용 폭증(Hallucination) 방지 가드레일** 구축.
*   **외부 API 브로커 게이트웨이**:
    *   CODEF / 쿠콘 핀테크 브로커 연동을 통한 텍스 오토파일럿 기반 마련.
    *   실시간 기상청 및 서울시 돌발 트래픽 Open API 비동기 융합 방식 정의.
*   **관제 및 영속성 (Observability)**:
    *   LangSmith 실시간 추적을 통한 프로덕션 관제 명세.
    *   Supabase PostgreSQL Checkpointer 연동을 통한 세션 이력 보존 가이드.
