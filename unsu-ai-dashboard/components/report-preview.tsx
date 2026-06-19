import { TrendingUp, MapPin, Clock } from 'lucide-react'

const bars = [42, 55, 38, 70, 64, 88, 96, 74, 60, 82, 90, 68]

export function ReportPreview() {
  return (
    <section id="report" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-foreground" />
              <span className="mono-label text-muted-foreground">
                운수 리포트
              </span>
            </div>
            <h2 className="hero-head mt-5 text-balance text-4xl md:text-5xl">
              하루의 끝에,
              <br />
              숫자로 보는 보람.
            </h2>
            <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
              운행이 끝나면 오늘의 순익, 시간당 효율, 가장 잘 벌린 구역을 한눈에
              정리해 드립니다. 내일은 더 나은 동선으로.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { icon: TrendingUp, t: '오늘 순익 +38% (어제 대비)' },
                { icon: MapPin, t: '강남·서초 심야 콜 적중률 94%' },
                { icon: Clock, t: '시간당 운행 효율 1.7배 향상' },
              ].map((row) => (
                <li key={row.t} className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border">
                    <row.icon className="h-4 w-4" strokeWidth={1.6} />
                  </span>
                  <span className="text-foreground">{row.t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="mono-label text-muted-foreground">
                  오늘의 순익
                </div>
                <div className="mt-1 text-3xl font-medium tracking-tight">
                  ₩ 287,400
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
                +38%
              </span>
            </div>

            <div className="mt-8 flex h-44 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      h >= 88 ? 'var(--gold)' : 'var(--muted-foreground)',
                    opacity: h >= 88 ? 1 : 0.28,
                  }}
                />
              ))}
            </div>
            <div className="mono-label mt-3 flex justify-between text-muted-foreground">
              <span>06시</span>
              <span>14시</span>
              <span>22시</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
