import React, { useState } from 'react'
import { Volume2, Search, Sparkles } from 'lucide-react'
import DOMPurify from 'dompurify'

interface HotZone {
  area: string
  demand: string
  status: 'critical' | 'warning' | 'normal'
}

export function SearchResultPage() {
  const [audioActive, setAudioActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [report, setReport] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const hotzones: HotZone[] = [
    { area: '강남역 2번 출구', demand: '대기수요 극대 (대기 120명)', status: 'critical' },
    { area: '김포공항 국내선', demand: '항공편 연착 집중 (대기 80명)', status: 'warning' },
    { area: '여의도 IFC몰 부근', demand: '비 대량 유입 (대기 40명)', status: 'normal' },
  ]

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    setReport('')
    setIsStreaming(true)

    // Simulate SSE Streaming Response
    const mockPhrases = [
      `### [AI 오디오 브리핑] ${searchQuery} 지역 관제 보고서\n\n`,
      `현재 **${searchQuery}** 지역의 트래픽 흐름 및 택시 대기열 분석을 시작합니다.\n\n`,
      `- **트래픽 집중도**: 평소 대비 **1.8배** 증가\n`,
      `- **황금 핫존**: ${searchQuery} 서측 상업용 오피스 밀집 지대\n`,
      `- **우회 팁**: 북부 순환로 진입 시 신호 대기 시간 6분 단축 가능\n\n`,
      `> [!TIP]\n`,
      `> 전방 주시 중심의 안전 운행을 위해 G-PAN 오디오 스트리밍(Zero-Touch)을 ON 하시면 라디오 채널 피드로 들을 수 있습니다.`
    ]

    let idx = 0
    const interval = setInterval(() => {
      if (idx < mockPhrases.length) {
        setReport((prev) => prev + mockPhrases[idx])
        idx++
      } else {
        setIsStreaming(false)
        clearInterval(interval)
      }
    }, 600)
  }

  // Pure Client Markdown Renderer with DOMPurify
  const renderContent = (md: string) => {
    if (!md) return { __html: '' }
    const html = md
      .split('\n')
      .map((line) => {
        let processed = line.trim()
        if (processed.startsWith('### ')) {
          return `<h3 class="text-lg font-bold text-foreground mt-4 mb-2">${processed.slice(4)}</h3>`
        }
        if (processed.startsWith('- ')) {
          return `<li class="ml-4 list-disc text-sm text-muted-foreground my-1">${processed.slice(2)}</li>`
        }
        if (processed.startsWith('> [!TIP]')) {
          return `<div class="bg-gold/10 border-l-4 border-gold p-3 rounded-r-lg my-2 text-sm text-foreground">`
        }
        if (processed.startsWith('> ')) {
          return `<p class="italic text-gold">${processed.slice(2)}</p></div>`
        }
        return `<p class="text-sm leading-relaxed my-1">${processed}</p>`
      })
      .join('\n')

    const cleanHtml = DOMPurify.sanitize(html, {
      ADD_ATTR: ['target', 'rel', 'referrerpolicy'],
    })
    return { __html: cleanHtml }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 pt-8">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />

      <div className="relative mx-auto max-w-4xl px-5">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground" />
          <span className="mono-label text-muted-foreground">G-PAN REALTIME SYSTEM</span>
        </div>
        <h1 className="hero-head mt-4 text-[clamp(2.5rem,8vw,5rem)]">
          지능형 오디오<br />
          <span className="text-muted-foreground">관제 레이더.</span>
        </h1>

        {/* G-PAN Zero-Touch Audio Engine Switch */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background ${audioActive ? 'text-gold' : 'text-muted-foreground'}`}>
                <Volume2 className={`h-6 w-6 ${audioActive ? 'animate-bounce' : ''}`} />
              </span>
              <div>
                <h3 className="font-semibold text-lg">Zero-Touch 오디오 스트리밍</h3>
                <p className="text-sm text-muted-foreground">시동과 동시에 교통 속보 및 핫존 브리핑을 음성 자동 제공합니다.</p>
              </div>
            </div>
            <button
              onClick={() => setAudioActive(!audioActive)}
              className={`tap rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                audioActive
                  ? 'bg-gold text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {audioActive ? '스트리밍 중' : '라디오 켜기'}
            </button>
          </div>
        </div>

        {/* Real-time traffic queue visualization */}
        <div className="mt-8">
          <h3 className="text-lg font-bold tracking-tight mb-4">현재 실시간 핫존 혼잡 레이아웃</h3>
          <div className="space-y-3">
            {hotzones.map((zone, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    zone.status === 'critical' ? 'bg-rose-500 animate-pulse' :
                    zone.status === 'warning' ? 'bg-gold' : 'bg-emerald-500'
                  }`} />
                  <span className="font-medium text-sm">{zone.area}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{zone.demand}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Briefing search console */}
        <div className="mt-10">
          <h3 className="text-lg font-bold tracking-tight mb-4">지능형 교통 비서 분석 질의</h3>
          <form onSubmit={handleStartSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="예: 강남역, 강서구, 영등포교차로 등"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-card py-3.5 pl-11 pr-4 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              className="tap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
            >
              분석 요청
            </button>
          </form>

          {/* Search report result console */}
          {(isStreaming || report) && (
            <div className="mt-6 rounded-xl border border-border bg-card/80 p-6 relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 grid-lines opacity-10" />
              {isStreaming && (
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-gold animate-spin" />
                  <span className="text-xs text-gold font-medium">실시간 AI 상태 정보 파이프라인 분석 중...</span>
                </div>
              )}
              <div dangerouslySetInnerHTML={renderContent(report)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
