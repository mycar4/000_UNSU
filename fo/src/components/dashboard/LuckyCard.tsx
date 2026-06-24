import React, { useState } from 'react';
import { Sparkles, RefreshCw, Star, Shield, Heart, Compass, Zap, TrendingUp, Coffee, Moon } from 'lucide-react';

interface LuckyCardProps {
  profile: {
    birthDate: string;
    birthTime: string;
  } | null;
  luckyCard: {
    grade: string;
    comment: string;
    score?: number;
  } | null;
}

const formatProfileBirthDate = (birthDateString: string) => {
  const parts = birthDateString.split('-');
  if (parts.length === 3) {
    const yy = parts[0].slice(-2);
    const mm = parts[1];
    return `${yy}년 ${mm}월`;
  }
  return birthDateString;
};

// 사주 등급별 3대 스코어(재물, 안전, 컨디션) 매핑 데이터
const getScoresByGrade = (grade: string) => {
  const normGrade = grade.toUpperCase();
  if (normGrade === 'BEST' || normGrade === '최상') {
    return { wealth: 98, safety: 90, stamina: 95 };
  } else if (normGrade === 'GOOD' || normGrade === '상') {
    return { wealth: 85, safety: 80, stamina: 88 };
  } else if (normGrade === 'NORMAL' || normGrade === '우수') {
    return { wealth: 70, safety: 75, stamina: 72 };
  } else {
    // BAD / 평온
    return { wealth: 45, safety: 95, stamina: 55 };
  }
};

// 오늘의 일진별 세련된 아이콘 & 문구 설정 매핑
const gradeConfig: Record<string, { icon: React.ReactNode; text: string; subtitle: string; colorClass: string; barColor: string }> = {
  'BEST': {
    icon: <Zap className="h-5 w-5 text-amber-500 fill-amber-500/20" />,
    text: '최상 (대통)',
    subtitle: '힘차게 일하는 날!',
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    barColor: 'bg-amber-500'
  },
  'GOOD': {
    icon: <TrendingUp className="h-5 w-5 text-gold fill-gold/10" />,
    text: '상 (상생)',
    subtitle: '재물이 따르는 날',
    colorClass: 'text-gold bg-gold/10 border-gold/20',
    barColor: 'bg-gold'
  },
  'NORMAL': {
    icon: <Sparkles className="h-5 w-5 text-blue-500 fill-blue-500/10" />,
    text: '우수 (평온)',
    subtitle: '순탄하고 평온한 날',
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    barColor: 'bg-blue-500'
  },
  'BAD': {
    icon: <Coffee className="h-5 w-5 text-rose-500 fill-rose-500/10" />,
    text: '평온 (휴식)',
    subtitle: '기분 좋게 쉬어가는 날!',
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    barColor: 'bg-rose-500'
  }
};

const getGradeConfig = (grade: string) => {
  const norm = grade.toUpperCase();
  if (norm === 'BEST' || norm === '최상') return gradeConfig['BEST'];
  if (norm === 'GOOD' || norm === '상') return gradeConfig['GOOD'];
  if (norm === 'NORMAL' || norm === '우수') return gradeConfig['NORMAL'];
  return gradeConfig['BAD']; // BAD / 평온
};

