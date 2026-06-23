import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import { FloatingChatbot } from '../chat/FloatingChatbot';
import { IntroSplash } from './IntroSplash';
import { FloatingSOSButton } from './FloatingSOSButton';
import { Sparkles } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Scroll to top on page navigation
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  // Touch Swipe Gesture Variables
  const routes = ['/', '/gpan', '/board', '/autopilot'];
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);

  const minSwipeDistanceX = 60; 
  const maxSwipeDistanceY = 40; 

  // Splash Screen State (Show only for non-onboarded visitors)
  const [showSplash, setShowSplash] = useState(() => {
    const profile = localStorage.getItem('driverProfile');
    return !profile;
  });

  // Global Quote Toast Notification States
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastTimeoutId, setToastTimeoutId] = useState<any>(null);

  const triggerQuoteToast = (message: string) => {
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }
    setToastMessage(message);
    setShowToast(true);
    const id = setTimeout(() => {
      setShowToast(false);
    }, 4500); // 명언은 천천히 읽을 수 있게 4.5초 노출
    setToastTimeoutId(id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEndX(touch.clientX);
    setTouchEndY(touch.clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - touchEndY);
    
    if (diffY > maxSwipeDistanceY) {
      return; 
    }
    
    const isLeftSwipe = diffX > minSwipeDistanceX;
    const isRightSwipe = diffX < -minSwipeDistanceX;
    
    const currentPath = window.location.pathname;
    const currentIndex = routes.indexOf(currentPath);
    
    if (currentIndex !== -1) {
      if (isLeftSwipe) {
        const nextIndex = (currentIndex + 1) % routes.length;
        navigate(routes[nextIndex]);
      } else if (isRightSwipe) {
        const prevIndex = (currentIndex - 1 + routes.length) % routes.length;
        navigate(routes[prevIndex]);
      }
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
  };

  return (
    <div className="min-h-[100dvh] bg-secondary/30 flex justify-center overflow-x-hidden">
      {/* 모바일 뷰어 프레임 컨테이너 */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full max-w-md bg-background min-h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.08)] border-x border-border/40 flex flex-col justify-between ${
          showSplash ? 'h-[100dvh] overflow-hidden' : ''
        }`}
      >
        {/* 1. Intro Splash Screen Overlay (모바일 프레임 내부로 격리) */}
        {showSplash && <IntroSplash onClose={() => setShowSplash(false)} />}

        {/* 프리미엄 격자선 배경 */}
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.12] z-0" />
        
        <TopAppBar onTriggerToast={triggerQuoteToast} />
        
        <main className="pt-16 pb-24 min-h-[calc(100dvh-10rem)] w-full overflow-x-hidden relative z-10 flex-1">
          <Outlet />
        </main>

        <BottomNavBar />

        {/* 2. Global Premium Quote Toast Message Alert */}
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] w-full max-w-[340px] px-4 transition-all duration-500 ease-in-out ${
            showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="bg-card/95 backdrop-blur-md border border-gold/40 p-4 rounded-xl shadow-[0_12px_32px_rgba(224,180,92,0.18)] flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Sparkles size={13} className="text-gold" />
            </div>
            <div className="space-y-1 flex-1">
              <span className="mono-label text-[8px] text-gold font-black tracking-widest block">TODAY'S DRIVER QUOTE</span>
              <p className="text-xs font-semibold text-foreground leading-relaxed break-words">
                "{toastMessage}"
              </p>
            </div>
          </div>
        </div>

        {/* Global Floating SOS Button */}
        <FloatingSOSButton />

        {/* [Task 21] 독립 캡슐화 처리된 플로팅 챗봇 단일 인스턴스 탑재 */}
        <FloatingChatbot />
      </div>
    </div>
  );
}
