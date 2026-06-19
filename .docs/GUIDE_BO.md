# UNSU Platform BO (Back Office) 개발 가이드

> **목적:** UNSU 플랫폼 본사 운영자 및 파트너 제휴사를 위한 백오피스 애플리케이션의 아키텍처, 도메인 구조, API 연동 및 보안 정책을 정의합니다.

---

## 1. 기술 스택

| 항목 | 기술 | 비고 |
|---|---|---|
| 프레임워크 | React 19+ | - |
| 타입 시스템 | TypeScript 5+ | - |
| CSS | TailwindCSS v4 | FO와 동일한 DESIGN.md 토큰을 공유하되, 실용적 레이아웃으로 적용 |
| API 통신 | 내부망/인증 기반 REST API | SSE 스트리밍은 최소화하고 안정적인 REST 응답 선호 |

---

## 2. 폴더 구조 및 메뉴 규칙

BO는 기능 단위(Domain-Driven)로 페이지를 분리하여 운영의 독립성을 확보합니다.

```
bo/
├── src/
│   ├── components/                  # BO 전용 관리자 컴포넌트 (데이터 테이블, 차트, 사이드바)
│   ├── pages/
│   │   ├── TaxAutopilotMonitor.tsx  # 세무/수수료 대행 정산 관제 (기사 수익 현황)
│   │   ├── PartnerSettlement.tsx    # B2B 제휴 스토어(정비, 타이어) 정산 현황
│   │   └── GPanStatusDashboard.tsx  # 돌발 트래픽/기상청 핫존 알고리즘 가동 모니터링
│   ├── App.tsx                      # 사이드바 레이아웃 및 라우팅
│   └── index.css                    # Tailwind v4 진입점
```

---

## 3. 핵심 관리 도메인 명세

### 3-1. Tax Autopilot 정산 관제 (TaxAutopilotMonitor)
**목적:** 기사들의 국세청 홈택스 세무 신고 및 부가세 환급 대행 현황, 여신금융협회 카드 매출 집계 상태를 모니터링합니다.
*   **주요 기능**:
    *   기사별 일/월별 매출 및 매입 지출 추이 차트 조회.
    *   CODEF/쿠콘 핀테크 API 연동 에러율 모니터링 및 수동 재시도 트리거.
    *   플랫폼 이용 수수료 징수 현황 대시보드.

### 3-2. 제휴 스토어 정산 (PartnerSettlement)
**목적:** 차량 정비 인프라, 타이어 유통 네트워크 등 B2B 파트너들과의 실속 제휴 커머스 브릿지 정산.
*   **주요 기능**:
    *   제휴 파트너별 인바운드 트래픽 및 전환율 통계.
    *   월별 정산금 집계 및 엑셀(CSV) 다운로드 기능.

### 3-3. G-PAN 알고리즘 상태 모니터링 (GPanStatusDashboard)
**목적:** 실시간 기상청/돌발 트래픽/지하철 파싱 데이터의 비동기 수집 파이프라인의 건강성(Health Check) 확인.
*   **주요 기능**:
    *   Open API Rate Limit 초과 여부 관제.
    *   핫존(대박 구역) 추정 알고리즘의 예측 정확도(실제 주행 궤적 대비) 사후 분석 지표.

---

## 4. Supabase Admin 연동 및 DB 보안 표준

백오피스는 어드민 정책 관리와 모니터링 로그를 위해 Supabase 데이터베이스와 긴밀하게 연동됩니다. (주로 Node.js API를 경유함)

### 4-1. 관리자 인증 및 RLS (Row Level Security)
1.  **RLS 활성화**: Supabase DB 콘솔에서 모든 관리자용 테이블에 RLS를 적용합니다.
2.  **도메인 제한**: `@unsu-platform.com` 등 본사 이메일 도메인을 가진 관리자(Admin Role)만이 읽기/쓰기를 수행할 수 있도록 정책을 설정합니다.

### 4-2. 이력 보존 (Audit Trail)
*   **불변 로깅**: 정산 승인, 요율 변경, 알고리즘 가중치 변경 등의 모든 쓰기 작업(INSERT, UPDATE)은 반드시 행위자의 `admin_id`와 `action_time`을 타임스탬프와 함께 로깅용 테이블(`admin_audit_logs`)에 남겨야 합니다.

### 4-3. 관리자 전용 API 보안 (Express)
BO에서 호출하는 모든 API는 `x-admin-token` 혹은 Supabase Session JWT 검증 미들웨어를 거쳐야 합니다.

```typescript
// ❌ 위험: 인증 없이 관리 기능 노출
server.post('/api/admin/tax/re-calculate', ...);

// ✅ 안전: 인증 미들웨어 적용
server.post('/api/admin/tax/re-calculate', adminAuthMiddleware, ...);
```

---

## 5. UI/UX 구현 규칙

*   **가독성**: FO와 마찬가지로 타이포그래피 토큰을 적극 활용하지만, 많은 양의 데이터를 한 화면에 보여주기 위해 폰트 크기 증량보다는 **여백(Spacing)과 데이터 테이블(Grid)**의 명확한 구분에 집중합니다.
*   **안전 장치**: 정산금 지급, 알고리즘 중지 등 파괴적인 액션(Destructive Action) 전에는 반드시 모달창을 통한 2차 확인 프롬프트를 요구합니다.
