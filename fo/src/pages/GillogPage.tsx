import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Navigation, Newspaper, ArrowRight, UserPlus } from 'lucide-react';

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
  const [profile, setProfile] = useState<{ birthDate: string; birthTime: string; businessType: string; naviPreference?: string } | null>(null);
  
  const [luckyCard, setLuckyCard] = useState<{ grade: string; comment: string } | null>(null);
  const [course, setCourse] = useState<{ destinationName: string; routeSummary: string; tmapIntentUrl: string } | null>(null);

  const getFortune = (birthDate: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
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

    fetch(`${API_HOST}/api/routine/${driverId}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not onboarding');
      })
      .then(data => {
        setProfile(data.profile);
        setLuckyCard(data.luckyCard);
        setCourse(data.course);
      })
      .catch(() => {
        const stored = localStorage.getItem('driverProfile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setProfile(parsed);
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
          } catch (e) {
            console.error(e);
          }
        }
      });
  }, []);

  const feeds = [
    { t: '양도양수 리얼 꿀팁 후기', d: '개인택시 면허 양수 시 꼭 짚고 넘어가야 할 양도인 차량 대차 비용 분석.', v: '조회수 1.2만', badge: '가이드' },
    { t: '5월 부가세 환급 정산기', d: '신차 구입 매입자료 홈택스 오토파일럿 신고로 부가세 100% 환급받은 기사 실사례.', v: '조회수 8.4천', badge: '정산' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[60%] dot-field" />
      
      <div className="relative px-5 flex flex-col gap-8">
        
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-foreground opacity-60" />
            <span className="mono-label text-[10px] text-muted-foreground font-bold">DAILY BRIEFING</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-0.5">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              오늘의 루틴
            </h2>
            <span className="text-xs sm:text-sm font-semibold text-gold bg-gold/5 border border-gold/20 px-2.5 py-1 rounded-lg font-mono mt-1 sm:mt-0 shadow-sm">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground/80 mt-1">
            출근 전 가볍게 확인하세요. AI가 오늘의 운수와 최적 코스를 브리핑합니다.
          </p>
        </header>

        {!profile && (
          <section className="bg-gold/10 border border-gold/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <h4 className="font-bold text-lg text-foreground">아직 마스터 프로필이 등록되지 않았습니다!</h4>
              <p className="text-sm text-muted-foreground">생년월일과 세무 ID를 등록해야 맞춤 사주 및 오토파일럿 정산 가동이 가능합니다.</p>
            </div>
            <button 
              onClick={() => navigate('/onboarding')}
              className="tap flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm shadow-md whitespace-nowrap"
            >
              <UserPlus size={16} />
              프로필 설정하러 가기
            </button>
          </section>
        )}

        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-gold/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="mono-label text-[11px] text-foreground/90 font-extrabold tracking-wider bg-secondary px-2.5 py-0.5 rounded border border-border">운세 브리핑</span>
            <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-bold border border-gold/20 flex items-center gap-1">
              <Sparkles size={12} className="animate-pulse" />
              재물운 {fortuneGradeMap[luckyCard?.grade || ''] || '미정'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold text-foreground">
              {profile ? `"${formatProfileBirthDate(profile.birthDate)} 생 기사님의 오늘 일진"` : '오늘의 행운 카드 🌟'}
            </h3>
            <p className="text-body-lg text-muted-foreground leading-relaxed">
              {luckyCard?.comment || '기사 프로필을 먼저 등록하시면 사주 만세력 알고리즘을 분석하여 오늘의 맞춤 행운 동선을 알려드립니다.'}
            </p>
          </div>
        </section>

        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:border-primary/40">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[11px] text-primary font-extrabold tracking-wider bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">아침 핵심 추천 코스</span>
              <Navigation className="h-5 w-5 text-primary animate-bounce" />
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
              {course?.destinationName || '김포공항 방면'}
            </h3>
            <p className="text-body-lg text-muted-foreground">
              {course?.routeSummary || '현재 올림픽대로 여의도 부근 정체가 극심하므로 가양대교 우회 경로를 추천합니다.'}
            </p>
            <ul className="space-y-2 mt-2">
              <li className="flex items-center gap-2.5 text-body-lg font-medium text-foreground">
                <span className="w-2 h-2 rounded-full bg-gold" />
                추천: {course?.destinationName || '가양대교 우회 코스'} (실시간 자동 안내)
              </li>
            </ul>
          </div>
          <div>
            <button 
              onClick={() => {
                if (!course) return;
                const isKakao = profile?.naviPreference === 'KAKAONAVI';
                if (isKakao) {
                  let dest = course.destinationName || '목적지';
                  let lat = '37.558';
                  let lon = '126.802';
                  if (course.tmapIntentUrl) {
                    try {
                      const url = new URL(course.tmapIntentUrl.replace('tmap://route', 'http://tmap'));
                      dest = url.searchParams.get('goalname') || dest;
                      lat = url.searchParams.get('goallat') || lat;
                      lon = url.searchParams.get('goallon') || lon;
                    } catch (e) {
                      console.error('Failed to parse tmapIntentUrl:', e);
                    }
                  }
                  window.location.href = `kakaonavi://navigate?destination=${encodeURIComponent(dest)}&y=${lat}&x=${lon}`;
                } else {
                  if (course.tmapIntentUrl) {
                    window.location.href = course.tmapIntentUrl;
                  } else {
                    alert('티맵 앱으로 추천 코스를 전송합니다.');
                  }
                }
              }}
              className="tap w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/95"
            >
              추천 경로 {profile?.naviPreference === 'KAKAONAVI' ? '카카오네비' : '티맵'} 전송
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-foreground">기사 생존 가이드</h3>
            <Newspaper className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {feeds.map((feed, i) => (
              <div key={i} className="tap rounded-xl border border-border bg-card/60 p-5 hover:bg-card hover:border-foreground/20 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-foreground/80 font-bold font-sans">{feed.v}</span>
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-bold">{feed.badge}</span>
                  </div>
                  <h4 className="font-bold text-lg text-foreground line-clamp-1 leading-snug">{feed.t}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{feed.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
