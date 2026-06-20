# [Plan] PII 암호화, 감사 로그 및 피드백 보완 구현 계획

사용자 검토 및 보안 감사 요구사항에 따라 개인식별정보(PII)의 강력한 암호화(AES-256-GCM), 백오피스 관리자 권한 및 이력 추적(Audit Log), 네트워크 오류 시 Fallback 대응, 카메라/폴더 멀티 선택 개선 및 기획적 질문에 대한 설계를 포함하는 통합 개발 계획입니다.

## 1. 사용자 검토 피드백 조치 방안 (Q&A)

### ① PII 암호화 규격 준수 여부
> [!IMPORTANT]
> **단순 마스킹뿐만 아니라 데이터베이스 저장 시점의 암호화는 필수입니다.**
*   **조치**: `api/src/utils/crypto.ts`를 신규 구축하여 **AES-256-GCM** 대칭키 암호화/복호화 모듈을 구현했습니다.
*   기사의 `hometax_id` 정보는 DB 저장(`drivers` 테이블) 시점에 즉시 암호화 처리되며, 인증 및 조회 필요 시점에만 복호화되어 동작합니다. 화면에 노출할 때는 BO 서버 단 및 UI 단에서 평문 노출 없이 `kims***`와 같이 강제 마스킹하여 보안을 강화합니다.

### ② TMAP / 카카오내비 선택 및 개인정보 기본값 관리
*   기사 가입 시 선호하는 내비게이션 앱(`navi_preference`: `'TMAP' | 'KAKAONAVI'`)을 선택하게 하고, 이 정보를 `drivers` DB 테이블에 기사 마스터 프로필 속성으로 저장하여 개인정보로 함께 암호화 관리합니다.
*   클라이언트(`GillogPage.tsx`)에서는 해당 내비게이션 설정을 참조하여 선호하는 앱의 네이티브 딥링크 스키마(TMAP: `tmap://`, 카카오네비: `kakaonavi://`)로 연결되도록 연동합니다.

### ③ 외부 API 장애 또는 실시간 데이터 누락 시 FO 노출 방안
*   **대안**: 외부 관제 서버 장애 시 백엔드는 DB에 캐시된 핫존 데이터를 반환합니다.
*   **FO 화면 경고**: 안내글은 최대한 짤막하게 가독성을 확보하고, 네트워크 끊김 아이콘(⚠️ 와이파이 해제 형태 등)을 함께 표출하여 직관성을 높입니다. (예: `⚠️ 로컬 캐시 작동 중`)

### ⑤ 사주 카드 "최상", "상", "우수" 등급 산정 기준
*   **Gemini API의 역할**: 기본 만세력 사주 등급(합, 상생 등)의 핵심 산정 연산은 연도의 주기성과 일진에 기초하여 백엔드 DB에서 신뢰성 있게 1차 연산(Deterministic)됩니다.
*   그 이후, **Gemini API(LangGraph RAG Agent)**가 해당 사주 등급과 실시간 수집된 날씨, 교통 혼잡도 컨텍스트를 종합 분석하여 최종적으로 기사 개인 맞춤형 오디오 브리핑 스크립트 및 경로 해설 상세(Comment)를 생성하는 하이브리드 아키텍처로 작동합니다.

### ⑦ 관리자 생성 정보 저장소 및 FO 회원정보 BO 관리 이력
*   **저장소**: 관리자 계정 생성 정보는 PostgreSQL 데이터베이스(`public.admin_accounts`)에 영구 저장됩니다.
*   **회원 탈퇴 및 3일 재가입 제한 정책**:
    *   기사 탈퇴 시 `POST /api/drivers/:id/withdraw` 엔드포인트를 호출하여 기사 레코드를 DB에서 안전하게 영구 파쇄하되, 악의적인 반복 가입 차단을 위해 `public.withdrawn_drivers` 테이블에 기사의 식별값과 탈퇴 일시를 적재합니다.
    *   탈퇴 후 **3일 이내에 재가입**을 시도할 경우, 백엔드는 가입 승인을 거절하고 클라이언트에 3일 재가입 대기 안내를 띄웁니다.
    *   FO 온보딩 페이지와 탈퇴 화면에 "탈퇴 후 3일간 재가입이 불가합니다"라는 안내 문구를 명시합니다.

