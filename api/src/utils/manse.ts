const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const JI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const ELEMENT_MAP: Record<string, '목' | '화' | '토' | '금' | '수'> = {
  // 천간 오행
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
  // 지지 오행
  '인': '목', '묘': '목',
  '사': '화', '오': '화',
  '진': '토', '술': '토', '축': '토', '미': '토',
  '유': '금',
  '해': '수', '자': '수'
};

export interface ManseResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  elements: { 목: number; 화: number; 토: number; 금: number; 수: number };
  deficientElement: '목' | '화' | '토' | '금' | '수';
  score: number;
  grade: 'BEST' | 'GOOD' | 'NORMAL' | 'BAD';
  myElement: string;        // 본원 (일천간 기준 오행)
}

/**
 * 특정 기준일과 비교하여 기사님의 정적 만세력 사주 및 오늘의 재물운 점수를 계산합니다.
 */
export function calculateStaticManse(birthDateStr: string, birthTimeStr?: string, targetDate: Date = new Date()): ManseResult {
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) {
    throw new Error("올바르지 않은 날짜 포맷입니다. (YYYY-MM-DD)");
  }

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

  // 24절기 입절 기준일 근사치
  const JOEL_DAYS = [5, 4, 5, 5, 5, 5, 7, 7, 7, 8, 7, 7];

  // 2. Calculate Year Pillar (년주) - 기준 입춘(양력 2월 4일) 적용
  let yearOffset = birthYear;
  if (birthMonth === 1 || (birthMonth === 2 && birthDay < 4)) {
    yearOffset = birthYear - 1;
  }
  const yearGan = GAN[(((yearOffset - 4) % 10) + 10) % 10];
  const yearJi = JI[(((yearOffset - 4) % 12) + 12) % 12];
  const yearPillar = yearGan + yearJi;

  // 3. Calculate Month Pillar (월주) - 절기 기준 정확도 개선
  let m = 1;
  if (birthMonth === 1) {
    m = birthDay < JOEL_DAYS[0] ? 11 : 12;
  } else if (birthMonth === 2) {
    m = birthDay < JOEL_DAYS[1] ? 12 : 1;
  } else {
    m = birthDay < JOEL_DAYS[birthMonth - 1] ? (birthMonth - 2) : (birthMonth - 1);
  }

  const monthGanStart = ((yearOffset - 4) % 5) * 2 + 2;
  const monthGan = GAN[(monthGanStart + (m - 1)) % 10];
  const monthJi = JI[(m + 1) % 12];
  const monthPillar = monthGan + monthJi;

  // 4. Calculate Day Pillar (일주) - 1970-01-01 (신사일: 신=7, 사=5) 기준 오프셋
  const epoch = new Date('1970-01-01T00:00:00Z');
  const birthDateUTC = Date.UTC(birthYear, birthMonth - 1, birthDay);
  const diffDays = Math.floor((birthDateUTC - epoch.getTime()) / (24 * 60 * 60 * 1000));
  
  const dayGanIdx = (((7 + diffDays) % 10) + 10) % 10;
  const dayJiIdx = (((5 + diffDays) % 12) + 12) % 12;
  const dayGan = GAN[dayGanIdx];
  const dayJi = JI[dayJiIdx];
  const dayPillar = dayGan + dayJi;

  // 5. Calculate Hour Pillar (시주)
  const totalMinutes = birthHour * 60 + birthMin;
  let siIdx = 0;
  if (totalMinutes >= 90 && totalMinutes < 210) siIdx = 1; // 축시
  else if (totalMinutes >= 210 && totalMinutes < 330) siIdx = 2; // 인시
  else if (totalMinutes >= 330 && totalMinutes < 450) siIdx = 3; // 묘시
  else if (totalMinutes >= 450 && totalMinutes < 570) siIdx = 4; // 진시
  else if (totalMinutes >= 570 && totalMinutes < 690) siIdx = 5; // 사시
  else if (totalMinutes >= 690 && totalMinutes < 810) siIdx = 6; // 오시
  else if (totalMinutes >= 810 && totalMinutes < 930) siIdx = 7; // 미시
  else if (totalMinutes >= 930 && totalMinutes < 1050) siIdx = 8; // 신시
  else if (totalMinutes >= 1050 && totalMinutes < 1170) siIdx = 9; // 유시
  else if (totalMinutes >= 1170 && totalMinutes < 1290) siIdx = 10; // 술시
  else if (totalMinutes >= 1290 && totalMinutes < 1410) siIdx = 11; // 해시
  else siIdx = 0;

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

  // 6-1. Find deficient element
  const elementOrder: Array<'목' | '화' | '토' | '금' | '수'> = ['목', '화', '토', '금', '수'];
  let deficientElement: '목' | '화' | '토' | '금' | '수' = '목';
  let minCount = 999;
  
  for (const el of elementOrder) {
    if (elements[el] < minCount) {
      minCount = elements[el];
      deficientElement = el;
    }
  }

  // 7. Calculate today's Wealth Luck Score (재물운 점수)
  const targetUTC = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const targetDiffDays = Math.floor((targetUTC - epoch.getTime()) / (24 * 60 * 60 * 1000));
  const todayGanIdx = (((7 + targetDiffDays) % 10) + 10) % 10;
  const todayJiIdx = (((5 + targetDiffDays) % 12) + 12) % 12;
  const todayGan = GAN[todayGanIdx];
  const todayJi = JI[todayJiIdx];

  const todayGanElement = ELEMENT_MAP[todayGan];
  const todayJiElement = ELEMENT_MAP[todayJi];

  const myElement = ELEMENT_MAP[dayGan] || '토'; // 본원 (일주 천간 - 일간)
  
  const relations: Record<string, Record<string, number>> = {
    '목': { '목': 15, '화': 10, '토': 25, '금': 5, '수': 20 },
    '화': { '목': 20, '화': 15, '토': 10, '금': 25, '수': 5 },
    '토': { '목': 5, '화': 20, '토': 15, '금': 10, '수': 25 },
    '금': { '목': 25, '화': 5, '토': 20, '금': 15, '수': 10 },
    '수': { '목': 10, '화': 25, '토': 5, '금': 20, '수': 15 }
  };

  const scoreGan = relations[myElement]?.[todayGanElement] || 15;
  const scoreJi = relations[myElement]?.[todayJiElement] || 15;
  
  let score = 50 + scoreGan + scoreJi;
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let grade: 'BEST' | 'GOOD' | 'NORMAL' | 'BAD' = 'NORMAL';
  if (score >= 85) grade = 'BEST';
  else if (score >= 70) grade = 'GOOD';
  else if (score >= 50) grade = 'NORMAL';
  else grade = 'BAD';

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    elements,
    deficientElement,
    score,
    grade,
    myElement
  };
}
