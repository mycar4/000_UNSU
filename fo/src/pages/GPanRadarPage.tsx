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
  const { isOnDuty, setIsOnDuty } = useTheme();
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
      const [dbRes, eventsRes, transportRes] = await Promise.all([
        fetch(`${API_HOST}/api/gpan/hotzones`),
        fetch(`${API_HOST}/api/external/events`),
        fetch(`${API_HOST}/api/external/transport`)
      ]);
      
      let newHotZones: any[] = [];
      if (dbRes.ok) {
        const data: DBHotZone[] = await dbRes.json();
        newHotZones = data.map(z => ({
          id: z.id,
          name: z.zone_name,
          status: z.status === 'HIGH' ? (z.id === 2 ? '도착 승객 집중' : '수요 폭증') : z.status === 'LOW' ? '여유' : '정상',
          time: `대기 ${z.wait_minutes}분`,
          detail: z.description
        }));
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const eventZones = eventsData.map((ev: any, idx: number) => ({
          id: 100 + idx,
          name: ev.location,
          status: '수요 폭증 예상',
          time: `행사 종료 ${ev.endTime}`,
          detail: `[행사알림] ${ev.eventName} 행사가 종료될 예정입니다. 대규모 택시 수요가 예상되오니 이동을 권장합니다.`
        }));
        newHotZones = [...newHotZones, ...eventZones];
      }

      if (transportRes.ok) {
        const transData = await transportRes.json();
        const flights = (transData.flights || []).filter((f: any) => f.status === '지연').map((f: any, idx: number) => ({
          id: 200 + idx,
          name: f.airport,
          status: '도착 연착 감지',
          time: `도착 예정 ${f.expectedArrivalTime}`,
          detail: `[항공편 알림] ${f.flightName} 연착으로 인해 예상 승객 ${f.passengerCountEst}명의 택시 대기열이 부족합니다.`
        }));
        const trains = (transData.trains || []).filter((t: any) => t.surgeLevel === 'HIGH').map((t: any, idx: number) => ({
          id: 300 + idx,
          name: t.station,
          status: '대규모 하차',
          time: `도착 예정 ${t.arrivalTime}`,
          detail: `[열차 알림] ${t.trainName} 대규모 하차 발생. 역사 부근 택시 승강장 수요 폭증 예상.`
        }));
        newHotZones = [...newHotZones, ...flights, ...trains];
      }
      
      setHotZones(newHotZones);
      setIsOffline(false);
      localStorage.setItem('cached_hotzones', JSON.stringify(newHotZones));
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
      return '운수대통, 실시간 에이아이 관제 방송입니다. 현재 수집된 실시간 핫존 정보가 없습니다.';
    }
    let text = '운수대통, 실시간 에이아이 관제 방송입니다. ';
    hotZones.forEach((zone) => {
      const waitMin = zone.time.replace(/[^0-9]/g, '');
      // 자연스러운 끊어 읽기를 위해 중요 정보 주변에 쉼표(,) 배치
      text += `현재, ${zone.name}은, ${zone.status} 상태이며, 예상 대기 시간은, 약 ${waitMin}분입니다. ${zone.detail} `;
    });
    text += '기사님들께서는, 오늘도 안전 운행에, 각별히 참고하시기 바랍니다.';
    return text;
  };

  // Guardrail: Automatically stop G-PAN audio broadcast if the driver switches to OFF DUTY (Rest Mode)
  useEffect(() => {
    if (!isOnDuty && isPlaying) {
      setIsPlaying(false);
    }
  }, [isOnDuty, isPlaying]);

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
        utterance.rate = 0.88; // Natural breathing pace for 시니어 가독성
        utterance.pitch = 1.02; // Warm, friendly tone
        
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
    <div className="relative min-h-[calc(100vh-4rem)] pb-6 pt-3 animate-fade-in-up">
      {/* 백그라운드 그리드 레이아웃 */}
      
      <div className="relative px-4 flex flex-col gap-4.5">
        
        {/* 헤더 */}
        <header className="text-center flex flex-col gap-0.5">
          {isOffline ? (
            <div className="mx-auto flex items-center gap-1 bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 rounded-full w-fit">
              <span className="text-[10px] leading-none">⚠️</span>
              <span className="mono-label text-[9px] text-destructive font-extrabold">LOCAL CACHE ACTIVE</span>
            </div>
          ) : (
            <div className="mx-auto flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span className="mono-label text-[9px] text-primary font-bold">REALTIME GPS OBSERVATORY</span>
            </div>
          )}
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground mt-1">G-PAN RADAR</h2>
          <p className="text-xs text-muted-foreground/80">실시간 지능형 오디오 관제</p>
        </header>

        {/* 1. Zero-Touch 프리미엄 아날로그 튜너 및 오디오 조작계 */}
        <div className="w-full max-w-md mx-auto bg-card border-2 border-border/70 rounded-2xl p-4.5 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col gap-4">
          {/* 장비 메탈릭 상단 바 및 주파수 디스플레이 */}
          <div className="flex flex-col gap-1.5 bg-background/80 border border-border/50 rounded-xl p-3 shadow-inner relative overflow-hidden">
            {/* 노이즈 효과용 도트 조명 필드 */}
            <div className="absolute inset-0 dot-field opacity-10 pointer-events-none" />
            
            <div className="flex justify-between items-center z-10">
              <span className="mono-label text-[9px] text-muted-foreground tracking-widest font-extrabold">RADIO TUNER</span>
              <span className="text-[10px] font-mono text-gold font-bold">FM 88.1 MHz</span>
            </div>
            
            {/* 주파수 눈금자 */}
            <div className="relative h-6 flex items-center justify-center overflow-hidden border-y border-border/40 my-0.5">
              <div className="absolute inset-x-0 flex justify-between px-2 text-muted-foreground/30 font-mono text-[8px] pointer-events-none select-none">
                <span>80</span>
                <span>84</span>
                <span>88</span>
                <span>92</span>
                <span>96</span>
                <span>100</span>
                <span>104</span>
              </div>
              <div className="flex items-end justify-between w-full px-6 h-4 opacity-40">
                {[...Array(19)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-[1px] rounded-full bg-foreground/60 transition-all ${
                      i % 3 === 0 ? 'h-3 bg-foreground/80' : 'h-1.5'
                    }`} 
                  />
                ))}
              </div>
              {/* 현재 주파수 지시 바늘 (골드 지시선) */}
              <div className="absolute left-[52%] -translate-x-1/2 w-0.5 h-5 bg-gold shadow-lg flex flex-col items-center justify-between">
                <div className="w-1.5 h-1.5 bg-gold rounded-full -mt-0.5" />
              </div>
            </div>

            <div className="flex justify-between items-center z-10 mt-0.5">
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-destructive animate-ping' : 'bg-muted-foreground/40'}`} />
                <span className="mono-label text-[9px] font-bold text-foreground">
                  {isPlaying ? 'ON AIR' : 'STANDBY'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground/80 font-mono">
                  SIG: 98%
                </span>
                {/* 플로팅 버튼(대통이 Talk)의 터치 영역 간섭을 피하기 위해 음소거 토글을 상단 계기판으로 이동 */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`tap p-1 rounded-md border transition-all ${
                    isMuted 
                      ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                      : 'bg-secondary/80 border-border/60 text-foreground hover:bg-secondary'
                  }`}
                  title="음소거 토글"
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* 중앙 아날로그 조작 다이얼 및 이퀄라이저 */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              {/* 아웃터 링 (맥동 및 다이얼 베젤 효과) */}
              <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isPlaying ? 'gpan-glow scale-105' : 'bg-transparent'}`} />
              
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center border-4 border-border bg-gradient-to-b from-card to-background shadow-xl p-2">
                {/* 각도 인디케이터용 점 테두리 */}
                <div className="absolute inset-1 rounded-full border border-dashed border-border/80 opacity-60" />
                
                {/* 메탈릭 링 다이얼 */}
                <button 
                  onClick={() => {
                    if (!isOnDuty) return;
                    setIsPlaying(!isPlaying);
                  }}
                  className={`tap relative w-full h-full rounded-full flex flex-col items-center justify-center border border-border/40 shadow-inner transition-all duration-500 focus:outline-hidden ${
                    !isOnDuty
                      ? 'bg-secondary/40 text-muted-foreground/55 cursor-not-allowed border-dashed border-border/60'
                      : isPlaying 
                        ? 'bg-gradient-to-br from-gold to-gold/90 text-primary-foreground border-gold/30' 
                        : 'bg-gradient-to-br from-card to-background text-foreground hover:border-gold/50'
                  }`}
                >
                  {/* 중앙 버튼 표면 입체감 */}
                  <div className={`absolute inset-1 rounded-full border border-border/10 shadow-lg pointer-events-none transition-opacity ${isPlaying ? 'opacity-20' : 'opacity-100'}`} />
                  
                  {!isOnDuty ? (
                    <>
                      <VolumeX className="h-9 w-9 text-muted-foreground/35 stroke-2" />
                      <span className="mono-label mt-2.5 font-extrabold text-[11px] tracking-widest text-muted-foreground/45">OFF DUTY</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Square className="h-9 w-9 fill-primary-foreground stroke-none animate-pulse" />
                      <span className="mono-label mt-2.5 font-extrabold text-[11px] tracking-widest text-primary-foreground">TURN OFF</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-9 w-9 fill-foreground stroke-none ml-1" />
                      <span className="mono-label mt-2.5 font-extrabold text-[11px] tracking-widest text-muted-foreground">TURN ON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 8-바 오디오 이퀄라이저 */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <span className="mono-label text-[9px] text-muted-foreground tracking-widest font-extrabold">SPECTRUM ANALYZER</span>
              <div className="flex items-end justify-center gap-1.5 h-8.5 px-5 py-1 bg-background border border-border/70 rounded-xl w-full max-w-xs shadow-inner">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-t-xs bg-gold transition-all duration-300 ${
                      isPlaying ? 'eq-bar h-full' : 'h-1.5 opacity-60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 휴식 중 경고 및 운행 시작 단축 배너 */}
          {!isOnDuty && (
            <div className="bg-destructive/5 border border-rose-500/10 rounded-xl p-3 flex flex-col gap-2 text-center">
              <p className="text-[11px] text-destructive font-bold leading-relaxed">
                ⚠️ 현재 휴식 모드(OFF DUTY) 상태입니다.<br />
                관제 방송 청취를 원하시면 아래 단축 버튼으로 출근을 등록하세요.
              </p>
              <button
                onClick={() => {
                  setIsOnDuty(true);
                  localStorage.setItem('isRestMode', 'false');
                }}
                className="tap mx-auto px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg border border-primary-foreground/10 hover:bg-primary/95 shadow-md"
              >
                ⚡ 영업 시작하기 (출근)
              </button>
            </div>
          )}

          {/* 하단 방송 상태 안내 (음소거 버튼을 상단으로 이동해 플로팅 대통이Talk 버튼과 오버랩되는 현상 원천 차단) */}
          <div className="w-full bg-background border border-border/80 rounded-2xl p-3 flex items-center gap-2.5 shadow-inner">
            <div className={`p-2 rounded-xl bg-gold/10 border border-gold/20 flex-shrink-0 ${isPlaying ? 'animate-pulse' : ''}`}>
              <Radio size={16} className="text-gold" />
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-[9px] font-mono text-muted-foreground tracking-wider font-extrabold">CURRENT BROADCAST</span>
              <div className="text-xs font-semibold truncate text-foreground leading-normal mt-0.5">
                {isPlaying ? 'AI 추천: "김포공항 방면 올림픽대로 정체 우회..."' : '관제 방송 대기 중 (STANDBY)'}
              </div>
            </div>
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
