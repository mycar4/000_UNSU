import React, { useState, useEffect } from 'react';
import { Play, Square, Radio, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DBHotZone {
  id: number;
  zone_name: string;
  latitude: number;
  longitude: number;
  status: 'HIGH' | 'NORMAL' | 'LOW';
  wait_minutes: number;
  description: string;
}

export function GPanRadarPage() {
  const { setIsOnDuty } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [hotZones, setHotZones] = useState<Array<{ id: number; name: string; status: string; time: string; detail: string }>>([
    { id: 1, name: '강남역 사거리', status: '수요 폭증', time: '대기 15분', detail: '기상 악화로 현재 강남 일대 택시 수요가 평소 대비 230% 급증하고 있습니다.' },
    { id: 2, name: '김포공항 국내선', status: '도착 승객 집중', time: '대기 5분', detail: '제주발 항공기 3편이 연속 연착되어 입국장에 승객 대기열이 길게 형성되어 있습니다.' }
  ]);

  const fetchHotZones = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/gpan/hotzones`);
      if (res.ok) {
        const data: DBHotZone[] = await res.json();
        const mapped = data.map(z => ({
          id: z.id,
          name: z.zone_name,
          status: z.status === 'HIGH' ? (z.id === 2 ? '도착 승객 집중' : '수요 폭증') : z.status === 'LOW' ? '여유' : '정상',
          time: `대기 ${z.wait_minutes}분`,
          detail: z.description
        }));
        setHotZones(mapped);
        setIsOffline(false);
        localStorage.setItem('cached_hotzones', JSON.stringify(mapped));
      } else {
        throw new Error('API server unreachable');
      }
    } catch (err) {
      console.error('Failed to fetch hot zones:', err);
      setIsOffline(true);
      const cached = localStorage.getItem('cached_hotzones');
      if (cached) {
        try {
          setHotZones(JSON.parse(cached));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const getDynamicBroadcastText = () => {
    if (hotZones.length === 0) {
      return '운수대통 실시간 에이 아이 관제 방송입니다. 현재 수집된 실시간 핫존 정보가 없습니다.';
    }
    let text = '운수대통 실시간 에이 아이 관제 방송입니다. ';
    hotZones.forEach((zone) => {
      const waitMin = zone.time.replace(/[^0-9]/g, '');
      text += `현재 ${zone.name}은 ${zone.status} 상태이며, 예상 대기 시간은 ${waitMin}분입니다. ${zone.detail} `;
    });
    text += '기사님들께서는 안전 운행에 참고하시기 바랍니다.';
    return text;
  };

  // Sync ON AIR playing state with the top app bar's ON DUTY badge
  useEffect(() => {
    setIsOnDuty(isPlaying);
    return () => {
      setIsOnDuty(false);
    };
  }, [isPlaying, setIsOnDuty]);

  // Load voices for SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Initialize and load hot zones from DB
  useEffect(() => {
    fetchHotZones();
    const now = new Date();
    setLastUpdateTime(now.toTimeString().split(' ')[0]);
  }, []);

  const getBestKoFemaleVoice = () => {
    const koVoices = voices.filter(v => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
    if (koVoices.length === 0) return null;
    
    // Preferred order: Yuna/Seoyeon (macOS/iOS), Heami/SunHi (Windows), Google 한국어 (Chrome)
    const preferredNames = ['yuna', 'seoyeon', 'heami', 'google', 'hana', 'sunhi', 'narae'];
    for (const name of preferredNames) {
      const found = koVoices.find(v => v.name.toLowerCase().includes(name));
      if (found) return found;
    }
    return koVoices[0];
  };

  useEffect(() => {
    if (isPlaying && !isMuted) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Reset previous speech
        const broadcastText = getDynamicBroadcastText();
        const utterance = new SpeechSynthesisUtterance(broadcastText);
        utterance.lang = 'ko-KR';
        
        const bestVoice = getBestKoFemaleVoice();
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
        // Softer, calmer speech profile adjustments
        utterance.rate = 0.86; // Slightly slower for editorial clarity and softness
        utterance.pitch = 0.98; // Softer pitch to make it feel less squeaky/mechanical
        
        utterance.onend = () => {
          setIsPlaying(false); // Disable playing state when broadcast finishes
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('이 브라우저는 Web Speech API를 지원하지 않습니다.');
      }
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop speaking immediately
      }
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, isMuted, voices, hotZones]);

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      // Randomize wait times slightly and sync with database
      await Promise.all(
        hotZones.map(zone => {
          const baseMinutes = zone.id === 1 ? 15 : 5;
          const diff = Math.floor(Math.random() * 7) - 3; // -3 to +3
          const randMinutes = Math.max(2, baseMinutes + diff);
          return fetch(`${API_HOST}/api/gpan/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: zone.id, waitMinutes: randMinutes })
          });
        })
      );
      await fetchHotZones();
      setIsOffline(false);
    } catch (err) {
      console.error('Failed to update hot zones:', err);
      setIsOffline(true);
      // Update local state only if server is offline
      setHotZones(prevZones => prevZones.map(zone => {
        const baseMinutes = zone.id === 1 ? 15 : 5;
        const diff = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const randMinutes = Math.max(2, baseMinutes + diff);
        return {
          ...zone,
          time: `대기 ${randMinutes}분`
        };
      }));
    } finally {
      setIsUpdating(false);
      const now = new Date();
      setLastUpdateTime(now.toTimeString().split(' ')[0]);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6">
      {/* 백그라운드 그리드 레이아웃 */}
      <div className="grid-lines absolute inset-0 -z-10 opacity-20" />
      
      <div className="relative px-5 flex flex-col gap-8">
        
        {/* 헤더 */}
        <header className="text-center flex flex-col gap-2">
          {isOffline ? (
            <div className="mx-auto flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 px-3 py-1 rounded-full w-fit">
              <span className="text-xs leading-none">⚠️</span>
              <span className="mono-label text-[10px] text-destructive font-extrabold">LOCAL CACHE ACTIVE</span>
            </div>
          ) : (
            <div className="mx-auto flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span className="mono-label text-[10px] text-primary font-bold">REALTIME GPS OBSERVATORY</span>
            </div>
          )}
          <h2 className="hero-head text-foreground mt-2">G-PAN RADAR</h2>
          <p className="text-body-lg text-muted-foreground">실시간 지능형 오디오 관제</p>
        </header>

        {/* 1. Zero-Touch 오디오 재생 버튼 및 조작부 */}
        <div className="flex flex-col items-center gap-6 my-4">
          <div className="relative flex items-center justify-center">
            {/* 맥동 효과 */}
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isPlaying ? 'gpan-glow scale-105' : 'bg-transparent'}`} />
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`tap relative w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 border-background shadow-xl transition-all duration-500 ${
                isPlaying 
                  ? 'bg-gold text-primary-foreground' 
                  : 'bg-card text-foreground hover:border-gold/50'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="h-14 w-14 fill-primary-foreground stroke-none animate-pulse" />
                  <span className="mono-label mt-3 font-extrabold text-[12px] tracking-widest text-primary-foreground">ON AIR</span>
                </>
              ) : (
                <>
                  <Play className="h-14 w-14 fill-foreground stroke-none ml-2" />
                  <span className="mono-label mt-3 font-extrabold text-[12px] tracking-widest text-muted-foreground">STANDBY</span>
                </>
              )}
            </button>
          </div>

          {/* 현재 오디오 방송 상태 안내판 */}
          <div className="w-full max-w-sm bg-card border border-border/80 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 overflow-hidden w-[70%]">
              <Radio size={16} className={`text-gold flex-shrink-0 ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="text-sm font-semibold truncate text-foreground">
                {isPlaying ? 'AI 추천: "김포공항 방면 올림픽대로 정체 우회..."' : '관제 방송 대기 중'}
              </div>
            </div>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="tap flex items-center justify-center p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
              title="음소거 토글"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* 2. 실시간 핫존 리스트 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-foreground">실시간 핫존 현황</h3>
            <div className="flex items-center gap-2.5">
              {lastUpdateTime && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  최근 업데이트 {lastUpdateTime}
                </span>
              )}
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="tap flex items-center gap-1.5 px-3 py-1 bg-secondary text-foreground border border-border rounded-lg text-xs font-bold hover:bg-secondary/80 disabled:opacity-50"
              >
                <RefreshCw size={12} className={isUpdating ? 'animate-spin' : ''} />
                <span>업데이트</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {hotZones.map((zone) => (
              <div 
                key={zone.id} 
                className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:border-gold/30 flex flex-col gap-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                    {zone.name}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs bg-gold/10 text-gold px-2.5 py-0.5 rounded-full font-bold border border-gold/15">
                      {zone.status}
                    </span>
                    <span className="text-[11px] mono-label text-muted-foreground font-bold">
                      {zone.time}
                    </span>
                  </div>
                </div>
                <p className="text-body-lg text-muted-foreground">
                  {zone.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

