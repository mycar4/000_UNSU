# UNSU 플랫폼 DB 스키마 설계 및 DDL 구축 요약

상세 기능 정의서(v2.0)에 따라, AI 및 핀테크 자율 정산을 지원하기 위한 **Supabase/PostgreSQL 15+ 호환 물리 DB 스키마([database_schema.sql](file:///d:/000_UNSU/database_schema.sql))** 설계를 성공적으로 완료했습니다.

---

## 1. 관계형 데이터 모델 및 스키마 구조
총 10개 핵심 테이블을 생성하여 도메인 간 결합도를 낮추고 데이터 무결성을 보장했습니다.

*   **Drivers & Onboarding (`drivers`)**
    *   Supabase Auth 고유 식별자(`UUID`)를 PK로 연동.
    *   사주 연산에 필요한 `birth_date` 및 `birth_time` 필드와 홈택스 연동용 `hometax_id` 수용.
*   **GILLOG 오늘의 루틴 (`daily_lucky_cards`, `recommended_courses`)**
    *   사주 행운 카드의 중복 생성을 막기 위해 `(driver_id, lucky_date)` 복합 UNIQUE 키 지정.
    *   티맵 링크 전송 시각(`tmap_sent_at`)을 기록하여 사용자 동선 행동 분석 지원.
*   **G-PAN 레이더 (`hot_zones`, `audio_broadcast_logs`)**
    *   실시간 핫존 위경도 좌표(`latitude`, `longitude`) 데이터 적재.
    *   오디오 관제 히스토리를 추적하기 위한 기사별 방송 로그 보관.
*   **로드보더 (`revenue_leaderboards`, `plaza_posts`, `post_likes`, `post_comments`)**
    *   매출 정보 허위 방지 사후 대조를 지원하는 매출 영수증 검증 데이터 모델 구축.
    *   **중복 좋아요 원천 금지**: `post_likes` 테이블의 Primary Key를 `(post_id, driver_id)` 복합키로 설정하여 DB 제약 조건 레벨에서 중복을 완전 차단.
*   **오토파일럿 정산 (`financial_records`, `tax_refunds`)**
    *   월간/일간 가산 환급액 조회를 지원하는 월간 경영 지표(`financial_records`) 복합 UNIQUE 제약 수립.
    *   정기 점검 시간 중 예약 정산 대기 상태를 지원하는 `status` (`PENDING`, `SUCCESS`, `FAILED`) 구조 설계.

## 2. 쿼리 성능 튜닝 및 인덱스 (INDEX) 최적화
대용량 트래픽 및 공간 연산을 고려하여 5개의 고효율 인덱스를 추가했습니다.
*   `idx_drivers_birth_date`: 사주(만세력) 1회성 계산 성능 최적화.
*   `idx_leaderboards_date_revenue`: 매출 리더보드 일간 마감(AM 09:00) 정렬 속도 극대화.
*   `idx_hotzones_coordinates`: 기사 반경 5km 핫존 공간 검색 쿼리 부하 최소화.

## 3. 개인정보 보호를 위한 Row Level Security (RLS) 규칙 수립
Supabase 전용 보안 가드레일을 통해 해킹 및 타인의 데이터 무단 조회를 완전 방지합니다.
*   **기본 비공개 정책 (Private)**: `drivers`, `daily_lucky_cards`, `tax_refunds` 등 민감한 개인 정보 및 정산 데이터는 `auth.uid() = driver_id` 정책을 걸어 본인 외에는 조회/수정이 불가능하도록 완전 격리(Zero-Leak)했습니다.
*   **제한적 공유 정책 (Public Read, Owner Write)**: `plaza_posts`, `revenue_leaderboards`는 인증된 사용자(`auth.role() = 'authenticated'`)에 대해 전체 조회는 허용하되, 생성/수정/삭제 권한은 본인 소유의 레코드(`auth.uid() = driver_id`)로만 철저히 바인딩했습니다.

---

### 👉 후속 단계
구축된 **[database_schema.sql](file:///d:/000_UNSU/database_schema.sql)**은 Supabase 대시보드의 `SQL Editor`에 그대로 붙여넣어 실행 시 즉시 적용됩니다. 

DB 설계가 고정됨에 따라, 백엔드와 프론트엔드가 상호 참조할 수 있는 TypeScript 공통 데이터 인터페이스(Types)를 안전하게 생성하고 Mock API 바인딩 작업을 연달아 전개할 수 있게 되었습니다!
