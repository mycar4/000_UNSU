import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Navigation, Newspaper, ArrowRight, UserPlus, MapPin, Compass, AlertTriangle, Moon, ThumbsUp, ThumbsDown, Car, Activity } from 'lucide-react';
import { openNavigationApp } from '../utils/naviLink';
import { LuckyCard } from '../components/dashboard/LuckyCard';
import { useTheme } from '../contexts/ThemeContext';

const formatProfileBirthDate = (birthDateString: string) => {
  const parts = birthDateString.split('-');
  if (parts.length === 3) {
    const yy = parts[0].slice(-2);
    const mm = parts[1];
    return `${yy}년${mm}월`;
  }
  return birthDateString;
};

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fortuneGradeMap: Record<string, string> = {
  'BEST': '최상',
  'GOOD': '상',
  'NORMAL': '우수',
  'BAD': '평온',
  '최상': '최상',
  '상': '상',
  '우수': '우수',
  '평온': '평온'
};

export function GillogPage() {
  const navigate = useNavigate();
  const { isOnDuty } = useTheme();
  const hasProfile = !!localStorage.getItem('driverProfile');
  const [profile, setProfile] = useState<{ birthDate: string; birthTime: string; businessType: string; naviPreference?: string; address?: string } | null>(null);
  const [luckyCard, setLuckyCard] = useState<{ grade: string; comment: string; score?: number } | null>(null);
  const [course, setCourse] = useState<{ destinationName: string; routeSummary: string; tmapIntentUrl: string } | null>(null);
  const [region, setRegion] = useState<string>('');
  const [weather, setWeather] = useState<{ temperature: number; conditionStr: string; tempDiff?: number; isDay?: boolean; apparentTemp?: number; humidity?: number; windSpeed?: number; updatedAt?: string } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [traffic, setTraffic] = useState<any>(null);
  
  const hasVisited = !!localStorage.getItem('hasVisitedGillog');
  const [isLoading, setIsLoading] = useState<boolean>(!hasVisited);

  // Scroll to top when loading is completed
  useLayoutEffect(() => {
    if (!isLoading) {
      window.scrollTo(0, 0);
    }
  }, [isLoading]);

  const getFortune = (birthDate: string) => {
    const todayStr = new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    const combined = birthDate + todayStr;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const fortunes = [
      { grade: '최상', comment: '"서북쪽(마포/상암) 방향에서 장거리 손님을 만날 일진입니다. 평소보다 10분 일찍 시동을 켜보세요. 큰 재물이 따릅니다."' },
      { grade: '상', comment: '"동남쪽(강남/분당) 방면으로 주행 시 고단가 호출 성공률이 대폭 상승하는 귀인의 날입니다. 청담동 사거리 부근을 주시하세요."' },
      { grade: '우수', comment: '"대형 빌딩 밀집 지역(여의도/종로) 주변에서 퇴근길 콜 수요와 기가 막히게 매칭되는 날입니다. 마포대교 방면 우회로를 확보하세요."' },
      { grade: '평온', comment: '"안전한 보수 운행이 유리한 날입니다. 무리한 장거리 유혹을 삼가고 김포공항 국내선 대기열에 진입하면 안정적인 수익이 쌓입니다."' }
    ];

    const index = Math.abs(hash) % fortunes.length;
    return fortunes[index];
  };

  useEffect(() => {
    let driverId = localStorage.getItem('driverId');
    if (!driverId) {
      driverId = Math.random().toString(36).substring(7);
      localStorage.setItem('driverId', driverId);
    }

    const storedProfile = localStorage.getItem('driverProfile');
    const isOnboarded = !!storedProfile;

    // 미온보딩 기사는 AI 분석 로딩 없이 즉시 렌더링
    if (!isOnboarded) {
      setIsLoading(false);
    }

    // 날씨 데이터 독립 fetch (미온보딩 사용자용)
    const fetchWeatherOnly = (latitude?: number, longitude?: number) => {
      let url = `${API_HOST}/api/external/dashboard`;
      const params = new URLSearchParams();
      if (latitude !== undefined && longitude !== undefined) {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      fetch(url)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Weather fetch failed');
        })
        .then(data => {
          if (data.region) setRegion(data.region);
          if (data.weather) {
            setWeather({
              temperature: data.weather.temp ?? data.weather.temperature,
              conditionStr: data.weather.condition ?? data.weather.conditionStr,
              tempDiff: data.weather.tempDiff,
              isDay: data.weather.isDay,
              apparentTemp: data.weather.apparentTemp,
              humidity: data.weather.humidity,
              windSpeed: data.weather.windSpeed,
              updatedAt: data.weather.updatedAt
            });
          }
        })
        .catch(err => {
          console.warn('Failed to fetch weather only:', err);
          setRegion('서울특별시 종로구 세종대로 145-2');
          setWeather({ 
            temperature: 23.0, 
            conditionStr: '구름많음',
            tempDiff: 1.7,
            apparentTemp: 24.2,
            humidity: 70,
            windSpeed: 1.2,
            updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
          });
        });
    };

    const loadData = async (latitude?: number, longitude?: number) => {
      let url = `${API_HOST}/api/routine/${driverId}`;
      const params = new URLSearchParams();
      if (latitude !== undefined && longitude !== undefined) {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
      }
      
      const paramsFast = new URLSearchParams(params);
      paramsFast.append('skipAi', 'true');

      try {
        const resFast = await fetch(`${url}?${paramsFast.toString()}`);
        if (!resFast.ok) throw new Error('Not onboarding');
        const data = await resFast.json();
        
        setProfile(data.profile);
        setLuckyCard(data.luckyCard);
        if (data.course) setCourse(data.course);
        if (data.region) setRegion(data.region);
        if (data.weather) setWeather(data.weather);
        if (data.events) setEvents(data.events);
        if (data.traffic) setTraffic(data.traffic);
        
        setIsLoading(false);
        localStorage.setItem('hasVisitedGillog', 'true');

        const paramsAi = new URLSearchParams(params);
        paramsAi.append('skipAi', 'false');
        
        const resAi = await fetch(`${url}?${paramsAi.toString()}`);
        if (resAi.ok) {
          const dataAi = await resAi.json();
          if (dataAi.luckyCard) {
            setLuckyCard(dataAi.luckyCard);
          }
        }
      } catch (err) {
        const stored = localStorage.getItem('driverProfile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setProfile(parsed);
            if (parsed.address) {
              const addr = parsed.address.toLowerCase();
              let r = '서울특별시';
              if (addr.includes('제주')) r = '제주특별자치도';
              else if (addr.includes('부산')) r = '부산광역시';
              else if (addr.includes('인천')) r = '인천광역시';
              else if (addr.includes('대구')) r = '대구광역시';
              else if (addr.includes('광주')) r = '광주광역시';
              else if (addr.includes('대전')) r = '대전광역시';
              else if (addr.includes('울산')) r = '울산광역시';
              else r = parsed.address;
              setRegion(r);
            }
            const fortune = getFortune(parsed.birthDate);
            setLuckyCard({
              grade: fortune.grade,
              comment: fortune.comment
            });
            setCourse({
              destinationName: '김포공항 방면',
              routeSummary: '현재 올림픽대로 여의도 부근 정체가 극심하므로 가양대교 우회 경로를 추천합니다.',
              tmapIntentUrl: 'tmap://route?goalname=김포공항&goallat=37.558&goallon=126.802'
            });
            setWeather({ 
              temperature: 23.0, 
              conditionStr: '구름많음',
              tempDiff: 1.7,
              apparentTemp: 24.2,
              humidity: 70,
              windSpeed: 1.2,
              updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
            });
          } catch (e) {
            console.error(e);
          }
        }
        setIsLoading(false);
        localStorage.setItem('hasVisitedGillog', 'true');
      }
    };

    const fetchData = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            if (hasProfile) {
              loadData(lat, lon);
            } else {
              fetchWeatherOnly(lat, lon);
            }
          },
          (error) => {
            console.warn('Geolocation error, falling back to profile address:', error);
            if (hasProfile) {
              loadData();
            } else {
              fetchWeatherOnly();
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        if (hasProfile) {
          loadData();
        } else {
          fetchWeatherOnly();
        }
      }
    };

    fetchData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const feeds = [
    { t: '양도양수 리얼 꿀팁 후기', d: '개인택시 면허 양수 시 꼭 짚고 넘어가야 할 양도인 차량 대차 비용 분석.', v: '조회수 1.2만', badge: '가이드' },
    { t: '5월 부가세 환급 정산기', d: '신차 구입 매입자료 홈택스 오토파일럿 신고로 부가세 100% 환급받은 기사 실사례.', v: '조회수 8.4천', badge: '정산' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center bg-background px-6">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full border border-gold/30 bg-gold/5 shadow-[0_0_20px_rgba(212,163,89,0.1)]">
          <div className="absolute inset-1.5 rounded-full border border-dashed border-gold/40 animate-[spin_10s_linear_infinite]" />
          <Compass className="h-8 w-8 text-gold animate-[spin_20s_linear_infinite]" />
        </div>
        <h3 className="mt-6 text-lg font-black text-foreground tracking-tight">AI 운행 분석 중</h3>
        <p className="mt-2 text-xs font-bold text-muted-foreground/80 bg-secondary px-3 py-1.5 rounded-full border border-border/50 animate-pulse">
          대통이가 기사님의 사주와 실시간 교통을 융합하고 있습니다...
        </p>
      </div>
    );
  }

  const isNight = weather ? (weather.isDay === false || (weather.isDay === undefined && (new Date().getHours() < 6 || new Date().getHours() >= 18))) : false;
  
  const getWeatherEmoji = (condition: string, isNight: boolean) => {
    if (condition.includes('비')) return '🌧️';
    if (condition.includes('눈')) return '❄️';
    if (condition.includes('구름') || condition.includes('흐림')) return isNight ? '☁️' : '⛅';
    return isNight ? '🌙' : '☀️';
  };

  const weatherIcon = weather ? (
    <span className="text-[3.5rem] drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] leading-none inline-block">
      {getWeatherEmoji(weather.conditionStr, isNight)}
    </span>
  ) : null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6 animate-slide-in-right">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[60%] dot-field" />
      
      <div className="relative px-5 flex flex-col gap-8">
        
        <header className="flex flex-col gap-4 w-full">
          {/* Top Row: Date & Title / Temp & Condition */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="w-fit whitespace-nowrap text-xs xs:text-sm font-bold text-gold bg-background border border-gold/40 px-3.5 py-1 rounded-full font-mono shadow-sm">
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </span>
              <h2 className="text-[2rem] leading-tight font-black tracking-tighter text-foreground mt-1 whitespace-nowrap">
                오늘의 루틴
              </h2>
            </div>
            
            {weather && (
              <div className="flex flex-col items-end pt-1 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {weatherIcon}
                  <span className="text-[3.2rem] font-black tracking-tighter text-foreground drop-shadow-sm" style={{ lineHeight: '0.9' }}>
                    {weather.temperature.toFixed(1)}<span className="text-[2.2rem] font-bold align-top relative top-1 text-foreground/90">°</span>
                  </span>
                </div>
                <div className="text-[15px] font-semibold text-foreground/90 mt-3 flex items-center justify-end whitespace-nowrap">
                  {weather.tempDiff !== undefined && (
                    <>
                      <span>어제보다 {Math.abs(weather.tempDiff)}° {weather.tempDiff > 0 ? '↑' : weather.tempDiff < 0 ? '↓' : '-'}</span>
                      <span className="text-foreground/20 font-light px-2">/</span>
                    </>
                  )}
                  <span className="text-foreground/90">{weather.conditionStr}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row: Address Pill / Details & Update Time */}
          <div className="flex justify-between items-stretch gap-4 w-full">
            <div className="flex-1 min-w-0">
              {region && (
                <div className="h-full text-sm xs:text-base bg-secondary/80 text-foreground px-4 py-2.5 rounded-2xl font-bold border border-border/50 flex items-start gap-2 shadow-sm max-w-full">
                  <MapPin size={16} className="shrink-0 text-foreground/70 mt-0.5" />
                  <span className="whitespace-normal break-keep leading-snug line-clamp-2">{region}</span>
                </div>
              )}
            </div>
            
            {weather && (
              <div className="flex flex-col items-end justify-between flex-shrink-0 py-0.5">
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2 bg-secondary/60 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-foreground/70 shadow-inner whitespace-nowrap">
                    {weather.apparentTemp !== undefined && <span>체감 {weather.apparentTemp.toFixed(1)}°</span>}
                    {weather.humidity !== undefined && <><span className="w-1 h-1 rounded-full bg-foreground/30" /><span>습도 {weather.humidity}%</span></>}
                    {weather.windSpeed !== undefined && <><span className="w-1 h-1 rounded-full bg-foreground/30" /><span>풍속 {weather.windSpeed.toFixed(1)}m/s</span></>}
                  </div>
                </div>
                {weather.updatedAt && (
                  <div className="text-[10px] text-foreground/60 font-bold flex items-center justify-end gap-1.5 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/80 animate-pulse" />
                    {weather.updatedAt} 업데이트됨
                  </div>
                )}
              </div>
            )}
          </div>

          {!hasProfile && (
            <p className="text-body-lg text-muted-foreground/90 mt-2 font-medium">
              출근 전 가볍게 확인하세요. AI가 오늘의 운수와 최적 코스를 브리핑합니다.
            </p>
          )}
        </header>

        {!hasProfile && (
          <section className="bg-gold/10 border border-gold/40 rounded-2xl p-5 flex flex-col items-center justify-between gap-4 animate-pulse" style={{ wordBreak: 'keep-all' }}>
            <div className="flex flex-col gap-2 text-center" style={{ wordBreak: 'keep-all' }}>
              <h4 className="font-bold text-xl text-foreground" style={{ wordBreak: 'keep-all' }}>아직 마스터 프로필이 등록되지 않았습니다!</h4>
              <p className="text-body-lg text-muted-foreground" style={{ wordBreak: 'keep-all' }}>생년월일과 세무 ID를 등록해야 맞춤 사주 및 오토파일럿 정산 가동이 가능합니다.</p>
            </div>
            <button 
              onClick={() => navigate('/onboarding')}
              className="tap flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3.5 rounded-xl font-bold text-base shadow-md w-full justify-center"
            >
              <UserPlus size={18} />
              프로필 설정하러 가기
            </button>
          </section>
        )}

        <LuckyCard profile={profile} luckyCard={luckyCard} />

        {/* 영업 중일 때 영업 코스 또는 피드백 노출 */}
        {isOnDuty && (
          <section className="flex flex-col gap-4 mt-2 animate-fade-in">
            {localStorage.getItem('tmapGuidedCourseStatus') === 'guided' ? (
              // 피드백 카드
              <div className="rounded-2xl border-2 border-gold/40 bg-card p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-gold/60 flex flex-col gap-4">
                {/* 미세 도트 조명 배경 데코레이션 */}
                <div className="absolute inset-0 dot-field opacity-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none animate-pulse" />

                <div className="flex items-center justify-between border-b border-border/60 pb-3 z-10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-gold h-4.5 w-4.5 animate-pulse" />
                    <span className="mono-label text-[10px] text-gold font-black tracking-widest">FEEDBACK SURVEY</span>
                  </div>
                  <span className="text-[10px] bg-gold/10 text-gold px-2.5 py-0.5 rounded-full font-bold border border-gold/20">
                    품질 개선 참여
                  </span>
                </div>

                <div className="space-y-2 z-10">
                  <h4 className="font-extrabold text-xl text-foreground">
                    지난 추천 코스 운행은 어떠셨나요?
                  </h4>
                  <p className="text-body-lg text-muted-foreground leading-relaxed">
                    기사님께 제안해 드린 <strong className="text-foreground font-black bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20">{localStorage.getItem('tmapGuidedCourseName') || '김포공항 방면'}</strong> 코스가 유용했는지 대통이에게 피드백을 전달해 주세요.
                  </p>
                </div>

                <div className="flex gap-4 mt-2 z-10">
                  <button
                    onClick={async () => {
                      const driverId = localStorage.getItem('driverId') || 'system';
                      try {
                        await fetch(`${API_HOST}/api/routine/feedback`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ driverId, feedback: 'DAEBAK' })
                        });
                        alert('대박 피드백이 등록되었습니다! 대통이의 AI 가중치 가속에 반영됩니다.');
                      } catch (err) {
                        console.error('Failed to submit feedback:', err);
                      } finally {
                        localStorage.removeItem('tmapGuidedCourseStatus');
                        localStorage.removeItem('tmapGuidedCourseName');
                        // Force state update to refresh card
                        window.location.reload();
                      }
                    }}
                    className="tap flex-1 py-4 bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-slate-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer text-base border border-gold/30"
                  >
                    <ThumbsUp size={16} className="text-slate-950 stroke-[2.5]" />
                    대박
                  </button>
                  <button
                    onClick={async () => {
                      const driverId = localStorage.getItem('driverId') || 'system';
                      try {
                        await fetch(`${API_HOST}/api/routine/feedback`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ driverId, feedback: 'HEOTANG' })
                        });
                        alert('허탕 피드백이 등록되었습니다. 다음 추천 품질 향상에 적극 반영됩니다.');
                      } catch (err) {
                        console.error('Failed to submit feedback:', err);
                      } finally {
                        localStorage.removeItem('tmapGuidedCourseStatus');
                        localStorage.removeItem('tmapGuidedCourseName');
                        // Force state update to refresh card
                        window.location.reload();
                      }
                    }}
                    className="tap flex-1 py-4 bg-secondary/80 hover:bg-secondary text-foreground hover:text-foreground font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer text-base border border-border transition-colors"
                  >
                    <ThumbsDown size={16} className="text-muted-foreground stroke-[2.5]" />
                    허탕
                  </button>
                </div>
              </div>
            ) : (
              // 추천 코스 카드
              course && (
                course.destinationName === '실시간 추천 코스 없음' || !course.tmapIntentUrl ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center relative overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-2.5">
                      <span className="mono-label text-[10px] text-muted-foreground font-bold mb-1">AI RECOMMENDED COURSE</span>
                      <p className="text-sm font-bold text-muted-foreground mt-1.5 leading-relaxed">{course.routeSummary}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-gold/30">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="mono-label text-[10px] text-muted-foreground font-bold">AI RECOMMENDED COURSE</span>
                        <Navigation className="h-4.5 w-4.5 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-black text-foreground mt-3 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
                        {course.destinationName}
                      </h3>
                      <p className="text-body-lg text-muted-foreground mt-2 leading-relaxed">
                        {course.routeSummary}
                      </p>
                    </div>
                    <div className="mt-5">
                      <button
                        onClick={async () => {
                          const driverId = localStorage.getItem('driverId') || 'system';
                          try {
                            await fetch(`${API_HOST}/api/routine/tmap-click`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ driverId })
                            });
                          } catch (err) {
                            console.error(err);
                          }
                          localStorage.setItem('tmapGuidedCourseStatus', 'guided');
                          localStorage.setItem('tmapGuidedCourseName', course.destinationName);
                          
                          // Launch navigation app
                          window.location.href = course.tmapIntentUrl;
                        }}
                        className="tap inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-md hover:bg-primary/95 cursor-pointer"
                      >
                        티맵 안내 시작
                        <ArrowRight className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </section>
        )}

        {/* 휴식중 이미지 영역 */}
        {!isOnDuty && (
          <section className="flex flex-col gap-4 mt-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="relative w-full aspect-video bg-secondary/50 flex flex-col items-center justify-center p-6 text-center">
                <Moon className="w-12 h-12 text-gold opacity-50 mb-4 animate-[pulse_4s_infinite_ease-in-out]" />
                <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">현재 휴식 중입니다</h3>
                <p className="text-sm text-muted-foreground">
                  다음 운행을 위해 에너지를 충전하세요.<br/>
                  오늘도 안전 운전을 기원합니다.
                </p>
                {/* 사용자가 첨부한 이미지를 public 폴더에 추가하여 사용할 수 있도록 img 태그 준비 */}
                <img src="/rest.png" alt="휴식중" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            </div>
          </section>
        )}

        {!hasProfile && (
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-foreground">기사 생존 가이드</h3>
              <Newspaper className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="grid gap-4">
              {feeds.map((feed, i) => (
                <div 
                  key={i} 
                  onClick={() => alert('해당 컨텐츠는 준비 중입니다.')}
                  className="tap rounded-xl border border-border bg-card/60 p-5 hover:bg-card hover:border-foreground/20 flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-foreground/80 font-bold font-sans">{feed.v}</span>
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-bold">{feed.badge}</span>
                    </div>
                    <h4 className="font-bold text-xl text-foreground line-clamp-1 leading-snug">{feed.t}</h4>
                    <p className="text-body-lg text-muted-foreground line-clamp-2 leading-relaxed">{feed.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isOnDuty && events.length > 0 && (
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-foreground">⚠️ 오늘은 이곳을 피해 운행하세요 (혼잡 구역)</h3>
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

        {isOnDuty && (
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Car className="h-5.5 w-5.5 text-foreground/80" />
                실시간 도로 교통 정보
              </h3>
              {traffic && <Activity className={`h-5 w-5 ${traffic.status === '원활' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />}
            </div>
            {traffic ? (
              <div className="rounded-xl border border-border bg-card p-5 relative overflow-hidden transition-all duration-300 hover:border-gold/30">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="mono-label text-[10px] text-muted-foreground font-bold">{traffic.roadName} 상황</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${
                    traffic.status === '원활' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {traffic.status} ({traffic.speed} km/h)
                  </span>
                </div>
                <p className="text-body-lg font-bold text-foreground mt-3 leading-relaxed">
                  {traffic.message}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-center">
                <p className="text-sm text-muted-foreground font-semibold">현재 수집된 실시간 도로 교통 정보가 없습니다.</p>
              </div>
            )}
          </section>
        )}


      </div>
    </div>
  );
}
