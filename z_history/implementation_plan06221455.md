# [Goal] FO 모바일 뷰어 레이아웃 고정 및 메인바디 폰트 크기 불일치 해결

사용자가 지적한 PC/모바일 노출 크기 문제(PC 브라우저에서 상단바, 하단바, 챗봇 버튼 등이 어색하게 노출되는 문제)와 메인바디 영역의 글씨 크기가 들쑥날쑥하여 가독성이 떨어지는 문제를 해결합니다.

## User Review Required

> [!IMPORTANT]
> **주요 레이아웃 및 폰트 변경 사항 승인 요청**
> 1. **PC 내 모바일 뷰어(Fixed 영역) 정렬**: `fixed` 속성이 들어간 상단바(`TopAppBar`), 하단바(`BottomNavBar`), AI 챗봇 버튼 및 모달이 PC 전체 뷰포트에 쏠리지 않고 모바일 컨테이너(`max-w-md`)의 중앙 정렬 영역에 정확히 일치하도록 `left-1/2 -translate-x-1/2` 스타일을 적용합니다.
> 2. **미디어 쿼리(sm, md) 접두사 전면 제거**: FO(프론트오피스) 화면은 PC 브라우저에서도 `max-w-md` 내부의 모바일 프레임으로 제한되므로, 브라우저 가로 폭이 넓어질 때 `sm:` 이나 `md:` 클래스가 작동하여 억지로 2열 배치되거나 폰트 크기가 불규칙하게 작아지는 현상을 방지하기 위해 중단점 접두사를 제거합니다.
> 3. **본문 폰트 가독성 통일**: `DESIGN.md` 가이드에 명시된 시니어 전용 본문 크기인 `text-body-lg` (1.25rem = 20px)를 기준으로, 본문 텍스트들을 일관성 있게 키우고 대비를 강화합니다.

## Proposed Changes

### 1. 프론트오피스 레이아웃 컴포넌트 수정 (PC 브라우저 내 중앙 정렬 완벽 적용)

#### [MODIFY] [AppLayout.tsx](file:///c:/000_UNSU/fo/src/components/layout/AppLayout.tsx)
* floating 챗봇 버튼 컨테이너가 PC 브라우저에서도 모바일 프레임 오른쪽 하단에 고정되도록 `fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md ...`로 위치를 한정합니다.
* 챗봇 모달이 팝업될 때 뷰포트 기준 반응형 클래스(`md:rounded-3xl`, `md:pb-4` 등)를 걷어내고 항상 고급스러운 라운딩 모바일 모달로 고정합니다.

#### [MODIFY] [TopAppBar.tsx](file:///c:/000_UNSU/fo/src/components/layout/TopAppBar.tsx)
* 상단바 헤더가 PC 브라우저에서 모바일 프레임 영역 상단에 정확히 오도록 `fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md`로 레이아웃을 고정합니다.
* 상단 로고("운수대통")와 서브라벨("AI PLATFORM")의 폰트 및 정렬을 모바일/PC 모두에서 미려하게 보정합니다.

#### [MODIFY] [BottomNavBar.tsx](file:///c:/000_UNSU/fo/src/components/layout/BottomNavBar.tsx)
* 하단 네비게이션 바가 화면 하단 중앙의 모바일 프레임 영역에 정확히 오도록 `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md`로 레이아웃을 고정합니다.

---

### 2. FO 페이지 내 폰트 일관성 확보 및 미디어 쿼리(sm:, md:) 제거

#### [MODIFY] [GillogPage.tsx](file:///c:/000_UNSU/fo/src/pages/GillogPage.tsx)
* `sm:flex-row`, `sm:items-center`, `sm:grid-cols-2` 등의 미디어 쿼리를 모두 일반 모바일 클래스로 전환하여 1열 배치를 보장합니다.
* 들쑥날쑥한 본문 글씨를 시니어 가독성 토큰인 `text-body-lg` (20px, line-height 1.8)를 사용해 일관성 있는 크기로 확대 및 정렬합니다.

#### [MODIFY] [HomePage.tsx](file:///c:/000_UNSU/fo/src/pages/HomePage.tsx)
* `mx-auto max-w-4xl`을 제거하여 `AppLayout`의 `max-w-md` 프레임에 맞춰지게 합니다.
* `md:grid-cols-2`, `md:grid-cols-3`을 제거하여 PC 해상도에서도 모바일 프레임 크기에 맞춰 1열 세로형 카드로 일목요연하게 노출되도록 수정합니다.
* 돌발 상황 티커 텍스트와 주변 LPG 충전소 카드 내 본문 텍스트 폰트를 일관성 있게 교정합니다.

#### [MODIFY] [AutopilotPage.tsx](file:///c:/000_UNSU/fo/src/pages/AutopilotPage.tsx)
* `sm:text-5xl`이나 `sm:grid-cols-2` 같은 반응형 접두사를 제거합니다.
* 제휴 혜택 리스트 등 본문 텍스트 폰트의 크기가 불규칙하게 작아 보이지 않도록 `text-body-lg` 또는 `text-base`로 통일합니다.

#### [MODIFY] [DarksidePage.tsx](file:///c:/000_UNSU/fo/src/pages/DarksidePage.tsx)
* `sm:text-sm` 과 같은 뷰포트 반응형 클래스를 제거하고 단일 모바일 폰트 클래스로 통일합니다.

---

## Verification Plan

### Automated Tests
* 코드 수정 후 `npm run build`를 실행하여 컴파일 및 타입 상의 빌드 오류가 없는지 확인합니다.

### Manual Verification
* `npm run dev` 구동 상태에서 Chrome/Edge 개발자 도구를 열어 PC 모니터 뷰포트와 모바일 뷰포트(Responsive 가로너비 줄이기) 전환 테스트를 실행합니다.
* PC 브라우저 뷰포트(가로 > 1200px) 상태에서 상단바, 하단바, 플로팅 챗봇 버튼이 가로 가운데의 모바일 프레임 내에 완벽하게 일치하는지 확인합니다.
* 메인바디의 글씨 크기가 기사님들이 보기 편하도록 20px 수준으로 일정하게 유지되고, 억지로 2열 정렬되어 텍스트가 찌그러지는 현상이 해결되었는지 확인합니다.
