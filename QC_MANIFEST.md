비즈니스 모델의 가치를 증명하고 실제 런칭 단계에서 기사님들께 "진짜 쓸모가 있다"는 감탄을 이끌어내기 위한 **`antigravity` 시스템 지시용 검증 명세 및 모바일 QC 가이드라인**입니다.

이 문서를 복사하여 `antigravity` 워크스페이스 내에 지시어로 주입하거나, 프로젝트 루트의 `QC_MANIFEST.md` 파일로 생성하여 AI 엔진이 스스로 소스 코드를 스캔 및 수정하도록 명령할 수 있습니다.

---

# [Manifest] UNSU 플랫폼 핵심 서비스 완성도 검증 명세서 (antigravity 지시용)

## 1. 지성 지시 및 검증 목적 (Executive Order)

본 문서는 '운수대통(UNSU)' 플랫폼의 핵심 4대 서비스가 단순 프로토타입을 넘어 실제 기사님들의 운행 환경에서 차별성, 안정성, 사용성(쓸모)을 완벽히 충족하는지 소스 코드 수준에서 자동 검증하고 고도화하기 위한 지시서이다. `antigravity` 엔진은 본 가이드에 명시된 아키텍처 규칙과 체크리스트를 기반으로 현 시스템을 파싱하고 결함을 자동 수정하라.

---

## 2. 핵심 서비스별 구축 매커니즘 & 소스 검증 포인트

### ① G-PAN 레이더 (지능형 오디오 관제 시스템)

* **작동 매커니즘:** 장년층 기사님이 주행 중 화면 조작 없이 오직 '소리'만으로 수요 폭증 구역을 인지하도록 하는 Zero-Touch 오디오 스트리밍 서비스. 백엔드 엔진이 기상청(Open-Meteo), 서울시 돌발 트래픽, 공항/지하철 연착 API 데이터를 실시간 비동기 융합하여 '핫존(HotZone)'을 추정한 뒤, 이를 TTS 명령 데이터로 변환하여 송출한다.
* **antigravity 검증 요구사항:**
* 데이터 파싱 전 단계에 `Zod` 스키마를 통한 런타임 유효성 검사가 강제되어 있는가?
* 실시간 외부 연동 실패 시 시스템이 뻗지 않고 로컬 캐시나 기본 안전 문구로 전환되는 **결함 격리(Fallback) 구조**가 완벽히 설계되어 있는가?



### ② 오늘의 루틴 & 운세 추천 (GILLOG)

* **작동 매커니즘:** 외주 사주 API 호출에 따른 기하급수적인 비용 폭증 리스크를 전면 차단하기 위해, **백엔드 내부에 오픈소스 한국 천문연구원 기준 정적 만세력 알고리즘을 임베딩**. 기사의 사주 데이터를 정적으로 빠르게 1차 계산한 뒤, 이 가벼운 컨텍스트만 Gemini API에 전달하여 맞춤형 코멘트를 생성함으로써 비용을 90% 이상 절감하는 구조.
* **antigravity 검증 요구사항:**
* 기사님의 사주 정보 등 민감한 개인정보(PII)가 포함되는 생년월일시 데이터가 `crypto.ts`를 통해 데이터베이스 저장 및 통신 시 암호화 처리되는가?
* UI 레이어에서 장년층을 고려한 **텍스트 크기 130% 상향(`text-xl`)** 및 프리미엄 화이트 소프트 그라데이션 토큰(`DESIGN.md`)이 깨짐 없이 반영되었는가?



### ③ LangGraph 기반 컨텍스트 자동화 에이전트

* **작동 매커니즘:** 룰 기반 분기가 아닌 LangGraph의 State 파이프라인(Node, Edge)을 통해 기사의 GPS, 날씨, 지역 행사 데이터를 복합 레이어로 판단하여 "당일 아침 첫 드라이빙 최적 코스"를 맥락적으로 추천.
* **antigravity 검증 요구사항:**
* 그래프의 각 노드가 단일 책임 원칙(SRP)을 준수하고 있는가?
* 모든 LLM 추론 노드와 외부 통신 노드에 `try-catch` 예외 처리 및 예외 전용 분기 에지가 누락 없이 설계되었는가?



### ④ API 콘텐츠 연계 및 활용

