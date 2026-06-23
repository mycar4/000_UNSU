import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Sunset, Moon, User } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TopAppBarProps {
  onTriggerToast: (message: string) => void;
}

export function TopAppBar({ onTriggerToast }: TopAppBarProps) {
  const { theme, setTheme, isOnDuty } = useTheme();
  const navigate = useNavigate();

  const handleDutyClick = async () => {
    if (isOnDuty) {
      try {
        const res = await fetch(`${API_HOST}/api/global/quotes`);
        if (res.ok) {
          const data = await res.json();
          onTriggerToast(data.quote || '오늘도 안전운전 하세요!');
        }
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        onTriggerToast('길은 잃어도 사람은 잃지 말자. 오늘도 안전운전!');
      }
    }
    navigate('/darkside');
  };

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-16 bg-background/80 backdrop-blur-md border-b border-border/60 z-50 flex items-center justify-between px-5 transition-colors duration-500 shadow-sm shadow-black/5">
      <div 
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 cursor-pointer shrink-0"
      >
        <div className="flex flex-col font-black text-xl leading-[1.15] tracking-tighter text-foreground border-r border-border/80 pr-2.5">
          <span>운수</span>
          <span>대통</span>
        </div>
        <span className="mono-label text-[9px] text-gold font-bold tracking-widest">AI PLATFORM</span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* 테마 컨트롤러 (단일 순환 토글) */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (theme === 'day') setTheme('sunset');
            else if (theme === 'sunset') setTheme('night');
            else setTheme('day');
          }} 
          className="tap p-2 rounded-full bg-secondary text-foreground hover:bg-secondary/80 border border-border flex items-center justify-center"
          title={`현재 테마: ${theme === 'day' ? '낮' : theme === 'sunset' ? '노을' : '밤'} (클릭 시 변경)`}
        >
          {theme === 'day' ? <Sun size={16} /> : theme === 'sunset' ? <Sunset size={16} /> : <Moon size={16} />}
        </button>

        {/* 운행 상태 뱃지 */}
        <div 
          onClick={handleDutyClick}
          className="cursor-pointer select-none"
          title="클릭 시 '달의 뒷편'(휴식 가이드) 페이지로 이동합니다."
        >
          {isOnDuty ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 hover:border-gold/60 transition-colors animate-[pulse_1.8s_infinite] shadow-[0_0_8px_rgba(224,180,92,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="mono-label text-[9px] text-gold font-extrabold">ON DUTY</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <span className="mono-label text-[9px] text-muted-foreground font-bold">OFF DUTY</span>
            </div>
          )}
        </div>

        {/* 프로필 설정 이동 버튼 */}
        <button
          onClick={() => navigate('/onboarding')}
          className="tap p-2 rounded-full bg-secondary text-foreground hover:bg-secondary/80 border border-border flex items-center justify-center"
          title="기사 프로필 설정"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
