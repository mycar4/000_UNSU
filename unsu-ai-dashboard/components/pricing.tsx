import { Check } from 'lucide-react'

const plans = [
  {
    name: '입문',
    price: '₩0',
    period: '/ 월',
    desc: '운수대통을 처음 시작하는 기사님께',
    features: ['오늘의 운수 브리핑', '기본 수익 집계', '주간 리포트 1회'],
    cta: '무료로 시작',
    featured: false,
  },
  {
    name: '대통',
    price: '₩19,000',
    period: '/ 월',
    desc: '본격적으로 수익을 끌어올릴 기사님께',
    features: [
      '황금 동선 실시간 안내',
      '대박 콜 우선 알림',
      '실시간 수익·정산 관리',
      '무제한 운수 리포트',
      '안전 운행 케어',
    ],
    cta: '14일 무료 체험',
    featured: true,
  },
  {
    name: '조합',
    price: '맞춤',
    period: '',
    desc: '조합·법인 단위 도입을 원하시면',
    features: ['전담 매니저 배정', '단체 정산 대시보드', '교육 및 온보딩 지원'],
    cta: '도입 문의',
    featured: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground" />
          <span className="mono-label text-muted-foreground">요금제</span>
        </div>
        <h2 className="hero-head mt-5 max-w-2xl text-balance text-4xl md:text-6xl">
          부담 없이, 운수대통.
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-7 md:p-8 ${
                p.featured
                  ? 'border-foreground bg-primary text-primary-foreground'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`mono-label ${p.featured ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                >
                  {p.name}
                </span>
                {p.featured && (
                  <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-primary">
                    추천
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-medium tracking-tight">
                  {p.price}
                </span>
                <span
                  className={
                    p.featured
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }
                >
                  {p.period}
                </span>
              </div>
              <p
                className={`mt-3 text-sm ${p.featured ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
              >
                {p.desc}
              </p>

              <ul className="mt-7 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? 'text-gold' : 'text-foreground'}`}
                      strokeWidth={2}
                    />
                    <span
                      className={
                        p.featured
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`tap mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium ${
                  p.featured
                    ? 'bg-background text-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