### ⑧ API 테스트 Swagger 메뉴 탑재
*   **API 명세 & 테스트**: 향후 API 개발 생산성을 위해 백엔드 서버에 Swagger UI(`http://localhost:3001/api-docs`) 서빙을 준비하고, 백오피스(BO) 대시보드 내의 Prompt Playground 혹은 신규 메뉴 탭을 통해 관리자가 API 통신을 브라우저상에서 바로 테스트하고 시연할 수 있도록 명세 검증용 패널을 보완합니다.

---

## 2. 세부 변경 사항 (Proposed Changes)

### [MODIFY] [db.ts](file:///d:/000_UNSU/api/src/utils/db.ts)
*   `crypto.ts`를 사용해 `saveDriverProfile` 및 `getDriverProfile` 시 `hometax_id` 필드를 암호화/복호화하여 저장하도록 수정합니다.
*   `INITIAL_DATA`에 `admin_audit_logs` 배열을 추가합니다.
*   감사 로그 작성을 위한 `saveAuditLog(adminEmail, actionType, targetIdentifier, description)` 및 `getAuditLogs()` 모듈을 추가합니다.

### [MODIFY] [server.ts](file:///d:/000_UNSU/api/src/server.ts)
*   관리자 작업(어드민 계정 생성/삭제, 어드민 로그인, 기사 프로필 수정 등)이 일어날 때 `saveAuditLog`를 호출하여 감사 추적 로그를 DB에 적재하는 API 흐름을 결합합니다.
*   `GET /api/admin/audit-logs` 감사 로그 목록 조회 엔드포인트를 구현합니다.
*   BO 관리자가 기사 프로필 수정을 요청할 수 있는 권한 검증용 `POST /api/admin/drivers/:id` 엔드포인트를 추가합니다.

### [MODIFY] [RoadboarderPage.tsx](file:///d:/000_UNSU/fo/src/pages/RoadboarderPage.tsx)
*   `<input type="file" ... capture="environment" />` 부분에서 `capture` 속성을 제거하여 카메라 촬영과 파일 폴더 선택이 모두 네이티브 시트로 출력될 수 있도록 조치합니다.

### [MODIFY] [GPanRadarPage.tsx](file:///d:/000_UNSU/fo/src/pages/GPanRadarPage.tsx)
*   `fetchHotZones` 호출 실패 시 UI에 경고 배너를 출력하고, 로컬 캐시 데이터(`localStorage` 백업 데이터)로 유연하게 복구하는 Fallback 처리 코드를 마이그레이션합니다.

---

## 3. 검증 계획 (Verification Plan)

### Automated Tests
*   `npx ts-node api/src/test_workflow.ts` 가동하여 바뀐 DB 암호화 레이어 및 RAG agent 실행 여부 검사.

### Manual Verification
*   **암호화 검증**: 기사 프로필 저장 후 `local_db.json` 또는 pgAdmin/Supabase를 통해 `hometax_id`가 해독 불가능한 암호문(`iv:authTag:ciphertext`)으로 안전하게 인코딩되어 저장되는지 육안 확인.
*   **폴더/카메라 병행 검증**: 모바일 환경에서 영수증 OCR 카메라 촬영 버튼을 눌렀을 때, 카메라만 강제 구동되지 않고 폴더 갤러리나 파일 탐색기 선택 메뉴가 병렬 노출되는지 브라우저에서 검증.
*   **감사 로그 추적 검증**: BO에서 관리자 생성 및 삭제 실행 후, 새로 신설될 감사 로그 뷰에서 변경 이력(어드민 이메일, 변경 일시, 작업 분류, 대상 식별값)이 정확히 저장 및 출력되는지 검증.
