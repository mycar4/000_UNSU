import React from 'react';
import { Sparkles } from 'lucide-react';

interface LuckyCardProps {
  profile: {
    birthDate: string;
    birthTime: string;
  } | null;
  luckyCard: {
    grade: string;
    comment: string;
  } | null;
}

const fortuneGradeMap: Record<string, string> = {
  'BEST': '최상',
  'GOOD': '상',
  'NORMAL': '우수',
  'BAD': '평온',
  '최상': '최상',
  '상': '상',
  '우수': '우수',
  '평온': '평온'
};

const formatProfileBirthDate = (birthDateString: string) => {
  const parts = birthDateString.split('-');
  if (parts.length === 3) {
    const yy = parts[0].slice(-2);
    const mm = parts[1];
    return `${yy}년${mm}월`;
  }
  return birthDateString;
};

export const LuckyCard: React.FC<LuckyCardProps> = ({ profile, luckyCard }) => {
  const displayGrade = fortuneGradeMap[luckyCard?.grade || ''] || '미정';
  const displayComment = luckyCard?.comment || '기사 프로필을 먼저 등록하시면 사주 만세력 알고리즘을 분석하여 오늘의 맞춤 행운 동선을 알려드립니다.';

  return (
    <section 
      id="lucky-card"
      className="bg-card border border-border rounded-[12px] p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-gold/50"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <span className="mono-label text-[11px] text-foreground/90 font-extrabold tracking-wider bg-secondary px-2.5 py-0.5 rounded border border-border">
          운세 브리핑
        </span>
        <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-bold border border-gold/20 flex items-center gap-1">
          <Sparkles size={12} className="animate-pulse" />
          재물운 {displayGrade}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-foreground">
          {profile ? `"${formatProfileBirthDate(profile.birthDate)} 생 기사님의 오늘 일진"` : '오늘의 행운 카드 🌟'}
        </h3>
        <p className="text-xl text-muted-foreground leading-relaxed font-medium">
          {displayComment}
        </p>
      </div>
    </section>
  );
};
