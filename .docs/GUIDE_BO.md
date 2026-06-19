# BO (Back Office) 개발 가이드

> **목적:** SmartShopper AI 운영 관리자용 백오피스 애플리케이션의 아키텍처, 페이지 구조, API 연동 패턴을 정의합니다.  
> BO는 내부 운영 도구이므로 FO와 디자인 수준 및 보안 수준이 구분됩니다.

---

## 1. 기술 스택

| 항목 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | React | 19+ |
| 타입 시스템 | TypeScript | 5+ |
| CSS | DESIGN.md 토큰 기반 (FO와 동일 디자인 시스템 공유) | - |
| API 통신 | 내부 API (`api/` 서버) 연동 | REST + SSE |

---

## 2. 디렉토리 구조 규칙

```
bo/
├── src/
│   ├── pages/
│   │   ├── PromptPlayground.tsx    # LLM 프롬프트 테스트 룸
│   │   ├── ScrapingControl.tsx     # 스크래핑 상태 관제
│   │   └── VectorCapacity.tsx      # 벡터 DB 용량 모니터링
│   ├── components/                  # BO 전용 공통 컴포넌트
│   └── App.tsx                      # BO 라우터 + 레이아웃
└── package.json
```

### 디렉토리 규칙

| 디렉토리 | 역할 | 비고 |
|---|---|---|
| `pages/` | 관리 기능별 1개 페이지 | 각 페이지는 독립된 관리 도메인 |
| `components/` | BO 전용 재사용 컴포넌트 | FO의 `components/ui/` 와는 별도 관리 |

---

## 3. 페이지별 기능 명세

### 3-1. 프롬프트 테스트 룸 (PromptPlayground)

**목적:** 추천 리포트 생성에 사용되는 LLM 프롬프트 템플릿을 실시간으로 테스트하고 개선합니다.

#### 구현 시 필수 기능

```
┌─────────────────────────────────────┐
│  프롬프트 템플릿 에디터              │
│  ┌─────────────────────────────┐    │
│  │ 시스템 프롬프트 (textarea)    │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 사용자 쿼리 입력              │    │
│  └─────────────────────────────┘    │
│  [테스트 실행] [초기화]             │
│                                     │
│  ── 결과 영역 ──                   │
│  - 토큰 수 표시                     │
│  - 응답 시간(ms) 표시               │
│  - LLM 응답 원문 (마크다운 렌더링)  │
│  - JSON 파싱 결과 (상품 추출 결과)  │
└─────────────────────────────────────┘
```

| 기능 | API 연동 | 비고 |
|---|---|---|
| 프롬프트 테스트 | `POST /api/admin/prompt/test` | 관리자 전용 엔드포인트 신규 필요 |
| 프롬프트 저장 | `PUT /api/admin/prompt/template` | 현재 활성 프롬프트 템플릿 갱신 |
| 히스토리 조회 | `GET /api/admin/prompt/history` | 과거 테스트 결과 비교용 |

### 3-2. 스크래핑 상태 관제 (ScrapingControl)

**목적:** 실시간으로 DuckDuckGo 웹 검색 및 외부 쇼핑몰 크롤링의 동작 상태를 모니터링하고 제어합니다.

#### 구현 시 필수 기능

| 기능 | 설명 |
|---|---|
| 실시간 상태 대시보드 | 최근 N건의 검색 요청/성공/실패 비율 표시 |
| 크롤링 로그 뷰어 | 각 검색 요청별 DuckDuckGo 호출 결과, LLM 추출 결과 로그 |
| 수동 테스트 | 관리자가 쿼리를 입력하면 scrapeNode만 단독 실행하여 결과 확인 |
| 쇼핑몰별 상태 | 네이버쇼핑, 쿠팡, 다나와 각 도메인별 응답률/차단률 |
| 알림 설정 | 연속 N회 실패 시 관리자에게 알림 |

### 3-3. 벡터 DB 용량 모니터링 (VectorCapacity)

**목적:** 벡터 임베딩 저장소의 용량, 인덱스 상태, 검색 성능 지표를 모니터링합니다.

#### 구현 시 필수 기능

