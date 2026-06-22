# [Goal] DESIGN.md 기반 FO & BO UI 프리미엄 고도화

현재 애플리케이션의 UI를 `DESIGN.md`에 명시된 **"Warm Editorial Modern with Gold Accents"** 테마로 전면 업그레이드합니다. 

현재 구조를 분석해 본 결과:
- **FO (프론트오피스)**: `max-w-2xl mx-auto` 속성으로 PC 화면에서도 중앙에 모바일 크기로 고정되는 반응형(Responsive) 구조입니다. 기사님들의 사용성에 최적화되어 있으므로, 이 레이아웃(너비)을 유지하되 시각적인 디테일을 압도적으로 끌어올립니다.
- **BO (백오피스)**: 좌측 사이드바와 우측 컨텐츠 영역으로 분리된 전형적인 데스크톱 대시보드입니다. 이 역시 색상과 여백을 조정해 고급스럽게 다듬습니다.

## User Review Required

> [!IMPORTANT]
> **디자인 개편 방향성 확인**
> 아래와 같은 프리미엄 디자인 원칙을 적용하려 합니다. 진행해도 좋을지 승인해 주세요.
> 1. **시니어 가독성**: 장년층 기사님들을 위해 FO의 주요 폰트는 크게 키우고(`text-body-lg`), 화면 대비를 뚜렷하게 합니다.
> 2. **글래스모피즘 (유리 질감)**: 상/하단 네비게이션 바 및 알림창에 `backdrop-blur` 효과를 주어 배경이 은은하게 비치도록 합니다.
> 3. **골드 액센트 & 마이크로 애니메이션**: 버튼 클릭 시 쫀쫀하게 반응하는 `.tap` 모션과, 황금색 포인트(`.text-gold`)를 곳곳에 배치하여 고급감을 줍니다.
> 4. **입체적 배경**: 밋밋한 단색 배경 대신 `.grid-lines`와 은은한 그림자를 사용하여 세련된 분위기를 연출합니다.

## Proposed Changes

### 1. 프론트오피스 (FO) 레이아웃 및 스타일 개편
#### [MODIFY] [fo/src/components/layout/AppLayout.tsx](file:///c:/000_UNSU/fo/src/components/layout/AppLayout.tsx)
* `bg-background` 배경 위에 `.grid-lines` 패턴을 연하게 얹어 밋밋함을 없앱니다.
* 대통이(AI) 채팅 모달의 디자인을 최신 iOS 스타일처럼 부드러운 곡선과 글래스모피즘으로 고도화합니다.

#### [MODIFY] [fo/src/components/layout/TopAppBar.tsx](file:///c:/000_UNSU/fo/src/components/layout/TopAppBar.tsx) & [BottomNavBar.tsx](file:///c:/000_UNSU/fo/src/components/layout/BottomNavBar.tsx) (추후 수정 대상)
* 반투명 블러 효과(`backdrop-blur-md`, `bg-background/80`) 적용.
* 하단 네비게이션 바 아이콘 클릭 시 `scale`이 반응하는 애니메이션 추가.

#### [MODIFY] [fo/src/pages/GillogPage.tsx](file:///c:/000_UNSU/fo/src/pages/GillogPage.tsx) (메인 페이지 예시)
* 시니어 타겟에 맞춰 카드의 타이포그래피 여백(Padding)을 넓히고 텍스트 크기를 키웁니다.
* Gold 색상을 활용한 강조 포인트 반영.

### 2. 백오피스 (BO) 대시보드 프리미엄 개편
#### [MODIFY] [bo/src/App.tsx](file:///c:/000_UNSU/bo/src/App.tsx)
* 전체 레이아웃 배경에 `.dot-field` 또는 미세 패턴을 주입합니다.
* 좌측 사이드바 메뉴 선택 시, 일반적인 파란색이 아닌 `bg-primary text-primary-foreground` 와 고급스러운 둥글기(`rounded-xl`)를 적용합니다.
* 관리자 테이블의 선(`border`)을 최소화하고, 넓은 여백을 가진 모던한 Editorial 스타일 표로 개선합니다.

## Verification Plan

### Automated Tests
* 코드 수정 후 `npm run build`를 통해 스타일시트 및 컴포넌트 타입 에러가 없는지 검증합니다.

### Manual Verification
* `npm run dev` 구동 후, 브라우저에서 모바일 화면 비율(FO)과 데스크톱 화면 비율(BO)을 모두 띄워두고 UI 퀄리티 및 애니메이션 동작을 유저와 함께 확인합니다.
