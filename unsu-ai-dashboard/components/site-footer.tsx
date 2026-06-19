import { ArrowRight } from 'lucide-react'

const cols = [
  {
    title: '플랫폼',
    links: ['오늘의 운수', '황금 동선', '수익 분석', '대박 콜'],
  },
  { title: '회사', links: ['소개', '기사 후기', '채용', '뉴스룸'] },
  { title: '지원', links: ['고객센터', '이용 가이드', '자주 묻는 질문', '문의'] },
  { title: '법적 고지', links: ['이용약관', '개인정보처리방침', '위치정보'] },
]

export function SiteFooter() {
  return (
    <footer>
      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
          <h2 className="hero-head text-balance text-4xl md:text-6xl">
            오늘부터, 운수대통.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground">
            지금 등록하면 14일간 모든 기능을 무료로. 카드 등록도 필요 없습니다.
          </p>
          <a
            href="#pricing"
            className="tap mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground"
          >
            무료로 시작하기
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tracking-tight">
                운수대통
              </span>
              <span className="mono-label text-muted-foreground">UNSU</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              개인택시 기사를 위한 데이터 기반 운행 플랫폼. 감이 아닌 데이터로
              운행하세요.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="mono-label text-muted-foreground">{c.title}</div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="mono-label text-muted-foreground">
            © 2026 운수대통. All rights reserved.
          </p>
          <p className="mono-label text-muted-foreground">
            Made for 개인택시 기사님
          </p>
        </div>
      </div>
    </footer>
  )
}