| 기능 | 설명 |
|---|---|
| 저장 용량 | 현재 벡터 수 / 최대 용량 |
| 인덱스 상태 | 인덱스 빌드 상태, 마지막 리빌드 시각 |
| 검색 지표 | 평균 검색 latency (ms), recall@k |
| 데이터 관리 | 오래된 벡터 삭제, 수동 리인덱싱 트리거 |

---

## 4. BO 페이지 컴포넌트 표준 구조

```tsx
import React, { useState, useEffect } from 'react';

interface PageData {
  // 페이지 데이터 타입 정의
}

export const AdminPage: React.FC = () => {
  // 1. 상태 관리
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. API 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/some-endpoint');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. 로딩/에러/데이터 분기 렌더링
  if (loading) return <div className="p-8">로딩 중...</div>;
  if (error) return <div className="p-8 text-error">오류: {error}</div>;

  return (
    <div className="p-margin-desktop max-w-container-max mx-auto">
      <h1 className="font-headline-md text-headline-md text-primary mb-6">
        페이지 제목
      </h1>
      {/* 데이터 렌더링 */}
    </div>
  );
};
```

---

## 5. BO 전용 API 엔드포인트 설계 가이드

### 5-1. 라우팅 규칙

```
/api/admin/*        # BO 전용 엔드포인트 (인증 필수)
/api/recommend/*    # FO 공용 엔드포인트
```

### 5-2. 관리자 인증 (향후 적용)

```typescript
// 관리자 인증 미들웨어 (구현 예시)
function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

// 적용
server.use('/api/admin', adminAuth);
```

### 5-3. BO 전용 API 목록 (계획)

| Method | 경로 | 기능 | 우선순위 |
|---|---|---|---|
| `POST` | `/api/admin/prompt/test` | 프롬프트 단독 테스트 실행 | 높음 |
| `PUT` | `/api/admin/prompt/template` | 활성 프롬프트 템플릿 교체 | 높음 |
| `GET` | `/api/admin/scraping/status` | 최근 크롤링 실행 상태 | 높음 |
| `POST` | `/api/admin/scraping/test` | 수동 크롤링 테스트 | 보통 |
| `GET` | `/api/admin/vector/stats` | 벡터 DB 통계 조회 | 보통 |
| `POST` | `/api/admin/vector/reindex` | 벡터 인덱스 리빌드 트리거 | 낮음 |

---

## 6. FO vs BO 차이점 요약

| 항목 | FO (Front Office) | BO (Back Office) |
|---|---|---|
| 대상 사용자 | 일반 소비자 | 내부 운영 관리자 |
| 디자인 수준 | DESIGN.md 100% 준수 (프리미엄 UX) | 기능 중심 실용적 UI |
| 보안 수준 | DOMPurify, Referrer 차단, URL 검증 | 관리자 인증 + 내부 네트워크 |
| API 접근 | `/api/recommend/*` (공개) | `/api/admin/*` (인증 필요) |
| SSE 사용 | ✅ 실시간 스트리밍 | ❌ REST 기반 (결과 일괄 반환) |
| 빌드 배포 | Vite + CDN | 내부 서버 (별도 포트 또는 서브패스) |

---

## 7. BO 개발 시 보안 고려사항

### 7-1. 관리자 전용 엔드포인트 보호

```typescript
// ❌ 위험: 인증 없이 관리 기능 노출
server.get('/api/admin/scraping/status', ...);

// ✅ 안전: 인증 미들웨어 적용
server.get('/api/admin/scraping/status', adminAuth, ...);
```

### 7-2. 프롬프트 인젝션 방지

프롬프트 테스트 룸에서 관리자가 입력하는 프롬프트도 Zod 검증을 적용합니다:

```typescript
const AdminPromptSchema = z.object({
  systemPrompt: z.string().max(10000),
  userQuery: z.string().min(1).max(500),
  model: z.enum(['gpt-4o-mini', 'gemini-2.5-flash']),
});
```

### 7-3. 로그 데이터 마스킹

BO 로그 뷰어에서 API 키나 민감 정보가 노출되지 않도록 마스킹 처리합니다:

