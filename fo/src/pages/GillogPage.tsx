import React from 'react';
import { Sparkles, Navigation, Newspaper, ArrowRight } from 'lucide-react';

export function GillogPage() {
  const feeds = [
    { t: '양도양수 리얼 꿀팁 후기', d: '개인택시 면허 양수 시 꼭 짚고 넘어가야 할 양도인 차량 대차 비용 분석.', v: '조회수 1.2만', badge: '가이드' },
    { t: '5월 부가세 환급 정산기', d: '신차 구입 매입자료 홈택스 오토파일럿 신고로 부가세 100% 환급받은 기사 실사례.', v: '조회수 8.4천', badge: '정산' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6">
      {/* 백그라운드 효과 */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[60%] dot-field" />
      
      <div className="relative px-5 flex flex-col gap-8">
        
        {/* 상단 브리핑 타이틀 */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-foreground opacity-60" />
            <span className="mono-label text-[11px] text-muted-foreground font-bold">DAILY BRIEFING</span>
          </div>
          <h2 className="hero-head text-foreground mt-1">
            오늘의 루틴
          </h2>
          <p className="text-body-lg text-muted-foreground mt-1">
            출근 전 가볍게 확인하세요. AI가 오늘의 운수와 최적 코스를 브리핑합니다.
          </p>
        </header>

        {/* 1. 오늘의 행운 카드 */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:border-gold/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="mono-label text-[10px] text-muted-foreground font-bold">운세 브리핑</span>
            <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-bold border border-gold/20 flex items-center gap-1">
              <Sparkles size={12} className="animate-pulse" />
              재물운 최상
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-bold text-foreground">"서북쪽 방향에서 귀인을 만날 운세"</h3>
            <p className="text-body-lg text-muted-foreground">
              오전 9시 ~ 11시 사이에 청담동 방면 콜을 수락하시면 높은 팁과 막힘 없는 운행이 예상됩니다. 평소보다 10분 일찍 시동을 켜보세요.
            </p>
          </div>
        </section>

        {/* 2. 아침 핵심 가이드 코스 브리핑 배너 */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:border-primary/40">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[10px] text-muted-foreground font-bold">아침 핵심 추천 코스</span>
              <Navigation className="h-5 w-5 text-primary animate-bounce" />
            </div>
            <h3 className="text-3xl font-extrabold tracking-tight text-foreground">김포공항 방면</h3>
            <p className="text-body-lg text-muted-foreground">
              현재 올림픽대로 여의도 부근 정체가 극심하므로 가양대교 우회 경로를 추천합니다.
            </p>
            <ul className="space-y-2 mt-2">
              <li className="flex items-center gap-2.5 text-body-lg font-medium text-foreground">
                <span className="w-2 h-2 rounded-full bg-gold" />
                추천: 가양대교 우회 코스 (42분 소요)
              </li>
              <li className="flex items-center gap-2.5 text-body-lg text-muted-foreground opacity-60">
                <span className="w-2 h-2 rounded-full bg-border" />
                회피: 강남대로 방면 (65분 소요, 혼잡)
              </li>
            </ul>
          </div>
          <div>
            <button className="tap w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/90">
              추천 경로 티맵 전송
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* 3. 생존 가이드 피드 */}
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
                    <span className="mono-label text-[9px] text-muted-foreground">{feed.v}</span>
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
