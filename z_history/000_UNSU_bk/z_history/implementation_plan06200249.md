# [Plan] UNSU 플랫폼 4대 핵심 메뉴 세부 기능 정의서 확정 계획

사용자 UI를 고정한 상태에서, 데이터베이스 설계 단계로 넘어가기 전 기능 명세 및 데이터 상호작용 규칙을 극도로 세밀하게 확정하기 위한 상세 기능 정의 수립 계획입니다.

## User Review Required

> [!IMPORTANT]
> **기능 명세 구체화의 목적**
> *   단순히 화면의 텍스트가 아닌, **버튼 클릭 시의 상태 전이, API 호출 예외 시의 복구 시나리오(Fallback), AI 에이전트(LangGraph)와의 데이터 입출력 타이밍**을 정의합니다.
> *   이를 통해 개발/운영 Gem 및 PM Gem이 물리 DB 스키마 및 API 명세서를 한 번에 결함 없이 도출할 수 있도록 돕습니다.

---

## Proposed Changes

### [NEW] [detail_functional_spec.md](file:///C:/Users/webil/.gemini/antigravity-ide/brain/7f67b202-910a-4346-8db2-c2daf92ec180/detail_functional_spec.md)
*   **MENU 01: 오늘의 루틴 (GILLOG)**
    *   기사 사주 매핑 및 당일 행운 카드 생성 AI 프롬프트 맥락 정의.
    *   아침 핵심 추천 코스 추출 알고리즘과 티맵 연동을 위한 WHATWG URL 프로토콜 안전 규격.
*   **MENU 02: G-PAN 레이더 (실시간 관제)**
    *   Zero-Touch 오디오 스트리밍 비동기 플레이어 상태 머신 (Play ➔ Pause ➔ Buffering ➔ Error).
    *   핫존 실시간 갱신 주기(Polling vs Server-Sent Events) 및 GPS 수신 감쇄 시 Fallback 요건.
*   **MENU 03: 로드보더 (리더보드 & 커뮤니티)**
    *   매출 리더보드 일간 정산 마감 타이밍(AM 09:00) 및 어뷰징(허위 매출) 방지 검증 흐름.
    *   기사 광장 스레드 게시글 추가, 좋아요 중복 방지 로직, DOMPurify 기반 XSS 방어 가이드라인.
*   **MENU 04: 오토파일럿 (경영/정산)**
    *   CODEF/쿠콘 API 호출 타임아웃 처리 및 홈택스 점검 시간(매일 00:00~09:00 등) 대피용 Local Caching 정책.
    *   예상 부가세/종소세 환급 로직의 단순 계산식(과세표준 및 매입세액 공제) 정의.

---

## Verification Plan

### Manual Verification
*   기재된 세부 예외 시나리오 및 상태 머신이 실제 비즈니스 요구사항에 부합하는지 PM 및 기획 관점에서 검토 및 승인.