```typescript
function maskSensitiveData(log: string): string {
  return log
    .replace(/Bearer\s+\S+/g, 'Bearer ***MASKED***')
    .replace(/key=\S+/g, 'key=***MASKED***');
}
```

---

## 8. 실행

```bash
# BO 개발 서버 (별도 포트)
# BO는 현재 독립 빌드 설정이 없으므로, FO와 통합하거나 별도 Vite 설정 필요
cd bo
npm install
npm run dev        # → 별도 포트에서 실행
```

> [!NOTE]
> 현재 BO는 초기 스캐폴딩 단계입니다.  
> 페이지 컴포넌트의 뼈대만 존재하며, 실제 API 연동과 UI 구현은 추후 진행됩니다.  
> FO의 Vite 설정과 디자인 시스템을 공유할지, 완전히 분리할지는 프로젝트 규모에 따라 결정합니다.

---

## 9. Supabase 백오피스 데이터 연동 표준 (Admin DB)

백오피스는 어드민 정책 관리와 모니터링 로그를 위해 Supabase 데이터베이스와 긴밀하게 데이터를 주고받아야 합니다. 아래는 어드민용 API 연동 및 테이블 핸들링 패턴 정의입니다.

### 9-1. 관리용 Supabase 테이블 스키마 설계 기준
백오피스 관제 및 영속성을 위해 Supabase DB에 아래 3개 테이블이 생성 및 사용됩니다.
1. **`prompts`**: LLM 시스템 프롬프트 이력 및 활성 상태 관리
2. **`scraping_logs`**: 크롤러 실행 속도, 성공 여부, 차단 여부 로그
3. **`admin_settings`**: 쇼핑 에이전트의 전체 동작 정책 밸류 저장

### 9-2. 어드민용 DB 쿼리 패턴 (Express API 레벨)
백엔드 API 서버(`api/src/server.ts`) 내에서 Supabase SDK 또는 Connection Pool을 사용하여 데이터를 관리합니다.

```typescript
// 예시: 활성 프롬프트 템플릿 변경 API
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

server.put('/api/admin/prompt/template', adminAuth, async (req, res) => {
  const { systemPrompt, updatedBy } = req.body;
  
  const query = `
    INSERT INTO prompts (template_text, updated_by, is_active, created_at)
    VALUES ($1, $2, true, NOW())
    RETURNING id;
  `;
  
  try {
    // 1. 이전 활성 프롬프트 비활성화
    await pool.query("UPDATE prompts SET is_active = false WHERE is_active = true");
    // 2. 신규 프롬프트 활성 상태 등록
    const result = await pool.query(query, [systemPrompt, updatedBy]);
    
    res.json({ success: true, promptId: result.rows[0].id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### 9-3. 실시간 관제 연동 패턴 (프론트엔드 - REST + SSE)
관제 페이지(`ScrapingControl.tsx`) 등에서 최근 크롤러 성공/차단률을 모니터링할 때, 주기적 폴링(Polling) 혹은 Supabase의 **Realtime Subscription** 기능을 활용합니다.

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // FO/BO 공용 supabaseClient 참조

export function useScrapingRealtimeLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // 1. 초기 20개 최근 로그 조회
    supabase
      .from('scraping_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setLogs(data); });

    // 2. 신규 로그 생성 실시간 구독 리스너 등록
    const subscription = supabase
      .channel('realtime_scraping_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scraping_logs' }, (payload) => {
        setLogs(prev => [payload.new, ...prev.slice(0, 19)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return logs;
}
```

### 9-4. BO DB 관리 보안 규칙
1. **Row Level Security (RLS) 활성화**: Supabase DB 콘솔에서 모든 관리자용 테이블에 RLS를 활성화하고, 관리자 이메일 도메인(`@company.com`)을 가진 유저만 읽기/쓰기가 가능하도록 보안 정책을 지정합니다.
2. **이력 보존(Audit Trail)**: 프롬프트 템플릿 변경이나 시스템 제어 정책 변경 등의 모든 쓰기(`INSERT`, `UPDATE`) 작업은 반드시 수정한 관리자의 식별값(`updated_by`)과 시간을 테이블에 영구 보관합니다.
