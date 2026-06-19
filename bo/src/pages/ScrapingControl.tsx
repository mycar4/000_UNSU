import React, { useState } from 'react'

export function ScrapingControl() {
  const [logs, setLogs] = useState([
    { time: '14:55:02', query: '강남역 핫존', status: 'SUCCESS', node: 'DuckDuckGo Scraper' },
    { time: '14:52:19', query: '공항 택시 대기열', status: 'SUCCESS', node: 'API Scraper' },
    { time: '14:48:10', query: '여의도 정체구간', status: 'SUCCESS', node: 'DuckDuckGo Scraper' },
  ])

  const [testQuery, setTestQuery] = useState('')
  const [runningTest, setRunningTest] = useState(false)

  const handleScrapeTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testQuery) return
    setRunningTest(true)
    setTimeout(() => {
      setLogs((prev) => [
        {
          time: new Date().toTimeString().split(' ')[0],
          query: testQuery,
          status: 'SUCCESS',
          node: 'Manual Node Scraper'
        },
        ...prev
      ])
      setTestQuery('')
      setRunningTest(false)
    }, 700)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">스크래핑 상태 관제</h2>
        <p className="text-sm text-muted-foreground">교통 OpenAPI 및 분산 스크래핑 파이프라인의 생존률을 모니터링합니다.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: '최근 1시간 요청', value: '142건' },
          { label: '성공률', value: '99.3%', color: 'text-emerald-500' },
          { label: '평균 응답 속도', value: '120ms' },
          { label: 'IP 차단 경고', value: '0건', color: 'text-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <span className="mono-label text-[10px] text-muted-foreground">{stat.label}</span>
            <div className={`mt-1 text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Manual Test Console */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 md:col-span-1">
          <h3 className="font-semibold text-sm">수동 스크래핑 검사</h3>
          <form onSubmit={handleScrapeTest} className="space-y-3">
            <input
              type="text"
              placeholder="테스트할 검색 쿼리"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={runningTest}
              className="tap w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground"
            >
              {runningTest ? '스크랩 분석 중...' : 'Scrape 단독 호출'}
            </button>
          </form>
        </div>

        {/* Real-time Logs Console */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 md:col-span-2">
          <h3 className="font-semibold text-sm">실시간 크롤링 인덱스 로그</h3>
          <div className="divide-y divide-border overflow-y-auto max-h-56">
            {logs.map((log, i) => (
              <div key={i} className="flex justify-between py-3 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground mr-3">[{log.time}]</span>
                  <span className="text-foreground font-semibold">{log.query}</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded ml-2">{log.node}</span>
                </div>
                <span className="text-emerald-500 font-semibold">{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
