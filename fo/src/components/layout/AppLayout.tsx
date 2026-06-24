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

  // Global Audio/Speech Unlock for Mobile Autoplay Policies
  useEffect(() => {
    let unlocked = false;
    const unlockAudio = () => {
      if (unlocked) return;
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
      }
      unlocked = true;
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Touch Swipe Gesture Variables
  const routes = ['/', '/gpan', '/board', '/autopilot'];
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);

  const minSwipeDistanceX = 60; 
  const maxSwipeDistanceY = 40; 

  // Splash Screen State (Show once per session, navigate to daily routine on close)
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });



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
        {showSplash && <IntroSplash onClose={() => {
          sessionStorage.setItem('hasSeenSplash', 'true');
          setShowSplash(false);
          navigate('/');
        }} />}

        {/* 프리미엄 격자선 배경 */}
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.12] z-0" />
        
        <TopAppBar />
        
        <main className="pt-16 pb-24 min-h-[calc(100dvh-10rem)] w-full overflow-x-hidden relative z-10 flex-1">
          <Outlet />
        </main>

        <BottomNavBar />



        {/* Global Floating SOS Button */}
        <FloatingSOSButton />

        {/* [Task 21] 독립 캡슐화 처리된 플로팅 챗봇 단일 인스턴스 탑재 */}
        <FloatingChatbot />
      </div>
    </div>
  );
}