export const LuckyCard: React.FC<LuckyCardProps> = ({ profile, luckyCard }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const displayGrade = luckyCard?.grade || 'NORMAL';
  const conf = getGradeConfig(displayGrade);
  const displayComment = luckyCard?.comment || '기사 프로필을 먼저 등록하시면 사주 만세력 알고리즘을 분석하여 오늘의 맞춤 행운 동선을 알려드립니다.';
  const defaultScores = getScoresByGrade(displayGrade);
  
  const scores = {
    wealth: luckyCard?.score || defaultScores.wealth,
    safety: defaultScores.safety,
    stamina: defaultScores.stamina
  };

  const handleCardClick = () => {
    if (!profile) return; // 프로필 없으면 뒤집히지 않음
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className="perspective-1000 w-full min-h-[360px] cursor-pointer"
      onClick={handleCardClick}
      id="lucky-card"
    >
      <div 
        className={`relative w-full h-full min-h-[360px] preserve-3d transition-transform duration-700 ease-out-back ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ========================================== */}
        {/* FRONT SIDE (앞면 - 미스터리 미오픈 카드) */}
        {/* ========================================== */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border-2 border-gold/40 bg-card p-6 shadow-lg flex flex-col justify-between overflow-hidden">
          {/* Decorative design elements */}
          <div className="absolute inset-0 bg-radial-gradient from-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-36 h-36 border border-gold/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 border border-gold/10 rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between z-10">
            <span className="mono-label text-[10px] text-gold font-bold tracking-widest border border-gold/30 bg-gold/5 px-2.5 py-1 rounded-lg">
              DAILY MYSTERY CARD
            </span>
            <Sparkles className="h-5 w-5 text-gold animate-pulse" />
          </div>

          <div className="flex flex-col items-center justify-center text-center my-auto z-10">
            {/* 세련된 전통 패철/나침반 모티브의 링 회전 UI */}
            <div className="relative flex items-center justify-center w-28 h-28 rounded-full border border-gold/30 bg-gold/5 shadow-[0_0_20px_rgba(212,163,89,0.1)]">
              <div className="absolute inset-2 rounded-full border border-dashed border-gold/40 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border border-gold/20" />
              <Compass className="h-10 w-10 text-gold animate-[spin_40s_linear_infinite]" />
            </div>
            <h3 className="mt-6 text-2xl font-black text-foreground tracking-tight">
              {profile ? `"${formatProfileBirthDate(profile.birthDate)}생 기사님"` : '오늘의 행운 카드'}
            </h3>
            <p className="mt-2.5 text-xs font-bold text-gold bg-gold/5 border border-gold/20 px-4 py-1.5 rounded-full shadow-sm">
              {profile ? '터치하여 오늘 일진을 확인하세요' : '프로필을 설정하면 운세가 열립니다'}
            </p>
          </div>

          <div className="text-center text-[10px] text-muted-foreground/60 font-mono tracking-widest z-10">
            UNSU PLATFORM AI METAPHYSICS
          </div>
        </div>

        {/* ========================================== */}
        {/* BACK SIDE (뒷면 - 오픈된 상세 운세 & 게이지) */}
        {/* ========================================== */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border border-border bg-card p-6 shadow-lg flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="mono-label text-[10px] text-foreground/90 font-extrabold tracking-wider bg-secondary px-2.5 py-1 rounded-lg border border-border">
              운세 브리핑
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-black border flex items-center gap-1.5 shadow-sm ${conf.colorClass}`}>
                {conf.icon}
                {conf.text}
              </span>
              <div className="p-1 rounded-lg bg-secondary text-muted-foreground">
                <RefreshCw size={11} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4.5 my-auto">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-foreground">
                  {profile ? `"${formatProfileBirthDate(profile.birthDate)} 기사님의 오늘"` : '오늘의 행운 조언'}
                </span>
                <span className="text-xs text-muted-foreground/90 font-bold border border-border bg-secondary px-2 py-0.5 rounded-md">
                  {conf.subtitle}
                </span>
              </div>
              <p className="text-base text-muted-foreground/90 leading-relaxed font-bold font-sans bg-secondary/30 p-4 rounded-xl border border-border/30">
                {displayComment}
              </p>
            </div>

            {/* 3대 운세 비주얼 게이지 차트 */}
            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase">
                LUCKY RADAR CHART
              </div>
              
              {/* 1. 재물운 */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 w-16">
                  <Star size={12} className="text-gold fill-gold" />
                  재물운
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-secondary/80 overflow-hidden border border-border/20">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${conf.barColor}`}
                    style={{ width: `${scores.wealth}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-black text-foreground/80 w-8 text-right">{scores.wealth}%</span>
              </div>

              {/* 2. 안전운 */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 w-16">
                  <Shield size={12} className="text-emerald-500 fill-emerald-500/20" />
                  안전운
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-secondary/80 overflow-hidden border border-border/20">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${scores.safety}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-black text-foreground/80 w-8 text-right">{scores.safety}%</span>
              </div>

              {/* 3. 컨디션 */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 w-16">
                  <Heart size={12} className="text-rose-500 fill-rose-500/20" />
                  컨디션
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-secondary/80 overflow-hidden border border-border/20">
                  <div 
                    className="h-full rounded-full bg-rose-500 transition-all duration-1000"
                    style={{ width: `${scores.stamina}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-black text-foreground/80 w-8 text-right">{scores.stamina}%</span>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-muted-foreground/40 font-mono tracking-widest">
            TAP TO FLIP BACK
          </div>
        </div>
      </div>
    </div>
  );
};
