import {
  Sparkles,
  Route,
  LineChart,
  ShieldCheck,
  Clock,
  Coins,
} from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: '오늘의 운수 브리핑',
    desc: '출근 전, AI가 날씨·요일·행사·과거 패턴을 분석해 오늘의 추천 운행 전략을 한 장으로 정리해 드립니다.',
  },
  {
    icon: Route,
    title: '황금 동선 안내',
    desc: '빈 차로 헤매지 마세요. 시간대별 수요가 몰리는 지역과 최적 이동 경로를 실시간으로 추천합니다.',
  },
  {
    icon: LineChart,
    title: '실시간 수익 분석',
    desc: '운행·유류비·순익을 자동 집계하고, 목표 대비 달성률을 직관적인 차트로 보여드립니다.',
  },
  {
    icon: Clock,
    title: '대박 콜 알림',
    desc: '장거리·공항·심야 할증 등 수익성 높은 콜을 우선 포착해 가장 먼저 알려드립니다.',
  },
  {
    icon: Coins,
    title: '자동 정산 관리',
    desc: '카드 결제, 현금, 앱 호출 수입을 한 곳에서 정산하고 세무 신고 자료까지 자동으로 만들어 드립니다.',
  },
  {
    icon: ShieldCheck,
    title: '안전 운행 케어',
    desc: '연속 운행 시간과 휴게 타이밍을 관리하고, 무리한 운행 전 미리 알림을 보내 드립니다.',
  },
]

export function Features() {
  return (
    <section id="features" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground" />
          <span className="mono-label text-muted-foreground">기능</span>
        </div>
        <h2 className="hero-head mt-5 max-w-2xl text-balance text-4xl md:text-6xl">
          운전대 잡는 시간만,
          <br />
          나머지는 우리가.
        </h2>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-card p-7 transition-colors hover:bg-secondary md:p-8"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border">
                <f.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <h3 className="mt-6 text-xl font-medium tracking-tight">
                {f.title}
              </h3>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
