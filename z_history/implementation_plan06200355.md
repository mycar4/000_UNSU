# [Plan] UNSU 프론트엔드 실시간 Mock API 및 인터랙티브 로직 구현 계획

구축된 `database.types.ts` 타입을 참조하여, 프론트오피스(FO)의 5대 화면이 실제 작동하는 백엔드 엔진이 연동된 것처럼 유기적이고 고도로 인터랙티브하게 작동하도록 클라이언트 사이드 엔진을 개발하는 계획입니다.

## User Review Required

> [!IMPORTANT]
> **모의(Mock) 수준을 넘어선 인터랙션 구현**
> *   단순히 멈춰있는 데이터 대신, 사용자가 직접 정보를 입력하고 온보딩하면 **이후 모든 화면의 데이터가 동적으로 개인 맞춤화**되는 데이터 흐름을 구현합니다.
> *   예: 온보딩 생년월일 기준의 사주 일진 연산, 영수증 사진 업로드 시 OCR 감지 연출 및 리더보드 즉시 등극, 실제 브라우저 TTS 스피커 송출 등을 통해 완벽한 기능 사양을 증명합니다.

---

## Proposed Changes

### [MODIFY] [OnboardingPage.tsx](file:///d:/000_UNSU/fo/src/pages/OnboardingPage.tsx)
*   프로필 설정 성공 시, 기사 마스터 정보를 `localStorage`에 `driverProfile` 키로 안전하게 암호화 적재.

### [MODIFY] [GillogPage.tsx](file:///d:/000_UNSU/fo/src/pages/GillogPage.tsx)
*   **사주 맞춤형 연동**: 온보딩된 생년월일을 가져와 간단한 정적 일진 연산을 구동하고, 해당 간지(예: 을축, 갑자 등)에 따른 행운 코멘트를 동적으로 띄웁니다.
*   온보딩 데이터가 없을 경우 "마스터 프로필 설정이 필요합니다" 배너와 함께 온보딩 이동 링크 제공.

### [MODIFY] [GPanRadarPage.tsx](file:///d:/d:/000_UNSU/fo/src/pages/GPanRadarPage.tsx)
*   **실제 TTS 가동**: `ON AIR` 버튼 클릭 시, 브라우저의 `SpeechSynthesis` API를 실제로 트리거하여 화면에 출력된 추천 경로 및 교통 관제 텍스트를 차분하고 안정적인 한국어 기사 음성으로 송출합니다.

### [MODIFY] [RoadboarderPage.tsx](file:///d:/000_UNSU/fo/src/pages/RoadboarderPage.tsx)
*   **영수증 OCR 시뮬레이션**: 파일 업로드 인풋(`type="file"`)을 장착하여 기사가 영수증 사진을 선택하면 1.5초간 "OCR 판독 중" 모달이 표시된 뒤, 인식된 매출액과 기사 이름이 상단 **오늘의 탑 보더** 리더보드에 동적으로 등록(1위로 등극 연출)되는 극적 인터랙션 가동.

### [MODIFY] [AutopilotPage.tsx](file:///d:/000_UNSU/fo/src/pages/AutopilotPage.tsx)
*   **개인택시 정산 시뮬레이터**: "1초 만에 자동 정산하기" 클릭 시 로딩 스피너 연출 및 온보딩된 기사 타입(일반/간이)에 맞추어 `Estimated Refund Amount`가 100% 정밀하게 연산되어 표시되도록 적용.

---

## Verification Plan

### Manual Verification
*   **온보딩 테스트**: 온보딩 페이지에서 생일을 입력한 뒤 완료 시 메인 Gillog의 사주 멘트가 개인에 맞춰 동적으로 바뀌는지 검증.
*   **G-PAN 오디오**: ON AIR 클릭 시 실제 PC/모바일 스피커에서 한국어 관제 TTS 낭독이 흘러나오는지 검청.
*   **영수증 OCR**: 영수증 업로드 시 리더보드 리스트가 갱신되며 1위로 실시간 추가되는지 확인.