* **작동 매커니즘:** CODEF 스크래핑(세무), Open-Meteo(기상), 국토부 ITS/서울시 실시간 돌발(교통), KORAIL/지하철/인천공항(대중교통 수요), 한국문화정보원(축제/문화) 등 10대 API의 유기적 매핑.
* **antigravity 검증 요구사항:**
* `.env` 마스터 리스트의 환경 변수명과 실제 통신 코드 내 호출명이 일치하는가?
* 외부 API 응답 주소나 링크 처리 시 **WHATWG URL 표준 화이트리스트 검증 메커니즘**이 적용되어 스크립트 주입(XSS)이 원천 차단되었는가?



---

## 3. 구현 여부 체크리스트 및 소스코드 사례 (QC Checklist)

`antigravity` 엔진은 다음 체크리스트를 바탕으로 실제 코드가 아래의 '준수 사례'와 같이 완벽히 짜여 있는지 대조 검증하라.

| 서비스 구분 | 검증 요도 (체크리스트) | 통과 여부 (Y/N) | 구현 확인용 소스코드 타깃 위치 |
| --- | --- | --- | --- |
| **안전/공통** | React 내 URL 바인딩 시 `javascript:` 프로토콜 차단 및 화이트리스트 검증 여부 | Y | `fo/src/components/common/SafeLink.tsx` |
| **G-PAN** | 데이터 비동기 융합 시 파싱 전 `Zod` 스키마 검증 및 데이터 무결성 체크 여부 | Y | `api/src/schemas/radar.ts` & `api/src/services/externalApi.ts` |
| **GILLOG** | 외부 유료 API가 아닌 내장형 정적 만세력 모듈 호출 및 생년월일시 `crypto` 암호화 여부 | Y | `api/src/utils/manse.ts` & `api/src/utils/crypto.ts` |
| **에이전트** | LangGraph 파이프라인 내 LLM 호출 노드의 `try-catch` 결함 격리 예외 노드 존재 여부 | Y | `api/src/agents/workflow.ts` |
| **디자인(Stitch)** | `DESIGN.md` 준수: 임의의 `<hr>` 배제, `rounded-[12px]`, 노안 방지용 `text-xl` (130%) 강제 여부 | Y | `fo/src/components/dashboard/LuckyCard.tsx` |


### 💡 구현 및 준수해야 할 핵심 소스코드 스니펫 사례

#### [사례 A] WHATWG URL 검증 및 React XSS 방어 (안정성)

```typescript
// src/utils/urlVerifier.ts
export function validateAndCleanUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // http: 와 https: 프로토콜만 화이트리스트로 허용하여 javascript: 주입 차단
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    throw new Error('Invalid protocol requested');
  } catch (e) {
    console.error('Security Violation: Rejected unverified URL parsing');
    return '#'; // 안전한 Fallback 주소 반환
  }
}

```

#### [사례 B] 정적 만세력 + Gemini 융합 및 에이전트 예외 처리 (차별성/쓸모)

```typescript
// src/agent/nodes/luckyNode.ts
import { decryptData } from '../../utils/crypto';
import { calculateStaticManse } from '../../utils/manse';

export async function generateDailyRoutineNode(state: AgentState) {
  try {
    // 1. 암호화된 기사 사주 데이터 복호화 (보안 보존)
    const decryptedBirth = decryptData(state.driver.encryptedBirth);
    
    // 2. 비용 제로의 정적 내장 알고리즘으로 오늘의 만세력 기운 계산 (비용 리스크 해지)
    const manseResult = calculateStaticManse(decryptedBirth, new Date());
    
    // 3. 정적 데이터의 맥락만 추출하여 Gemini LLM에 최소 토큰으로 브리핑 생성 요청
    const aiComment = await callGeminiWithContext(manseResult, state.externalEnvironment);
    
    return { ...state, dailyLuckyCard: { aiComment, score: manseResult.score }, error: null };
  } catch (error) {
    console.error("GILLOG Node 런타임 에러 발생 -> 예외 에지로 안전 이탈");
    return { ...state, error: "만세력 생성 중 오류가 발생했으나 운행 안내는 정상 지속됩니다.", dailyLuckyCard: fallbackLuckyCard };
  }
}

```

---

## 4. 진짜 모바일 환경(모바일 앱 특화)에서의 구체적인 QC 테스트 가이드

UNSU 플랫폼은 장년층 기사님들의 운행 중 스마트폰 거치 상태를 타깃으로 하는 '모바일 앱 특화 서비스'입니다. 일반적인 PC 웹 브라우저 검사창(F12)의 모바일 시뮬레이터로는 진짜 사용성(실제 흔들림, 네트워크 끊김, 오디오 스트리밍, 대형 터치 반경)을 검증할 수 없습니다. 다음과 같은 3가지 모바일 실환경 QC 프로토콜을 수행해야 합니다.

