import { ArrowRight, Play } from 'lucide-react'

const stats = [
  { value: '+38%', label: '월 평균 수익 증가', sub: '베타 기사 기준' },
  { value: '4.2만', label: '분석된 콜 데이터', sub: '일일 누적' },
  { value: '92%', label: '황금 동선 적중률', sub: 'AI 추천' },
  { value: '1,200+', label: '함께하는 개인택시', sub: '전국' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-50" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%] dot-field" />

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground" />
          <span className="mono-label text-muted-foreground">
            개인택시 기사를 위한 운행 플랫폼
          </span>
        </div>

        <h1 className="hero-head mt-6 max-w-3xl text-balance text-[clamp(3rem,11vw,7.5rem)]">
          오늘의 운수를
          <br />
          <span className="text-muted-foreground">데이터로.</span>
        </h1>

        <p className="mt-7 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
          감(感)이 아닌 데이터로 운행하세요. AI가 황금 동선과 대박 콜을 추천하고,
          하루 수익을 실시간으로 관리해 드립니다.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#pricing"
            className="tap inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground"
          >
            무료로 시작하기
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </a>
          <a
            href="#how"
            className="tap inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={1.8} />
            작동 방식 보기
          </a>
        </div>
      </div>

      <div className="relative border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border md:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-7 md:px-8 ${i >= 2 ? 'border-t border-border md:border-t-0' : ''}`}
            >
              <div className="text-3xl font-medium tracking-tight md:text-4xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-foreground">{s.label}</div>
              <div className="mono-label mt-1 text-muted-foreground">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
