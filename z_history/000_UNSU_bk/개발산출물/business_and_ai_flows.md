# 📊 운수대통 플랫폼 비즈니스 및 핵심 AI 로직 시퀀스 다이어그램 (Mermaid)

본 문서는 운수대통(UNSU) 플랫폼의 PT 발표용 다이어그램 정보를 포함하고 있습니다. 시스템 컴포넌트 간의 데이터 흐름과 호출 순서를 직관적으로 보여주는 **순차 다이어그램(Sequence Diagram)** 형태로 통일하여 구성했습니다.

---

## 1. 🔄 전체 서비스 아키텍처 & 비즈니스 연동 흐름
사용자(기사님)의 요청에서 시작해 백엔드 API, 외부 연동계, 그리고 AI 분석 엔진이 실시간으로 조화를 이루며 길안내 앱으로 이어지는 전체 시퀀스 다이어그램입니다.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as 기사님 (User)
    participant FO as 프론트엔드 (React Web)
    participant BO as 백엔드 API (Express)
    participant DB as 데이터베이스 (PostgreSQL)
    participant Ext as 외부 API (날씨/교통)
    participant AI as AI 엔진 (LangGraph/Gemini/명리)
    actor Navi as 내비게이션 앱 (TMap / 카카오)

    Driver->>FO: 오늘의 루틴 화면 진입
    FO->>BO: 루틴 데이터 요청 (GET /api/routine/:driverId)
    BO->>DB: 기사 프로필 조회 (생년월일, 주소, 선호앱)
    DB-->>BO: 프로필 데이터 반환 (birthDate, naviPreference 등)
    
    BO->>Ext: 실시간 위치 기반 날씨 및 교통 정보 요청
    Ext-->>BO: 날씨 수치 및 도로 정체 정보 반환
    
    BO->>AI: AI 분석 및 힐링 추천 생성 요청
    Note over AI: 1. 명리학 만세력 계산 (사주 오행 점수 도출)<br/>2. LangGraph 실시간 RAG 구동 (혼잡구역 회피)<br/>3. Gemini 1.5 Flash 통합 코멘트 조율
    AI-->>BO: 최종 사주 힐링코멘트 및 추천 코스 데이터 반환
    
    BO-->>FO: 브리핑 데이터 응답 (200 OK)
    Note over FO: 오늘의 운세 카드 및<br/>지도 위에 추천 코스 렌더링
    
    Driver->>FO: "추천 경로 전송" 버튼 클릭
    FO->>FO: openNavigationApp(선호앱, 좌표) 실행
    FO->>Navi: 딥링크(Intent URL) 호출 및 앱 자동 실행
    Navi-->>Driver: 목적지 경로 안내 시작
```

---

## 2. 🧠 LangGraph 에이전트 핵심 AI 파이프라인 흐름
웹에서 실시간으로 환경 요소를 파싱하여 최적의 영업 핫존을 정제해나가는 AI 파이프라인의 실시간 데이터 처리 시퀀스 다이어그램입니다.

```mermaid
sequenceDiagram
    autonumber
    participant BO as 백엔드 서버
    participant Graph as LangGraph Workflow
    participant Scrape as scrapeNode (수집)
    participant Vector as vectorizeNode (임베딩)
    participant Retrieve as retrieverNode (검색)
    participant Sum as summarizerNode (요약)
    participant Saver as PostgresSaver (DB)

    BO->>Graph: app.invoke(초기 상태)
    Graph->>Saver: 이전 세션의 스레드 상태 조회
    Saver-->>Graph: 기존 에이전트 상태 복구
    
    Graph->>Scrape: 1단계: 수집 시작
    Note over Scrape: 외부 뉴스, 행사, 교통 API 크롤링
    Scrape-->>Graph: 수집 완료 (State에 데이터 적재)
    
    alt 수집 실패 (에러 발생 시 비용 차단)
        Graph-->>BO: early stop 반환 (Error State)
    else 수집 성공
        Graph->>Vector: 2단계: 임베딩 처리
        Note over Vector: 비정형 데이터 벡터 데이터베이스로 변환
        Vector-->>Graph: 임베딩 완료
    end
    
    alt 임베딩 실패 (비용 차단)
        Graph-->>BO: early stop 반환 (Error State)
    else 임베딩 성공
        Graph->>Retrieve: 3단계: 검색(Retrieve)
        Note over Retrieve: 기사님의 현재 위치와 어울리는 맥락 필터링
        Retrieve-->>Graph: 검색 정보 반환
    end
    
    Graph->>Sum: 4단계: 요약(Summarize)
    Note over Sum: 최종 오디오 스크립트 작성 및 핫존 도출
    Sum-->>Graph: 최종 요약 완료
    
    Graph->>Saver: 최종 에이전트 상태 기록
    Graph-->>BO: 최종 분석 결과값 반환
```

---

## 3. 🔒 회원탈퇴 및 재가입 제한 보안 흐름
정산 혜택만 받고 탈퇴하는 기적의 체리피커 기사를 감지하고, 개인정보(홈택스 ID) 유출 리스크를 방어하는 보안 흐름 시퀀스 다이어그램입니다.

```mermaid
sequenceDiagram
    autonumber
    actor Driver as 기사님
    participant FO as 프론트엔드 (React)
    participant BO as 백엔드 API
    participant Crypto as 단방향 암호화 모듈
    participant DB as 데이터베이스 (Drivers 테이블)
    participant Withdraw as 재가입 차단 목록 (withdrawn_drivers)

    Note over Driver, Withdraw: 1. 회원탈퇴 프로세스 (개인정보 암호화 및 보관)
    Driver->>FO: 탈퇴 버튼 클릭
    FO->>BO: 탈퇴 요청 (driverId)
    BO->>DB: 드라이버 프로필 조회 (HomeTax ID 획득)
    BO->>Crypto: HomeTax ID 전달
    Crypto-->>BO: SHA-256 해시 데이터 반환 (hometax_hash)
    BO->>Withdraw: hash 기록 및 탈퇴 시간 기록
    BO->>DB: 드라이버 고유 프로필 삭제 (Cascade 처리)
    BO-->>Driver: 탈퇴 완료 알림

    Note over Driver, Withdraw: 2. 3일 내 재가입 시도 차단 프로세스 (어뷰징 방어)
    Driver->>FO: 프로필 설정 및 가입 시도 (HomeTax ID 입력)
    FO->>BO: 가입 요청 (HomeTax ID 발송)
    BO->>Crypto: 가입 시도 HomeTax ID 전달
    Crypto-->>BO: SHA-256 해시 데이터 반환
    BO->>Withdraw: 동일 해시값 존재 및 3일 경과 여부 확인
    alt 3일 이내인 경우 (가입 차단)
        Withdraw-->>BO: 차단 대상 정보 반환 (탈퇴 일시 포함)
        BO-->>FO: 에러 응답 (403 Forbidden: 가입 차단 안내)
        FO-->>Driver: "탈퇴 후 3일간 재가입이 제한됩니다. OO시 이후 가입 가능합니다"
    else 3일 초과 혹은 신규 가입 (가입 허용)
        Withdraw-->>BO: 기록 없음 또는 기간 만료
        BO->>DB: 신규 프로필 생성 (HomeTax ID 암호화 보관)
        BO-->>Driver: 가입 완료 및 대시보드 진입 허용
    end
```
