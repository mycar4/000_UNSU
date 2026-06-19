# UNSU 플랫폼 세부 가이드 문서(GUIDE_FO, GUIDE_BO, GUIDE_API) 재작성 계획

기존 `SmartShopper AI` 관련 내용으로 채워져 있던 `.docs` 폴더 내 세부 가이드 3종을 마스터 문서(`README.md`, `SPEC.md`, `DESIGN.md`)의 명세에 완벽히 일치하도록 전면 재작성합니다.

## User Review Required

> [!IMPORTANT]
> **대규모 문서 덮어쓰기 안내**
> 기존 SmartShopper 관련 내용은 모두 삭제되며, UNSU 플랫폼 전용 아키텍처 및 요구사항으로 대체됩니다. 수정 계획을 확인하신 후 승인해 주시면 즉시 작성을 시작하겠습니다.

## Open Questions

> [!WARNING]
> 백오피스(BO)의 구체적인 제휴 몰 정산 관련 상세 기능이나 대시보드 지표에 대해 추가하고 싶은 특별한 요구사항이 있다면 알려주세요. 기본적으로 `SPEC.md`에 기반한 관제/정산 기능 위주로 구성하겠습니다.

## Proposed Changes

### Documentation (세부 가이드 재작성)

#### [MODIFY] [GUIDE_FO.md](file:///d:/000_UNSU/.docs/GUIDE_FO.md)
*   **변경 개요**: 일반 쇼핑몰 구조에서 **프리미엄 택시 기사 대상 인터페이스**로 전환.
*   **주요 반영 내용**:
    *   **메뉴 구조 변경**: GILLOG 홈, G-PAN 레이더, 로드보더 커뮤니티, 오토파일럿 대시보드로 라우팅 및 폴더 구조 개편.
    *   **디자인 시스템 적용**: `DESIGN.md`에 명시된 OKLCH 컬러 기반 (Cream/Deep Slate), 장년층 최적화 타이포그래피(130% 상향, Instrument Sans), `.grid-lines`, `.dot-field` 특수 유틸리티 적용 가이드 추가.
    *   **보안 및 제약 사항**: WHATWG URL 프로토콜 준수, DOMPurify XSS 필터링, Risk Shield 샌드박스 관련 프론트엔드 처리 지침 명시.

#### [MODIFY] [GUIDE_BO.md](file:///d:/000_UNSU/.docs/GUIDE_BO.md)
*   **변경 개요**: 쇼핑몰 스크래퍼 관제 화면에서 **플랫폼 본사 관리자 및 B2B 제휴 정산 화면**으로 전환.
*   **주요 반영 내용**:
    *   **핵심 관리 도메인**: 
        1. 기사 수익 및 수수료/세무 대행 정산 관제 (Tax Autopilot 연동)
        2. 제휴 파트너(타이어, 정비소) 스토어 정산 현황
        3. G-PAN 돌발 트래픽/기상청 핫존 알고리즘 가동 상태 모니터링
    *   **Supabase Admin 연동**: 관리자 RLS 정책 설정 및 Audit Trail(이력 보존) 명세.

#### [MODIFY] [GUIDE_API.md](file:///d:/000_UNSU/.docs/GUIDE_API.md)
*   **변경 개요**: 상품 추천 에이전트에서 **주행 관제 및 세무 자동화 LangGraph 기반 단일 책임 에이전트**로 전환.
*   **주요 반영 내용**:
    *   **파이프라인 아키텍처 (SRP)**: `시작 ➔ 트래픽 스크래핑 ➔ 임베딩 ➔ 핫존 검색 ➔ 오디오 요약 ➔ TTS 최종 송출` 형태의 노드 구성 및 에러 시 즉시 `END` 분기(비용 절감) 로직 명시.
    *   **외부 연동 게이트웨이**: CODEF/쿠콘 핀테크 API 연동(세무 자동화), 기상청/서울시 돌발 트래픽 Open API 연동.
    *   **옵저버빌리티 & 백엔드**: LangSmith 프로덕션 관제 가이드 유지(UNSU 도메인 적용) 및 Supabase(PostgreSQL + Vector) 스키마 매핑 원칙.

---

## Verification Plan

### Manual Verification
*   업데이트된 3개의 가이드 문서가 `README.md`, `SPEC.md`, `DESIGN.md`의 도메인(UNSU 플랫폼), 기술 스택(LangGraph, Supabase, Tailwind v4 등), 디자인 규칙과 모순되지 않는지 육안으로 크로스 체크합니다.