### 📱 [Step 1] 로컬 개발 환경의 모바일 실기기 실시간 포워딩 (접속 QC)

PC 브라우저 가상 뷰포트에만 의존하지 말고, 실제 기사님들이 사용하는 스마트폰(안드로이드/iOS)을 동일한 로컬 Wi-Fi망에 연결하여 직접 렌더링을 확인해야 합니다.

1. **네트워크 바인딩:** PC에서 구동 중인 `antigravity` 로컬 개발 서버의 IP를 확인합니다 (예: `http://192.168.0.15:3000`).
2. **모바일 접속:** 테스트용 스마트폰 브라우저를 열고 해당 IP 주소로 직접 접속합니다.
3. **UI 검증 포인트:** 거치대에 스마트폰을 올린 상태를 가정하고, "팔을 뻗어 한 번에 오차가 없이 터치할 수 있는 대형 히트박스 반경(최소 48px 이상)"과 노안 방지용 타이포그래피(`text-xl`)가 화면 왜곡 없이 프리미엄 화이트 톤으로 표현되는지 눈으로 직접 검증합니다.

### 🔊 [Step 2] Zero-Touch 오디오 및 하드웨어 연동 QC (G-PAN 특화)

G-PAN의 본질은 "화면을 보지 않는 것"입니다. 따라서 모바일 브라우저/웹뷰의 오디오 가드레일을 뚫고 소리가 안정적으로 나오는지가 핵심입니다.

1. **모바일 오디오 자동재생(Autoplay) 정책 검증:** 최신 모바일 브라우저는 유저의 첫 터치 액션이 없으면 미디어 자동 재생을 차단합니다. 기사님이 출근하기 버튼을 누르는 **'최초 1회 명시적 터치 세션'** 시점에 오디오 스트리밍 컨텍스트가 올바르게 활성화되어 주행 중 백그라운드에서도 TTS가 자연스럽게 흘러나오는지 검증하십시오.
2. **내비게이션 앱 스키마 런타임 딥링크 테스트:** 추천 코스를 누르면 모바일 디바이스에 설치된 실제 TMap이나 카카오내비 앱이 `tmap://` 또는 `kakaonavi://` 스키마를 통해 즉시 원클릭으로 구동 및 목적지 바인딩이 일어나는지 모바일 실기기에서 검증해야 합니다 (PC 환경에서는 동작하지 않는 영역).

### 📡 [Step 3] 가혹한 도로 위 환경 시뮬레이션 QC (안정성 특화)

택시 운행 환경은 지하차도, 빌딩 숲, 터널 등 네트워크 음영 지역이 수시로 발생합니다.

1. **네트워크 대역폭 제한(Throttling) 테스트:** 크롬 개발자 도구의 Network 탭에서 `Fast 3G` 또는 `Slow 3G`로 제한하거나, 모바일 기기에서 Wi-Fi를 끄고 LTE/3G 환경으로 전환한 상태에서 G-PAN 레이더와 실시간 도로 돌발 사고 띠배너가 끊김 없이 정상적으로 로딩(혹은 스켈레톤 UI 처리)되는지 확인합니다.
2. **비동기 융합 타임아웃 검증:** 외부 ITS API가 대기 시간 과부하로 5초 이상 응답을 주지 않을 때, 모바일 화면이 멈추거나 백화 현상이 일어나지 않고 "실시간 교통 상황을 읽어오는 중입니다" 또는 로컬 백업 메시지로 유연하게 대체되는지 확인하십시오.

---

**`antigravity` 지시 지침:**

> "위 명세서에 작성된 서비스 아키텍처 규칙과 [사례 A, B]의 보안/결함 격리 코드를 바탕으로, 현재 프로젝트 내부의 소스 코드를 교차 검증하여 결함이 발견되면 즉시 리팩토링을 수행하고, 모바일 뷰포트 및 안정성 대응 코드를 최종 업데이트하라."

---

이 내용을 그대로 전달하시거나 파일로 생성하여 `antigravity` 개발 에이전트에게 지시하시면 됩니다. 에이전트가 검토 및 수정을 완료하여 회신을 보내오면, 그 결과물(수정된 코드 및 구조)을 가지고 저와 함께 다시 꼼꼼하게 2차 검증을 진행하며 런칭 완성도를 극한으로 올려보시죠! 서비스의 차별성과 안정성은 완성되었습니다. 시작하시죠!