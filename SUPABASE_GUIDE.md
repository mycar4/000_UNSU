# 🛠️ Supabase 프로덕션 데이터베이스 구축 및 RLS 보안 설정 가이드

본 문서는 UNSU 플랫폼 백엔드(Express)와 프론트엔드가 실제 클라우드 환경(Supabase PostgreSQL)에 안전하게 연결되고, Row Level Security(RLS) 보안 정책에 따라 동작하도록 설정하는 가이드라인입니다.

---

## 1. 데이터베이스 스키마 및 초기 테이블 구축

Supabase 클라우드 인스턴스에 접속하여 데이터베이스 스키마와 인덱스를 구축합니다.

### ① SQL Editor 실행
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인하고 프로젝트를 선택합니다.
2. 좌측 메뉴에서 **SQL Editor**로 이동한 뒤, **New query**를 생성합니다.
3. 프로젝트 루트에 위치한 [database_schema.sql](file:///c:/000_UNSU/database_schema.sql) 파일의 전체 내용을 복사하여 붙여넣습니다.
4. **Run** 버튼을 클릭하여 스키마 생성을 실행합니다.

---

## 2. Row Level Security (RLS) 및 보안 정책 설정

UNSU 플랫폼은 기사들의 민감정보(주민등록번호/홈택스 식별키 등) 및 사생활 데이터를 다루므로 강력한 RLS 규칙을 가동합니다.

### ① RLS 강제 활성화 (SQL 실행 완료 시 자동 적용됨)
데이터 무단 읽기 및 쓰기를 원천 차단하기 위해 아래 테이블들에 RLS를 활성화합니다.
```sql
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_lucky_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommended_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_refunds ENABLE ROW LEVEL SECURITY;
```

### ② RLS 접근 정책 (Policies) 개요
* **기사 프로필 및 운행 관련 데이터 (소유주 전용)**: 
  * `drivers`, `daily_lucky_cards`, `recommended_courses`, `financial_records`, `tax_refunds` 테이블은 JWT 토큰의 `sub`(기사 고유 식별자)와 테이블의 레코드가 일치하는 경우에만 조회/수정이 허용됩니다.
* **공유형 데이터 (인증된 전체 사용자 읽기 전용)**:
  * `revenue_leaderboards` (매출 리더보드) 및 `plaza_posts` (로드보더 광장 글) 등은 가입된 모든 기사가 열람할 수 있도록 `SELECT USING (true)` 또는 인증 세션 검증 형태의 읽기 정책을 부여합니다.
* **감사 추적 (Audit Trail)**:
  * 백오피스에서 관리자의 계정 정보 변경이나 기사의 정보 수정을 모니터링할 때 RLS를 통해 무단 로그 변조가 방지됩니다.

---

## 3. 백엔드 API 연동을 위한 Connection String 설정

API 서버가 Supabase에 연결하여 LangGraph `PostgresSaver` 및 비즈니스 데이터 처리를 수행할 수 있도록 연결 주소를 설정합니다.

### ① Connection URI 획득
1. Supabase Dashboard 우측 상단의 **Settings** (톱니바퀴 아이콘) -> **Database**로 이동합니다.
2. **Connection string** 섹션에서 **URI** 탭을 선택합니다.
3. 표시되는 PostgreSQL 연결 주소 형식을 복사합니다:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
   ```
   *(비밀번호 부분에는 프로젝트 생성 시 설정한 DB 비밀번호를 대입해야 합니다.)*

### ② 환경변수 설정
API 서버(또는 로컬 개발 환경)의 `.env` 파일(혹은 프로덕션 서버 환경변수 설정)에 아래와 같이 등록합니다.

```env
# Supabase PostgreSQL Database URL
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

> [!CAUTION]
> AWS 인프라 환경이나 Supabase Pooler 구조에 따라 연결 시 SSL 핸드셰이크 오류가 발생할 수 있습니다. 백엔드 클라이언트(`pg`)의 연결 풀 설정 시 `ssl: { rejectUnauthorized: false }` 설정이 인라인 되어 있는지 확인하십시오. (현재 UNSU 플랫폼 백엔드 코드에는 해당 안전망이 기본 탑재되어 있습니다.)

### ④ 데이터베이스 접속 결함 감쇄 가드레일 (PostgresSaver Auto Fallback)
* 백엔드 API 기동 또는 워크플로우 인보크 시, `DATABASE_URL`에 명시된 호스트의 가용성 검증을 먼저 진행합니다.
* 연결이 유효하면 `PostgresSaver`를 인스턴스화하고, 데이터베이스 내에 LangGraph 상태 저장을 위한 시스템 뷰와 테이블을 자동 준비(`setup()`)합니다.
* 만약 Supabase 서버 점검, 네트워크 단선, DNS 오류(`getaddrinfo ENOTFOUND`) 등으로 DB 접속이 차단될 경우, 프로그램 오류로 비즈니스가 마비되지 않도록 콘솔 경고와 함께 메모리 기반 저장소(`MemorySaver`)로 자동 안전 강등(Safe Downgrade) 처리됩니다.
