import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import unsu01 from '../../assets/unsu01.jpg';

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
      className={`absolute inset-0 z-[99] flex flex-col items-center justify-center bg-background px-6 py-8 transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 장식용 그리드 라인 & 도트 필드 */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[60%] dot-field opacity-30" />

      {/* 정갈하게 모인 이너 콘텐츠 컨테이너 */}
      <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center gap-y-6">
        {/* 헤더 브랜딩 */}
        <header className="w-full flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-col font-black text-lg leading-[1.1] tracking-tighter text-foreground text-left">
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
        <div className="w-full aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card shadow-lg flex items-center justify-center p-1.5 transition-all duration-500 hover:border-gold/50">
          <img
            src={introImage || unsu01}
            alt="운수대통 서비스 소개"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>

        {/* 텍스트 소개글 */}
        <div className="text-center space-y-2 w-full">
          <h1 className="text-xl font-black tracking-tight text-foreground leading-tight">
            대한민국 개인택시 기사의<br />성공과 힐링 파트너, <span className="text-gold">운수대통</span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed px-1">
            AI 운행 길잡이, 국세청 홈택스 기반 세무 자율비행 정산,<br />그리고 건강한 충전을 위한 힐링 지표를 지금 시작해 보세요.
          </p>
        </div>

        {/* 하단 시작하기 버튼 */}
        <footer className="w-full flex flex-col gap-3 pt-2">
          <button
            onClick={handleStart}
            className="tap w-full py-4 bg-primary text-primary-foreground text-sm font-extrabold rounded-xl shadow-lg hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-primary/20"
          >
            <span>운수대통 시작하기</span>
            <ArrowRight size={15} />
          </button>
          <p className="text-[9px] text-center text-muted-foreground/80 leading-relaxed font-sans">
            본 플랫폼은 기사의 건강과 수익의 완벽한 밸런스를 보장합니다.<br />
            © 2026 UNSU Platform Inc. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
