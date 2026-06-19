# [Plan] UNSU 플랫폼 Supabase/PostgreSQL 물리 DB 스키마 설계 계획

상세 기능 정의서(v2.0) 및 아키텍처 가이드라인이 확정됨에 따라, 시스템의 뼈대가 되는 관계형 데이터베이스(PostgreSQL)의 물리 스키마 및 DDL(Data Definition Language) 스크립트를 설계하는 단계입니다.

## User Review Required

> [!IMPORTANT]
> **DB 물리 설계 진입의 적절성 검토**
> *   현재 v2.0 명세 수준에서 데이터 영속화 대상(Entity)과 보안 정책(PII 격리)이 명확히 수립되었습니다.
> *   현 단계에서 DB DDL 스키마를 확정하고 **TypeScript 타입 정의 파일**을 자동 추출하는 것이, 이후 API 명세 작성 및 프론트/백엔드 병렬 구현을 위한 가장 효율적인 설계 경로입니다.

---

## Proposed Changes

### [NEW] [database_schema.sql](file:///C:/Users/webil/.gemini/antigravity-ide/brain/7f67b202-910a-4346-8db2-c2daf92ec180/database_schema.sql)
*   **Driver & Routine Domain**: `drivers`, `daily_lucky_cards`, `recommended_courses` 테이블 정의.
*   **G-PAN Radar Domain**: `hot_zones`, `audio_broadcast_logs` 테이블 정의.
*   **Roadboarder Domain**: `revenue_leaderboards`, `plaza_posts`, `post_likes`, `post_comments` 테이블 정의 (좋아요 중복 차단을 위한 복합 PK 구성).
*   **Autopilot Domain**: `financial_records`, `tax_refunds` 테이블 정의.
*   **Security & Optimization**:
    *   개인정보(PII) 누출 방지를 위한 Supabase RLS(Row Level Security) 기본 가드레일 쿼리 작성.
    *   조회 성능(GPS 반경 검색 및 리더보드 일간 마감) 향상을 위한 공간/인덱스(`INDEX`) 전략 수립.

---

## Verification Plan

### Automated Tests
*   `PostgreSQL 15+` 호환성 검증을 위해 DDL 쿼리 스키마 무결성 정적 린트(Lint) 검증.

### Manual Verification
*   각 테이블 간의 1:N, N:M 관계 매핑이 상세 기능 정의서(v2.0)의 비즈니스 흐름을 완벽히 수용하는지 아키텍트 수준에서 리뷰.
