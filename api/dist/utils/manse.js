const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const JI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const ELEMENT_MAP = {
    // 천간 오행
    '갑': '목', '을': '목',
    '병': '화', '정': '화',
    '무': '토', '기': '토',
    '경': '금', '신': '금', // 천간 '신' (지지 '신'도 동일하게 '금'이므로 하나로 통합)
    '임': '수', '계': '수',
    // 지지 오행
    '인': '목', '묘': '목',
    '사': '화', '오': '화',
    '진': '토', '술': '토', '축': '토', '미': '토',
    '유': '금',
    '해': '수', '자': '수'
};
/**
 * 특정 기준일과 비교하여 기사님의 정적 만세력 사주 및 오늘의 재물운 점수를 계산합니다.
 */
export function calculateStaticManse(birthDateStr, birthTimeStr, targetDate = new Date()) {
    // 1. Parse birth date & time
    const birthDate = new Date(birthDateStr);
    const birthYear = birthDate.getFullYear();
    const birthMonth = birthDate.getMonth() + 1;
    const birthDay = birthDate.getDate();
    let birthHour = 12;
    let birthMin = 0;
    if (birthTimeStr) {
        const timeParts = birthTimeStr.split(':');
        if (timeParts.length >= 2) {
            birthHour = parseInt(timeParts[0], 10);
            birthMin = parseInt(timeParts[1], 10);
        }
    }
    // 2. Calculate Year Pillar (년주) - 기준 입춘(대략 양력 2월 4일) 적용
    let yearOffset = birthYear;
    // 만약 1월이거나 2월 4일 이전이면 음력/명리학 상 이전 해로 취급
    if (birthMonth < 2 || (birthMonth === 2 && birthDay < 4)) {
        yearOffset = birthYear - 1;
    }
    const yearGan = GAN[(yearOffset - 4) % 10];
    const yearJi = JI[(yearOffset - 4) % 12];
    const yearPillar = yearGan + yearJi;
    // 3. Calculate Month Pillar (월주) - 절기 오프셋 기반 단순 추정
    // 명리학 상 절기는 매월 4~8일 경에 바뀜
    let monthOffset = birthMonth;
    if (birthDay < 5) {
        monthOffset = birthMonth - 1;
        if (monthOffset === 0)
            monthOffset = 12;
    }
    // 월간 구하기 (년천간에 따른 월천간 공식)
    const monthGanStart = ((yearOffset - 4) % 5) * 2 + 2; // 갑기해는 병인월부터, 을경해는 무인월부터...
    const monthGan = GAN[(monthGanStart + (monthOffset - 1)) % 10];
    const monthJi = JI[(monthOffset + 1) % 12]; // 1월은 인(2), 2월은 묘(3)...
    const monthPillar = monthGan + monthJi;
    // 4. Calculate Day Pillar (일주) - 1970-01-01 (기사일: 기=5, 사=5) 기준 오프셋
    const epoch = new Date('1970-01-01T00:00:00Z');
    const birthDateUTC = Date.UTC(birthYear, birthMonth - 1, birthDay);
    const diffDays = Math.floor((birthDateUTC - epoch.getTime()) / (24 * 60 * 60 * 1000));
    // 음수 보정 포함한 modulo
    const dayGanIdx = (((5 + diffDays) % 10) + 10) % 10;
    const dayJiIdx = (((5 + diffDays) % 12) + 12) % 12;
    const dayGan = GAN[dayGanIdx];
    const dayJi = JI[dayJiIdx];
    const dayPillar = dayGan + dayJi;
    // 5. Calculate Hour Pillar (시주) - 일간과 태어난 시간에 따른 시주 공식
    // 하루 24시간을 12시진으로 나눔 (23:30 ~ 01:29 자시, 01:30 ~ 03:29 축시...)
    const totalMinutes = birthHour * 60 + birthMin;
    let siIdx = 0; // 자시
    if (totalMinutes >= 90 && totalMinutes < 210)
        siIdx = 1; // 축시
    else if (totalMinutes >= 210 && totalMinutes < 330)
        siIdx = 2; // 인시
    else if (totalMinutes >= 330 && totalMinutes < 450)
        siIdx = 3; // 묘시
    else if (totalMinutes >= 450 && totalMinutes < 570)
        siIdx = 4; // 진시
    else if (totalMinutes >= 570 && totalMinutes < 690)
        siIdx = 5; // 사시
    else if (totalMinutes >= 690 && totalMinutes < 810)
        siIdx = 6; // 오시
    else if (totalMinutes >= 810 && totalMinutes < 930)
        siIdx = 7; // 미시
    else if (totalMinutes >= 930 && totalMinutes < 1050)
        siIdx = 8; // 신시
    else if (totalMinutes >= 1050 && totalMinutes < 1170)
        siIdx = 9; // 유시
    else if (totalMinutes >= 1170 && totalMinutes < 1290)
        siIdx = 10; // 술시
    else if (totalMinutes >= 1290 && totalMinutes < 1410)
        siIdx = 11; // 해시
    else
        siIdx = 0; // 23:30 이후 또는 01:30 이전 자시
    // 일간에 따른 자시의 천간 공식 (갑기일진은 갑자시, 을경일진은 병자시...)
    const hourGanStart = (dayGanIdx % 5) * 2;
    const hourGan = GAN[(hourGanStart + siIdx) % 10];
    const hourJi = JI[siIdx];
    const hourPillar = hourGan + hourJi;
    // 6. Calculate Five Elements (오행) counts
    const elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    const allCharacters = [
        yearGan, yearJi,
        monthGan, monthJi,
        dayGan, dayJi,
        hourGan, hourJi
    ];
    for (const char of allCharacters) {
        const el = ELEMENT_MAP[char];
        if (el) {
            elements[el]++;
        }
    }
    // 7. Calculate today's Wealth Luck Score (재물운 점수)
    // 오늘의 일간/일지 계산
    const targetUTC = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const targetDiffDays = Math.floor((targetUTC - epoch.getTime()) / (24 * 60 * 60 * 1000));
    const todayGanIdx = (((5 + targetDiffDays) % 10) + 10) % 10;
    const todayJiIdx = (((5 + targetDiffDays) % 12) + 12) % 12;
    const todayGan = GAN[todayGanIdx];
    const todayJi = JI[todayJiIdx];
    const todayGanElement = ELEMENT_MAP[todayGan];
    const todayJiElement = ELEMENT_MAP[todayJi];
    // 명리학 상 나의 일간(dayGan) 오행과 오늘의 오행 간의 상생/상극 관계를 이용해 점수화
    // 내가 극하는 오행(재성, Wealth) 또는 나를 생해주는 오행(인성, Support)이 들어오는 날 재물운 상승
    const myElement = ELEMENT_MAP[yearGan]; // 본원(일간 혹은 년간 기준으로 약식 판정 - 여기선 년간과 일간 조합)
    // 간단한 상생상극 정의
    // 목->화->토->금->수->목 (상생)
    // 목->토->수->화->금->목 (상극: 내가 이기는 것 = 재물)
    const relations = {
        '목': { '목': 15, '화': 10, '토': 25, '금': 5, '수': 20 }, // 목극토(토는 재물: 25점), 수생목(수는 인성: 20점)
        '화': { '목': 20, '화': 15, '토': 10, '금': 25, '수': 5 }, // 화극금(금은 재물: 25점), 목생화(목은 인성: 20점)
        '토': { '목': 5, '화': 20, '토': 15, '금': 10, '수': 25 }, // 토극수(수는 재물: 25점), 화생토(화는 인성: 20점)
        '금': { '목': 25, '화': 5, '토': 20, '금': 15, '수': 10 }, // 금극목(목은 재물: 25점), 토생금(토는 인성: 20점)
        '수': { '목': 10, '화': 25, '토': 5, '금': 20, '수': 15 } // 수극화(화는 재물: 25점), 금생수(금은 인성: 20점)
    };
    const scoreGan = relations[myElement]?.[todayGanElement] || 15;
    const scoreJi = relations[myElement]?.[todayJiElement] || 15;
    // 기본 점수 50점에 간지 조합 영향력 가중치 반영 (최종 40 ~ 100점 범위)
    let score = 50 + scoreGan + scoreJi;
    if (score > 100)
        score = 100;
    if (score < 0)
        score = 0;
    // 점수에 따른 등급 판정
    let grade = 'NORMAL';
    if (score >= 85)
        grade = 'BEST';
    else if (score >= 70)
        grade = 'GOOD';
    else if (score >= 50)
        grade = 'NORMAL';
    else
        grade = 'BAD';
    return {
        yearPillar,
        monthPillar,
        dayPillar,
        hourPillar,
        elements,
        score,
        grade
    };
}
