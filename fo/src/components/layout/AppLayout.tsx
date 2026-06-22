import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import { FloatingChatbot } from '../chat/FloatingChatbot';

export function AppLayout() {
  const navigate = useNavigate();

  // Touch Swipe Gesture Variables
  const routes = ['/', '/gpan', '/board', '/autopilot'];
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);

  const minSwipeDistanceX = 60; 
  const maxSwipeDistanceY = 40; 

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
      if (isLeftSwipe && currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
  };

  return (
    <div className="min-h-[100dvh] bg-secondary/30 flex justify-center">
      {/* 모바일 뷰어 프레임 컨테이너 */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-md bg-background min-h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.08)] border-x border-border/40"
      >
        {/* 프리미엄 격자선 배경 */}
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.12] z-0" />
        
        <TopAppBar />
        
        <main className="pt-16 pb-24 min-h-[100dvh] w-full overflow-x-hidden relative z-10">
          <Outlet />
        </main>

        <BottomNavBar />

        {/* [Task 21] 독립 캡슐화 처리된 플로팅 챗봇 단일 인스턴스 탑재 */}
        <FloatingChatbot />
      </div>
    </div>
  );
}
