import React, { useState } from 'react'

export function PromptPlayground() {
  const [systemPrompt, setSystemPrompt] = useState('당신은 개인택시 기사용 운수 분석 에이전트입니다.')
  const [userQuery, setUserQuery] = useState('강남역 주행 정보 브리핑해줘')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = () => {
    setLoading(true)
    setTimeout(() => {
      setResult({
        tokens: 382,
        latency: '450ms',
        rawResponse: '### [추천 리포트]\n강남역 일대 대기 수요 분석 완료. 현재 신논현 방면에 호출 수요가 급증하고 있습니다.',
        parsedJson: {
          area: '강남역',
          hotspots: ['강남역 2번 출구', '신논현역 6번 출구'],
          demandScore: 92
        }
      })
      setLoading(false)
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">프롬프트 테스트 룸</h2>
        <p className="text-sm text-muted-foreground">LLM 프롬프트 템플릿과 노드별 매커니즘을 실시간으로 튜닝합니다.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">시스템 프롬프트</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">사용자 쿼리 입력</label>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              className="tap flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {loading ? '테스트 실행 중...' : '테스트 실행'}
            </button>
            <button
              onClick={() => {
                setSystemPrompt('')
                setUserQuery('')
                setResult(null)
              }}
              className="tap rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              초기화
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">실행 결과</label>
          {result ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>소모 토큰 수: <strong>{result.tokens}</strong> tokens</span>
                <span>응답 속도: <strong>{result.latency}</strong></span>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">LLM Response (Markdown)</h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.rawResponse}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4 border border-border font-mono text-xs">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">JSON 파싱 데이터</h4>
                <pre>{JSON.stringify(result.parsedJson, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground">
              프롬프트 테스트를 실행해 주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
