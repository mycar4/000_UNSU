const items = [
  '개인택시운송사업조합',
  '스마트호출 연동',
  '실시간 교통 API',
  'AI 수요예측',
  '카드결제 정산',
  '운행기록 자동화',
]

export function LogoStrip() {
  return (
    <section className="border-b border-border py-8">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="mono-label mb-5 text-center text-muted-foreground">
          신뢰할 수 있는 데이터 파트너와 함께합니다
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="marquee flex w-max items-center gap-12 whitespace-nowrap">
            {[...items, ...items].map((item, i) => (
              <span
                key={i}
                className="text-base font-medium text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
