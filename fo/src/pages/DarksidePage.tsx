import React, { useEffect, useState, useRef } from 'react';
import { Moon, Sun, MapPin, Calendar, Coffee, Sparkles, Navigation, Zap } from 'lucide-react';
import { openNavigationApp } from '../utils/naviLink';
import { useTheme } from '../contexts/ThemeContext';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function DarksidePage() {
  const { setIsOnDuty } = useTheme();
  const [isRestMode, setIsRestMode] = useState(() => {
    return localStorage.getItem('isRestMode') === 'true';
  });
  
  const [briefing, setBriefing] = useState<string>('');
  const [destination, setDestination] = useState<{ name: string; address: string; desc: string } | null>(null);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [region, setRegion] = useState<string>('서울특별시');
  const [quote, setQuote] = useState<string>('');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [destCoords, setDestCoords] = useState<{lat: string, lon: string}>({ lat: '37.5665', lon: '126.9780' });

  // 카카오 맵 초기화 및 주소 좌표 변환
  useEffect(() => {
    if (destination && mapRef.current) {
      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps || !kakao.maps.services) {
        console.warn('Kakao maps SDK not loaded.');
        return;
      }

      kakao.maps.load(() => {
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(destination.address, (result: any, status: any) => {
          if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            setDestCoords({ lat: result[0].y, lon: result[0].x }); // 티맵 연동을 위한 실제 좌표 저장
            
            const options = { center: coords, level: 3 };
            const map = new kakao.maps.Map(mapRef.current, options);
            
            const marker = new kakao.maps.Marker({ map, position: coords });
            
            const infowindow = new kakao.maps.InfoWindow({
              content: `<div style="padding:5px;font-size:12px;font-weight:bold;color:#333;width:150px;text-align:center;">${destination.name}</div>`
            });
            infowindow.open(map, marker);
          }
        });
      });
    }
  }, [destination]);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/global/quotes`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data.quote);
      }
    } catch (err) {
      console.warn('Failed to fetch quote:', err);
      setQuote('길은 잃어도 사람은 잃지 말자. 오늘도 안전운전!');
    }
  };

  const fetchDarksideData = async () => {
    setIsLoading(true);
    try {
      const driverId = localStorage.getItem('driverId') || '';
      
      // Fetch profile first to get navi preference
      const profileRes = await fetch(`${API_HOST}/api/routine/${driverId}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
      }

      const res = await fetch(`${API_HOST}/api/external/darkside`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driverId })
      });

      if (res.ok) {
        const data = await res.json();
        setBriefing(data.briefing);
        setDestination(data.destination);
        setWeather(data.weather);
        setEvents(data.events);
        if (data.region) {
          setRegion(data.region);
        }
      }
    } catch (e) {
      console.error('Failed to load Darkside API:', e);
      setBriefing('김 기사님, 무선 연결 상태가 약해 기본 힐링 문구를 불러왔어요. 오늘은 한적한 [홍릉수목원]에 가셔서 시원한 피톤치드 공기를 마시며 주행 피로를 날려보시는 건 어떨까요?');
      setDestination({
        name: '국립 홍릉수목원',
        address: '서울 동대문구 회기로 57',
        desc: '도심 속에서 한적하게 숲길을 걸으며 희귀 식물을 조망하고 사색에 잠길 수 있는 산책로입니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  useEffect(() => {
    if (isRestMode) {
      fetchDarksideData();
    }
  }, [isRestMode]);

  const toggleRestMode = (mode: boolean) => {
    setIsRestMode(mode);
    localStorage.setItem('isRestMode', String(mode));
    setIsOnDuty(!mode);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6 animate-slide-in-right">
      {/* Premium backgrounds */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[50%] dot-field" />

      <div className="relative px-5 flex flex-col gap-8">
        
        {/* Title */}
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-foreground opacity-60" />
            <span className="mono-label text-[10px] text-muted-foreground font-bold">LIFE AFTER THE WHEEL</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-0.5 flex items-center gap-2">
            <Moon className="h-7 w-7 text-gold fill-gold/10 animate-[pulse_3s_infinite_ease-in-out]" />
            달의 뒷편
          </h2>
          <p className="text-body-lg text-muted-foreground/90">
            운행을 멈추고 쉬어가는 날, 기사님의 건강한 충전을 돕는 힐링 가이드입니다.
          </p>
        </header>

        {/* Mode Toggle Swinger */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-2.5 flex-nowrap overflow-hidden">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-muted-foreground font-bold block mb-1">현재 상태 설정</span>
            <span className="text-sm xs:text-base font-extrabold text-foreground flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
              {isRestMode ? (
                <>
                  <Coffee className="h-4 w-4 text-rose-500 fill-rose-500/10 shrink-0" />
                  <span className="truncate">오늘은 기분 좋은 쉬는 날!</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500/10 shrink-0" />
                  <span className="truncate">힘차게 일하는 날</span>
                </>
              )}
            </span>
          </div>
          <div className="flex bg-secondary p-0.5 rounded-xl border border-border/85 flex-shrink-0">
            <button
              onClick={() => toggleRestMode(false)}
              className={`tap px-2.5 py-1.5 xs:px-4 xs:py-2 rounded-lg text-[10px] xs:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                !isRestMode 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="inline-block h-3 w-3 mr-0.5 -mt-0.5" />
              영업 중
            </button>
            <button
              onClick={() => toggleRestMode(true)}
              className={`tap px-2.5 py-1.5 xs:px-4 xs:py-2 rounded-lg text-[10px] xs:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isRestMode 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="inline-block h-3 w-3 mr-0.5 -mt-0.5" />
              휴식 중
            </button>
          </div>
        </section>

        {/* 오늘의 힐링 한마디 (명언) 카드 */}
        {quote && (
          <div className="bg-gold/5 border border-gold/30 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden transition-all duration-300 hover:border-gold/50">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gold/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-gold animate-pulse shrink-0" />
              <span className="mono-label text-[9px] text-gold font-extrabold tracking-widest block">TODAY'S HEALING QUOTE</span>
            </div>
            <p className="text-base xs:text-lg font-bold text-foreground leading-relaxed font-sans italic text-center py-1">
              "{quote}"
            </p>
          </div>
        )}

        {/* Dynamic Display based on Mode */}
        {!isRestMode ? (
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center space-y-4 animate-fade-in">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Sun className="h-6 w-6 text-gold animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-foreground">오늘도 대통(운수대통)하세요!</h3>
              <p className="text-body-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
                현재 영업 상태로 운행 중이십니다. 열정적으로 일하시는 기사님을 응원합니다. 퇴근하시거나 쉬는 날이 되시면 '휴식 중'으로 전환해 보세요.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-16 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-muted-foreground font-bold">대통이가 기사님의 사주와 날씨에 최적화된 휴식지를 찾는 중...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            
            {/* AI Rest Briefing */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-gold/50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="mono-label text-[11px] text-foreground/90 font-extrabold tracking-wider bg-secondary px-2.5 py-0.5 rounded border border-border">대통이의 힐링 조언</span>
                  {region && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold border border-primary/20 flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" />
                      {region} {weather && `(${weather.temp}°C, ${weather.condition})`}
                    </span>
                  )}
                </div>
                <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-bold border border-gold/20 flex items-center gap-1">
                  <Sparkles size={12} className="animate-pulse" />
                  쉬어가기 딱 좋은 날
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-foreground">
                  "기사님을 위한 오늘의 힐링 편지"
                </h3>
                <p className="text-body-lg text-muted-foreground leading-relaxed">
                  {briefing}
                </p>
              </div>
            </section>

            {/* Recommended Destination Card */}
            {destination && (
              <section className="bg-secondary/30 border border-border/80 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="mono-label text-[11px] text-primary font-extrabold tracking-wider bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">추천 힐링 목적지</span>
                    <Coffee className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-1.5 mt-1">
                    <MapPin className="h-5 w-5 text-gold shrink-0" />
                    {destination.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">주소: {destination.address}</p>
                  <p className="text-body-lg text-muted-foreground mt-1">
                    {destination.desc}
                  </p>
                </div>

                {/* 카카오 지도 영역 */}
                <div 
                  ref={mapRef} 
                  className="w-full h-48 rounded-xl border border-border shadow-inner bg-card overflow-hidden" 
                />

                <div>
                  <button 
                    onClick={() => {
                      const pref = profile?.naviPreference || 'TMAP';
                      openNavigationApp(pref, destination.name, destCoords.lat, destCoords.lon);
                    }}
                    className="tap w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow hover:bg-primary/95"
                  >
                    목적지 {profile?.naviPreference === 'KAKAONAVI' ? '카카오네비' : '티맵'} 전송
                    <Navigation className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}

            {/* Today's Crowd Warnings */}
            {events.length > 0 && (
              <section className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">⚠️ 오늘은 이곳을 피해 쉬세요 (혼잡 구역)</h3>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid gap-3.5">
                  {events.map((ev, i) => (
                    <div key={i} className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 flex justify-between items-center gap-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground">{ev.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.venue} (종료예정: {ev.endTime})</p>
                      </div>
                      <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded font-bold border border-rose-500/20 whitespace-nowrap">
                        약 {Math.round(ev.expectedAttendees / 1000)}천명 혼잡
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
