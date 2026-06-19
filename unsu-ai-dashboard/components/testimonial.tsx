export function Testimonial() {
  return (
    <section className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
        <span className="mono-label text-muted-foreground">기사님의 이야기</span>
        <blockquote className="hero-head mt-6 text-balance text-3xl md:text-5xl">
          “감으로 30년을 운전했는데,
          <br />
          이제는 데이터가 길을 알려줘요.
          <br />
          빈 차로 도는 시간이 확 줄었습니다.”
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
            김
          </span>
          <div className="text-left">
            <div className="font-medium text-foreground">김상철 기사님</div>
            <div className="mono-label text-muted-foreground">
              서울 개인택시 · 운행 31년차
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
