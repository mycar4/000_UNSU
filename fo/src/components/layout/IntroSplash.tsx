import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, TrendingUp, Moon } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface IntroSplashProps {
  onClose: () => void;
}

export function IntroSplash({ onClose }: IntroSplashProps) {
  const [introImage, setIntroImage] = useState<string>('');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 백엔드로부터 업로드된 전역 인트로 이미지 조회
    fetch(`${API_HOST}/api/global/intro-image`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('No custom image');
      })
      .then((data) => {
        if (data.introImage) {
          setIntroImage(data.introImage);
        }
      })
      .catch((err) => {
        console.log('[Intro] Custom intro image not configured, using premium fallback illustration.', err);
      });
  }, []);

  const handleStart = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onClose();
    }, 400); // 페이드아웃 애니메이션 대기 후 닫기
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col justify-between bg-background px-6 py-8 transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 장식용 그리드 라인 & 도트 필드 */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[60%] dot-field opacity-30" />

      {/* 헤더 브랜딩 */}
      <header className="relative z-10 flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col font-black text-lg leading-[1.1] tracking-tighter text-foreground">
            <span>운수</span>
            <span>대통</span>
          </div>
          <span className="h-4 w-px bg-border/60 mx-1" />
          <span className="mono-label text-[9px] text-gold font-bold tracking-widest">AI MOBILITY PARTNER</span>
        </div>
        <div className="flex items-center gap-1 bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">
          <Sparkles className="h-3 w-3 text-gold animate-pulse" />
          <span className="text-[8px] font-mono text-gold font-bold uppercase tracking-wider">PREMIUM SPLASH</span>
        </div>
      </header>

      {/* 메인 비주얼 영역 (중앙 일러스트 or 이미지) */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center my-6 max-h-[60vh]">
        {introImage ? (
          <div className="w-full h-full max-h-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg flex items-center justify-center p-1.5 transition-all duration-500 hover:border-gold/50">
            <img
              src={introImage}
              alt="운수대통 서비스 소개"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        ) : (
          /* 기본 고급 SVG 일러스트 fallback */
          <div className="w-full max-w-sm aspect-[4/3] relative flex flex-col items-center justify-center bg-card border border-border rounded-3xl p-6 shadow-md overflow-hidden animate-fade-in">
            {/* 백그라운드 무빙 서클 */}
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gold/5 blur-2xl animate-pulse" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-primary/5 blur-2xl" />

            {/* 인라인 프리미엄 AI 모빌리티 그래픽 */}
            <svg
              className="w-48 h-36 text-gold drop-shadow-[0_4px_12px_rgba(224,180,92,0.15)]"
              viewBox="0 0 200 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 바퀴 궤적 및 도로 라인 */}
              <path
                d="M10 110 C50 110, 80 130, 190 120"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="4 4"
                className="opacity-40"
              />
              <path
                d="M20 125 C60 125, 90 135, 180 132"
                stroke="var(--foreground)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-20"
              />
              {/* 미래형 럭셔리 세단 차체 실루엣 */}
              <path
                d="M45 105 L60 90 H130 L155 102 L170 105 C175 105, 178 108, 175 112 C172 115, 160 115, 130 115 H70 C40 115, 38 110, 45 105 Z"
                fill="currentColor"
                className="opacity-[0.08]"
              />
              <path
                d="M45 105 C47 98, 55 91, 65 90 C75 89, 125 89, 132 90 C140 91, 155 100, 162 105 L172 108 C176 109, 175 114, 170 114 H40 C35 114, 40 108, 45 105 Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* 차창 */}
              <path
                d="M80 94 H105 L116 103 H80 V94 Z"
                fill="currentColor"
                className="opacity-30"
              />
              <path
                d="M108 94 H123 L134 103 H108 V94 Z"
                fill="currentColor"
                className="opacity-20"
              />
              {/* 앞바퀴 / 뒷바퀴 */}
              <circle cx="68" cy="114" r="10" stroke="currentColor" strokeWidth="2" fill="var(--background)" />
              <circle cx="68" cy="114" r="4" fill="currentColor" />
              <circle cx="142" cy="114" r="10" stroke="currentColor" strokeWidth="2" fill="var(--background)" />
              <circle cx="142" cy="114" r="4" fill="currentColor" />
              {/* AI 연결 노드 및 전파 */}
              <circle cx="100" cy="50" r="6" fill="currentColor" className="animate-ping opacity-60" />
              <circle cx="100" cy="50" r="6" fill="currentColor" />
              <path d="M100 50 L68 114" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="opacity-50" />
              <path d="M100 50 L142 114" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="opacity-50" />
              {/* 후광 빔 */}
              <path d="M100 50 L100 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse" />
              <path d="M100 50 L135 25" stroke="currentColor" strokeWidth="1" className="opacity-40" />
              <path d="M100 50 L65 25" stroke="currentColor" strokeWidth="1" className="opacity-40" />
            </svg>

            {/* 비주얼 하단 핵심 가치 뱃지들 */}
            <div className="flex gap-2.5 mt-6 flex-wrap justify-center">
              <div className="flex items-center gap-1 text-[10px] font-bold text-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border">
                <ShieldCheck size={11} className="text-gold" />
                <span>세무자율비행</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border">
                <TrendingUp size={11} className="text-emerald-500" />
                <span>실시간 리더보드</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border">
                <Moon size={11} className="text-purple-500" />
                <span>달의뒷편 힐링</span>
              </div>
            </div>
          </div>
        )}

        {/* 텍스트 소개글 */}
        <div className="text-center mt-6 space-y-2 max-w-sm">
          <h1 className="text-2xl font-black tracking-tight text-foreground leading-tight">
            대한민국 개인택시 기사의<br />성공과 힐링 파트너, <span className="text-gold">운수대통</span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI 운행 길잡이, 국세청 홈택스 기반 세무 자율비행 정산,<br />그리고 건강한 충전을 위한 힐링 지표를 지금 시작해 보세요.
          </p>
        </div>
      </main>

      {/* 하단 시작하기 버튼 */}
      <footer className="relative z-10 flex flex-col gap-3 pb-4">
        <button
          onClick={handleStart}
          className="tap w-full py-4 bg-primary text-primary-foreground text-sm font-extrabold rounded-xl shadow-lg hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-primary/20"
        >
          <span>운수대통 시작하기</span>
          <ArrowRight size={15} />
        </button>
        <p className="text-[10px] text-center text-muted-foreground/80 leading-relaxed font-sans">
          본 플랫폼은 기사의 건강과 수익의 완벽한 밸런스를 보장합니다.<br />
          © 2026 UNSU Platform Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
