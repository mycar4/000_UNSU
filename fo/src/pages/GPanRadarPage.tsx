import React, { useState, useEffect } from 'react';
import { Play, Square, Radio, Volume2, VolumeX, RefreshCw, Navigation } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { openNavigationApp } from '../utils/naviLink';
import { useNavigate } from 'react-router-dom';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// TTS 시간 낭독 시 '22:00' -> '22시00분'으로 자연스럽게 치환하는 헬퍼 함수
const formatTimeToKoreanSpeech = (text: string) => {
  return text.replace(/(\d{1,2}):(\d{2})/g, '$1시 $2분');
};

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
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [hotZones, setHotZones] = useState<Array<{ id: number; name: string; status: string; time: string; detail: string }>>([]);
  const [gpsLoading, setGpsLoading] = useState(false);

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
          detail: z.description,
          latitude: z.latitude,
          longitude: z.longitude
        }));
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const eventZones = eventsData.map((ev: any, idx: number) => ({
          id: 100 + idx,
          name: ev.location,
          status: '수요 폭증 예상',
          time: `행사 종료 ${ev.endTime}`,
          detail: `[행사알림] ${ev.eventName} 행사가 종료될 예정입니다. 대규모 택시 수요가 예상되오니 이동을 권장합니다.`,
          latitude: 37.5665, // default
          longitude: 126.9780
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
          detail: `[항공편 알림] ${f.flightName} 연착으로 인해 예상 승객 ${f.passengerCountEst}명의 택시 대기열이 부족합니다.`,
          latitude: f.airport.includes('김포') ? 37.558 : 37.460,
          longitude: f.airport.includes('김포') ? 126.802 : 126.440
        }));
        const trains = (transData.trains || []).filter((t: any) => t.surgeLevel === 'HIGH').map((t: any, idx: number) => ({
          id: 300 + idx,
          name: t.station,
          status: '대규모 하차',
          time: `도착 예정 ${t.arrivalTime}`,
          detail: `[열차 알림] ${t.trainName} 대규모 하차 발생. 역사 부근 택시 승강장 수요 폭증 예상.`,
          latitude: t.station.includes('서울역') ? 37.5546 : 37.4874,
          longitude: t.station.includes('서울역') ? 126.9706 : 127.1012
        }));

        // 지하철 막차 및 대규모 하차 교통 정보 매핑
        const currentHour = new Date().getHours();
        const isLateNight = currentHour >= 22 || currentHour < 4;
        const subways = [...(transData.seoulSubway || []), ...(transData.metroSubway || [])].map((sub: any, idx: number) => {
          const isLastTrain = isLateNight && (idx % 2 === 0);
          const status = isLastTrain ? '막차 시간대' : '대규모 하차';
          const time = sub.trainStatus || '도착 예정';
          const detail = isLastTrain
            ? `[막차 알림] ${sub.stationName}역 ${sub.lineNum} ${sub.destinationName}행 막차 도착 예정 (${time}). 막차 하차 승객들로 인해 택시 수요가 급증합니다.`
            : `[지하철 알림] ${sub.stationName}역 ${sub.lineNum} ${sub.destinationName}행 열차가 ${time}합니다. 대규모 승객 하차로 택시 수요가 예상됩니다.`;
            
          let latitude = 37.5665;
          let longitude = 126.9780;
          if (sub.stationName.includes('강남')) {
            latitude = 37.4979;
            longitude = 127.0276;
          } else if (sub.stationName.includes('잠실')) {
            latitude = 37.5133;
            longitude = 127.1001;
          } else if (sub.stationName.includes('홍대입구')) {
            latitude = 37.5568;
            longitude = 126.9238;
          } else if (sub.stationName.includes('수원')) {
            latitude = 37.2662;
            longitude = 127.0002;
          } else if (sub.stationName.includes('금정')) {
            latitude = 37.3722;
            longitude = 126.9431;
          } else if (sub.stationName.includes('인천')) {
            latitude = 37.4764;
            longitude = 126.6171;
          }
          
          return {
            id: 400 + idx,
            name: `${sub.stationName}역 (${sub.lineNum})`,
            status: status,
            time: time,
            detail: detail,
            latitude,
            longitude
          };
        });

        newHotZones = [...newHotZones, ...flights, ...trains, ...subways];
      }
      
      const limited = newHotZones.slice(0, 6);
      setHotZones(limited);
      setIsOffline(false);
      localStorage.setItem('cached_hotzones', JSON.stringify(limited));
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
      return '운수대통, 실시간 에이아이 관제 방송입니다. 현재 시간 기준 수집된 실시간 도로 핫존, 대형 행사, 또는 교통 지연 정보가 존재하지 않습니다. 전 구간 원활한 소통 상태이오니 안전 운행에 유의하시기 바랍니다.';
    }
    let text = '운수대통, 실시간 에이아이 관제 방송입니다. ';
    hotZones.forEach((zone) => {
      if (zone.time.includes(':')) {
        const formattedTime = formatTimeToKoreanSpeech(zone.time);
        text += `현재, ${zone.name}은, ${zone.status} 상태이며, ${formattedTime} 입니다. ${zone.detail} `;
      } else if (zone.time.includes('대기') || (/\d/.test(zone.time) && !zone.time.includes(':'))) {
        const waitMin = zone.time.replace(/[^0-9]/g, '');
        text += `현재, ${zone.name}은, ${zone.status} 상태이며, 예상 대기 시간은, 약 ${waitMin}분입니다. ${zone.detail} `;
      } else {
        text += `현재, ${zone.name}은, ${zone.status} 상태이며, 상황은 ${zone.time} 입니다. ${zone.detail} `;
      }
    });
    text += '기사님들께서는, 오늘도 안전 운행에, 각별히 참고하시기 바랍니다.';
    return formatTimeToKoreanSpeech(text);
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
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getAiRecommendationText = () => {
    if (hotZones.length > 0) {
      const topZone = hotZones[0];
      return `AI 추천: "${topZone.name} 방면 ${topZone.status} 감지. 이동 권장."`;
    }
    return 'AI 추천: "실시간 도로 핫존을 모니터링 중입니다."';
  };

  const handleGpsHotZoneCall = async () => {
    if (!isOnDuty) {
      alert('영업 상태(ON DUTY)일 때만 근거리 핫존 호출이 가능합니다.');
      return;
    }
    
    // Stop other speech and play voice guidance via TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      
      const announceText = '본 서비스는 유료 서비스입니다. 기사님의 현재 위치를 기반으로 실시간 근거리 핫존을 호출합니다.';
      const utterance = new SpeechSynthesisUtterance(announceText);
      utterance.lang = 'ko-KR';
      const bestVoice = getBestKoFemaleVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      utterance.volume = 1.0;
      utterance.rate = 0.9;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    }
    setIsPlaying(false);

    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const driverId = localStorage.getItem('driverId') || 'system';
            const res = await fetch(`${API_HOST}/api/gpan/gpt-hotzones`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                driverId
              })
            });
            if (res.ok) {
              const data = await res.json();
              const mapped = data.map((z: any) => ({
                id: z.id,
                name: z.zone_name,
                status: z.status === 'HIGH' ? '수요 폭증' : '정상',
                time: `대기 ${z.wait_minutes}분`,
                detail: z.description,
                latitude: z.latitude,
                longitude: z.longitude
              }));
              const limited = mapped.slice(0, 6);
              setHotZones(limited);
              
              // GPS 기반 근거리 호출 성공 시 최근 업데이트 시간 동적 갱신
              const now = new Date();
              setLastUpdateTime(now.toTimeString().split(' ')[0]);
            } else {
              throw new Error('GPT Hotzones fetch failed');
            }
          } catch (err) {
            console.error(err);
            alert('근거리 핫존 호출에 실패했습니다. 기본 핫존 정보를 로드합니다.');
            fetchHotZones();
          } finally {
            setGpsLoading(false);
          }
        },
        (err) => {
          console.error(err);
          alert('GPS 위치 권한이 필요합니다.');
          setGpsLoading(false);
        },
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
      );
    } else {
      alert('이 브라우저는 GPS를 지원하지 않습니다.');
    }
  };

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
    <div className="relative min-h-[calc(100vh-4rem)] pb-6 pt-3 animate-slide-in-right">
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

                    if (!isPlaying) {
                      setIsPlaying(true);
                      if (!isMuted && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        // [Android/Chrome 트러블슈팅] 모바일 환경에서 TTS 엔진이 중단(stuck)되는 현상을 방지하기 위해 강제 resume 호출
                        window.speechSynthesis.resume();
                        
                        const broadcastText = getDynamicBroadcastText();
                        const utterance = new SpeechSynthesisUtterance(broadcastText);
                        utterance.lang = 'ko-KR';
                        const bestVoice = getBestKoFemaleVoice();
                        if (bestVoice) {
                          utterance.voice = bestVoice;
                        }
                        utterance.volume = 1.0; // 모바일 볼륨 확보
                        utterance.rate = 0.88;
                        utterance.pitch = 1.02;
                        utterance.onend = () => setIsPlaying(false);
                        utterance.onerror = (e) => {
                          console.error('TTS Error:', e);
                          setIsPlaying(false);
                        };
                        window.speechSynthesis.speak(utterance);
                      }
                    } else {
                      setIsPlaying(false);
                      if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                    }
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
                  const hasProfile = !!localStorage.getItem('driverProfile');
                  if (!hasProfile) {
                    alert("기사 프로필(회원가입)을 등록한 후 이용해 주세요.");
                    navigate('/onboarding');
                    return;
                  }
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
                {isPlaying ? getAiRecommendationText() : '관제 방송 대기 중 (STANDBY)'}
              </div>
            </div>
          </div>

          {/* GPS 기반 근거리 핫존 호출 버튼 */}
          <button
            onClick={handleGpsHotZoneCall}
            disabled={gpsLoading}
            className={`tap w-full py-4.5 bg-gradient-to-r from-gold to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2.5 border border-gold/40 hover:opacity-95 cursor-pointer ${gpsLoading ? 'animate-pulse opacity-70' : ''}`}
          >
            <Navigation size={16} className="animate-pulse" />
            {gpsLoading ? 'GPS 위치 기반 근거리 핫존 조회 중...' : 'GPS 기반 근거리 핫존 호출'}
          </button>
        </div>

        {/* 2. 실시간 핫존 리스트 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-foreground">실시간 핫존 현황</h3>
            <div className="flex items-center gap-2.5">
              {lastUpdateTime && (
                <span className="text-xs font-bold text-gold bg-gold/10 border border-gold/30 px-2.5 py-1.5 rounded-lg shadow-sm font-mono flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  최근 업데이트 {lastUpdateTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {!isOnDuty ? (
              <div className="bg-card border border-dashed border-border/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                <VolumeX className="h-10 w-10 text-muted-foreground/60" />
                <h4 className="font-bold text-lg text-foreground mt-1">출근 전 (OFF DUTY) 상태입니다</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  상단의 <strong className="text-primary">영업 시작하기</strong> 버튼을 눌러<br/>
                  ON DUTY 상태로 전환해야 실시간 데이터를 수신할 수 있습니다.
                </p>
              </div>
            ) : hotZones.length > 0 ? (
              hotZones.map((zone) => (
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
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-body-lg text-muted-foreground flex-1">
                      {zone.detail}
                    </p>
                    <button
                      onClick={() => {
                        const lat = (zone as any).latitude || '37.5665';
                        const lon = (zone as any).longitude || '126.9780';
                        openNavigationApp('TMAP', zone.name, String(lat), String(lon));
                      }}
                      className="tap p-2.5 bg-primary text-primary-foreground border border-primary/20 rounded-xl font-bold flex items-center justify-center shrink-0 hover:bg-primary/90 cursor-pointer"
                      title="티맵 길안내 전송"
                    >
                      <Navigation size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card border border-dashed border-border/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                <VolumeX className="h-10 w-10 text-muted-foreground/60 animate-pulse" />
                <h4 className="font-bold text-lg text-foreground mt-1">실시간 핫존 정보 없음</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  현재 시간 <span className="font-mono text-gold font-bold">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span> 기준<br/>
                  제공되는 실시간 핫존 정보가 존재하지 않습니다.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
