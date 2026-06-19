const steps = [
  {
    no: '01',
    title: '차량 등록',
    desc: '개인택시 면허와 차량을 1분 만에 연동하면 준비 완료. 별도 장비는 필요 없습니다.',
  },
  {
    no: '02',
    title: '운수 브리핑 받기',
    desc: '매일 아침 오늘의 추천 운행 구역, 예상 수익, 대박 콜 시간대를 알림으로 받습니다.',
  },
  {
    no: '03',
    title: '데이터로 운행',
    desc: '황금 동선을 따라 운행하고, 실시간 수익을 확인하며 그날의 목표를 달성하세요.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how"
      className="border-b border-border bg-primary py-20 text-primary-foreground md:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary-foreground/60" />
          <span className="mono-label text-primary-foreground/60">
            작동 방식
          </span>
        </div>
        <h2 className="hero-head mt-5 max-w-2xl text-balance text-4xl md:text-6xl">
          세 단계면, 충분합니다.
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s) => (
            <div
              key={s.no}
              className="border-t border-primary-foreground/20 pt-6"
            >
              <div className="font-mono text-sm text-primary-foreground/50">
                {s.no}
              </div>
              <h3 className="mt-4 text-2xl font-medium tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 text-pretty leading-relaxed text-primary-foreground/70">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
