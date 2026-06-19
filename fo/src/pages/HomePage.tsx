import React from 'react'
import { Sparkles, Navigation, Newspaper, ArrowRight } from 'lucide-react'

export function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 pt-8">
      {/* Decorative grids */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[50%] dot-field" />

      <div className="relative mx-auto max-w-4xl px-5">
        {/* Title */}
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground" />
          <span className="mono-label text-muted-foreground">GILLOG ROUTINE</span>
        </div>
        <h1 className="hero-head mt-4 text-[clamp(2.5rem,8vw,5rem)]">
          오늘의 운수<br />
          <span className="text-muted-foreground">그리고 출발.</span>
        </h1>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Horoscope Lucky Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="mono-label text-muted-foreground">오늘의 행운 카드</span>
              <Sparkles className="h-5 w-5 text-gold animate-pulse" />
            </div>
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-28 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gold bg-gold/10">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">"동쪽에서 귀인을 만날 운세"</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                오전 9시 ~ 11시 사이에 청담동 방면 콜을 수락하시면 높은 팁과 부드러운 운행이 예상됩니다.
              </p>
            </div>
          </div>

          {/* Daily Recommended Course Banner */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="mono-label text-muted-foreground">오늘 아침 핵심 코스</span>
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">강남역 ➔ 김포공항</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                현재 올림픽대로 여의도 부근 정체가 심하므로 가양대교 우회 경로를 추천해 드립니다. 예상 소요 시간 42분.
              </p>
            </div>
            <div className="mt-8">
              <button className="tap inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground">
                추천 경로 티맵 전송
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Feed: 초보 생존 가이드 */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">택린이 초보 생존 가이드</h2>
            <Newspaper className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { t: '양도양수 리얼 꿀팁 후기', d: '개인택시 면허 양수 시 꼭 짚고 넘어가야 할 양도인 차량 대차 비용 분석.', v: '조회수 1.2만' },
              { t: '5월 부가세 환급 정산기', d: '신차 구입 매입자료 홈택스 오토파일럿 신고로 부가세 100% 환급받은 기사 실사례.', v: '조회수 8.4천' },
              { t: '심야 할증 최적화 테크닉', d: '밤 11시 이후 핫존 분포와 호출 연계율을 극대화하는 야간 조 주행 가이드.', v: '조회수 2.1만' },
            ].map((feed, i) => (
              <div key={i} className="tap rounded-xl border border-border bg-card/60 p-5 hover:bg-card">
                <span className="mono-label text-[10px] text-muted-foreground">{feed.v}</span>
                <h4 className="mt-2 font-semibold text-foreground line-clamp-1">{feed.t}</h4>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{feed.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
