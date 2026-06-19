import { Outlet } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';

export function AppLayout() {
  return (
    <div className="relative min-h-[100dvh] bg-background">
      <TopAppBar />
      
      {/* 
        상단 TopAppBar 높이(4rem) + 하단 BottomNavBar 높이(5rem) 고려하여 패딩 설정
        pb-safe는 아이폰 하단 홈 인디케이터 여백 고려
      */}
      <main className="pt-16 pb-24 min-h-[100dvh] w-full max-w-2xl mx-auto overflow-x-hidden">
        <Outlet />
      </main>

      <BottomNavBar />
    </div>
  );
}
