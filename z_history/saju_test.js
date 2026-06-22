const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const JI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const epoch = new Date('1970-01-01T00:00:00Z');

// Test dates:
// 1970-01-01 -> 정사 (丁巳) -> Gan: 정 (3), Ji: 사 (5)
// 1984-06-01 -> 정축 (丁丑) -> Gan: 정 (3), Ji: 축 (1)
// 2026-06-22 -> 신사 (辛巳) -> Gan: 신 (7), Ji: 사 (5)

function testOffset(ganOffset, jiOffset) {
  const dates = [
    { dateStr: '1970-01-01', expected: '정사' },
    { dateStr: '1984-06-01', expected: '정축' },
    { dateStr: '2026-06-22', expected: '신사' }
  ];

  console.log(`Testing offsets: Gan=${ganOffset}, Ji=${jiOffset}`);
  for (const t of dates) {
    const d = new Date(t.dateStr);
    const birthYear = d.getFullYear();
    const birthMonth = d.getMonth() + 1;
    const birthDay = d.getDate();

    const birthDateUTC = Date.UTC(birthYear, birthMonth - 1, birthDay);
    const diffDays = Math.floor((birthDateUTC - epoch.getTime()) / (24 * 60 * 60 * 1000));

    const dayGanIdx = (((ganOffset + diffDays) % 10) + 10) % 10;
    const dayJiIdx = (((jiOffset + diffDays) % 12) + 12) % 12;
    const result = GAN[dayGanIdx] + JI[dayJiIdx];

    console.log(`  Date: ${t.dateStr}, DiffDays: ${diffDays}, Got: ${result}, Expected: ${t.expected}, Match: ${result === t.expected}`);
  }
}

for (let g = 0; g < 10; g++) {
  for (let j = 0; j < 12; j++) {
    // Check if both 1970-01-01 is '정사' AND 1984-06-01 is '정축' AND 2026-06-22 is '신사'
    const d1 = Date.UTC(1970, 0, 1);
    const diff1 = 0;
    const r1 = GAN[(g + diff1) % 10] + JI[(j + diff1) % 12];

    const d2 = Date.UTC(1984, 5, 1);
    const diff2 = Math.floor((d2 - d1) / (24 * 60 * 60 * 1000));
    const r2 = GAN[(g + diff2) % 10] + JI[(j + diff2) % 12];

    const d3 = Date.UTC(2026, 5, 22);
    const diff3 = Math.floor((d3 - d1) / (24 * 60 * 60 * 1000));
    const r3 = GAN[(g + diff3) % 10] + JI[(j + diff3) % 12];

    if (r1 === '정사' && r2 === '정축' && r3 === '신사') {
      console.log(`>>> Found matching offsets! Gan=${g}, Ji=${j}`);
    }
  }
}
