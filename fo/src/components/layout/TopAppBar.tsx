import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Sunset, Moon, User, MapPin } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function TopAppBar() {
  const { theme, setTheme, isOnDuty } = useTheme();
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>('위치 파악 중...');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`${API_HOST}/api/location/reverse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            })
          });
          if (res.ok) {
            const data = await res.json();
            setAddress(data.fullAddress || data.region || '알 수 없는 위치');
          } else {
            setAddress('위치 변환 실패');
          }
        } catch (err) {
          setAddress('위치 서버 오류');
        }
      }, () => {
        setAddress('위치 권한 없음');
      });
    } else {
      setAddress('GPS 미지원');
    }
  }, []);

  const handleDutyClick = () => {
    const hasProfile = !!localStorage.getItem('driverProfile');
    if (!hasProfile) {
      alert("기사 프로필(회원가입)을 등록한 후 이용해 주세요.");
      navigate('/onboarding');
      return;
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
        <div className="flex flex-col gap-0.5">
          <span className="mono-label text-[9px] text-gold font-bold tracking-widest">AI PLATFORM</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin size={10} /> {address}</span>
        </div>
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
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold text-slate-950 hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(212,163,89,0.4)] border border-gold/50 animate-[pulse_2s_infinite]">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="mono-label text-[11px] font-black tracking-wider">ON DUTY</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-secondary border border-border text-muted-foreground font-bold hover:bg-secondary/80 transition-colors">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="mono-label text-[11px] font-bold tracking-wider">OFF DUTY</span>
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
