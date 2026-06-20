"use client"

import { useState } from 'react'
import { TrendingUp, MapPin, Clock, Search, ArrowRight, Loader2, Volume2, ShieldAlert } from 'lucide-react'

// Safe Markdown Parser that compiles Markdown syntax into secure React JSX nodes.
// Completely bypasses dangerouslySetInnerHTML to guarantee 100% XSS security.
function SafeMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-4 text-left">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        
        // Headers (e.g. ### [AI 오디오 관제 브리핑])
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="mt-6 mb-2 text-xl font-extrabold tracking-tight text-[oklch(0.72_0.15_68)] sm:text-2xl">
              {trimmed.substring(4)}
            </h3>
          )
        }
        
        // List Item with Bold matching: - **강남역**: 3대 대기 (상태: 보통)
        if (trimmed.startsWith('- **') || trimmed.startsWith('* **')) {
          const boldMatch = trimmed.match(/^[-*]\s+\*\*(.*?)\*\*:(.*)$/)
          if (boldMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-body-lg">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[oklch(0.72_0.15_68)]" />
                <span className="text-[17px] leading-relaxed text-foreground">
                  <strong className="font-extrabold text-foreground">{boldMatch[1]}:</strong>
                  {boldMatch[2]}
                </span>
              </div>
            )
          }
          
          // Fallback bold parsing
          const simpleBoldMatch = trimmed.match(/^[-*]\s+\*\*(.*?)\*\*(.*)$/)
          if (simpleBoldMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-body-lg">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[oklch(0.72_0.15_68)]" />
                <span className="text-[17px] leading-relaxed text-foreground">
                  <strong className="font-extrabold text-foreground">{simpleBoldMatch[1]}</strong>
                  {simpleBoldMatch[2]}
                </span>
              </div>
            )
          }
        }
        
        // Alert/Quote block: > [!TIP]
        if (trimmed.startsWith('> [!')) {
          return null // Skip marker headers to render contents cleanly inside box
        }
        if (trimmed.startsWith('>')) {
          return (
            <blockquote key={idx} className="my-4 rounded-r-lg border-l-4 border-[oklch(0.72_0.15_68)] bg-[oklch(0.24_0.08_70)]/10 px-4 py-3 text-[15px] italic text-foreground/80">
              {trimmed.replace(/^>\s*/, '')}
            </blockquote>
          )
        }
        
        // Highlight revenue or tips
        if (trimmed.startsWith('-')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-body-lg">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
              <span className="text-[17px] leading-relaxed text-foreground">
                {trimmed.replace(/^[-*]\s*/, '')}
              </span>
            </div>
          )
        }

        if (trimmed === '') {
          return <div key={idx} className="h-1.5" />
        }

        return (
          <p key={idx} className="text-[17px] leading-relaxed text-foreground/90">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}

export function ReportPreview() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState('')
  const [hotzones, setHotzones] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setReport('')
    setHotzones([])
    setError('')

    // E2E Standard EventSource to stream RAG agent analysis
    const url = `http://localhost:3001/api/recommend/stream?q=${encodeURIComponent(query)}`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'error') {
          setError(data.message || 'RAG 분석 보고서를 생성하는 동안 예외가 발생했습니다.')
          eventSource.close()
          setLoading(false)
        } else if (data.type === 'hotzones') {
          setHotzones(data.hotzones || [])
        } else if (data.type === 'report') {
          setReport((prev) => prev + data.text + '\n')
        }
      } catch (err) {
        console.error('[SSE Parse Error] Invalid payload:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setLoading(false)
      setReport((current) => {
        // If we didn't receive any content, it indicates a real server/connection error.
        if (!current) {
          setError('서버 연결에 실패하였습니다. 백엔드 API 서버(Port 3001)가 가동 중인지 확인해 주세요.')
        }
        return current
      })
    }
  }

  return (
    <section id="report" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
          
          {/* Left Text / Info Panel */}
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-foreground" />
              <span className="mono-label text-muted-foreground">
                AI 관제 레이더 데모
              </span>
            </div>
            <h2 className="hero-head mt-5 text-balance text-4xl md:text-5xl">
              어디로 가야 할지,
              <br />
              AI에게 물어보세요.
            </h2>
            <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
              강남역, 김포공항, 여의도 등 목적지를 입력하면 실시간 돌발 트래픽과
              대기 택시 현황을 비동기 스캔하여 최적의 수익 동선 보고서를 스트리밍합니다.
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="예: 강남역, 김포공항"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-card py-2.5 pr-4 pl-9 text-[15px] outline-none transition placeholder:text-muted-foreground focus:border-[oklch(0.72_0.15_68)] focus:ring-1 focus:ring-[oklch(0.72_0.15_68)] disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="tap flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    분석 시작
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <ul className="mt-12 space-y-4">
              {[
                { icon: TrendingUp, t: '교통망 Open API & 핫존 추정 연계' },
                { icon: MapPin, t: '실시간 카카오 T / 타다 대기 대수 비동기 스크래핑' },
                { icon: Clock, t: '시니어 맞춤 130% 가독성 브리핑 제공' },
              ].map((row) => (
                <li key={row.t} className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border">
                    <row.icon className="h-4 w-4 text-[oklch(0.72_0.15_68)]" strokeWidth={1.6} />
                  </span>
                  <span className="text-foreground text-[15px]">{row.t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Live Stream Terminal Panel */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : report ? 'bg-emerald-500' : 'bg-foreground/30'}`} />
                <span className="mono-label text-muted-foreground text-[11px]">
                  {loading ? 'AI RAG RUNNING...' : report ? 'STREAM COMPLETED' : 'TERMINAL IDLE'}
                </span>
              </div>
              {report && (
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[oklch(0.72_0.15_68)]">
                  <Volume2 className="h-3.5 w-3.5" />
                  TTS AUDIO ACTIVE
                </span>
              )}
            </div>

            {/* Error Message banner */}
            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-500/10 p-4 text-red-600">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-[14px] leading-relaxed font-medium">{error}</p>
              </div>
            )}

            {/* Simulated Live Output screen */}
            {!report && !loading && !error ? (
              <div className="mt-8 flex h-72 flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-lg bg-[oklch(0.985_0.003_92)]/20 dark:bg-[oklch(0.155_0.006_70)]/20">
                <Search className="h-8 w-8 text-foreground/20 mb-3" />
                <p className="text-[15px]">대시보드 실시간 AI 분석 결과를 보려면<br/>왼쪽 검색창에 지역을 입력하세요.</p>
              </div>
            ) : (
              <div className="mt-6 max-h-[360px] min-h-[280px] overflow-y-auto rounded-lg border border-border bg-[oklch(0.985_0.003_92)]/50 dark:bg-[oklch(0.155_0.006_70)]/50 p-5 font-sans">
                {report && <SafeMarkdownRenderer content={report} />}
                
                {loading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mt-4">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[oklch(0.72_0.15_68)]" />
                    <span>실시간 RAG 추론 결과를 작성 중입니다...</span>
                  </div>
                )}
              </div>
            )}

            {/* Hotzones Badge Strip */}
            {hotzones.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <div className="mono-label text-muted-foreground text-[11px] mb-2">분석 완료된 주변 핫존</div>
                <div className="flex flex-wrap gap-2">
                  {hotzones.map((hz, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[13px] font-bold text-foreground"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${hz.status === 'critical' ? 'bg-red-500' : hz.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {hz.area}: {hz.demand}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
