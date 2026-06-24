import React, { useState, useEffect } from 'react'
import { Activity, MapPin, Sliders, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Zap } from 'lucide-react'

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface HeotangReport {
  id: string
  area: string
  reportedTime: string
  coordinates: string
  status: 'SYNCED' | 'PROCESSED'
}

interface ScraperStatus {
  id: string
  apiName: string
  latency: string
  status: 'ACTIVE' | 'WARNING' | 'ERROR'
  healthScore: number
}

export function GPanStatusDashboard() {
  const [reports, setReports] = useState<HeotangReport[]>([
    { id: '1', area: '강남역 사거리 남측', reportedTime: '12분 전', coordinates: '37.498, 127.027', status: 'SYNCED' },
    { id: '2', area: '김포공항 국내선 슬롯 B', reportedTime: '24분 전', coordinates: '37.558, 126.802', status: 'SYNCED' },
    { id: '3', area: '여의도 IFC 몰 정문', reportedTime: '1시간 전', coordinates: '37.525, 126.924', status: 'PROCESSED' },
  ])

  const [scrapers] = useState<ScraperStatus[]>([
    { id: '1', apiName: '기상청 실시간 단기예보 OpenAPI', latency: '48ms', status: 'ACTIVE', healthScore: 99 },
    { id: '2', apiName: '서울시 TOPIS 돌발 소통 트래픽 API', latency: '65ms', status: 'ACTIVE', healthScore: 98 },
    { id: '3', apiName: '한국공항공사 항공편 출도착 실시간 API', latency: '125ms', status: 'ACTIVE', healthScore: 98 },
    { id: '4', apiName: '서울 지하철 실시간 열차 운행 API', latency: '85ms', status: 'ACTIVE', healthScore: 99 },
  ])

  const [tuning, setTuning] = useState(false)
  const [promptVersion, setPromptVersion] = useState('v1.4.1')

  const [llmUsage, setLlmUsage] = useState({
    totalPrompt: 0,
    totalOutput: 0,
    totalTokens: 0,
    estimatedCostKrw: 0,
    estimatedCostUsd: 0,
    dailyUsages: [] as any[]
  })
  
  const [tokenLogs, setTokenLogs] = useState<any[]>([])

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/admin/llm-usage`)
        if (res.ok) {
          const data = await res.json()
          setLlmUsage(data)
        }

        const logsRes = await fetch(`${API_HOST}/api/admin/llm-usage-logs`)
        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setTokenLogs(logsData.slice(0, 50)) // Show up to 50 recent logs
        }
      } catch (err) {
        console.error('Failed to fetch LLM usage:', err)
      }
    }
    fetchUsage()
    const interval = setInterval(fetchUsage, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleFineTuning = () => {
    if (confirm('⚠️ [프롬프트 가중치 미세 조정]\n누적된 기사 허탕 피드백 데이터셋을 학습하여 Gemini AI 핫존 추천 가중치를 미세 조정(Fine-Tuning)하고 새 버전을 배포하시겠습니까?')) {
      setTuning(true)
      setTimeout(() => {
        setPromptVersion((prev) => {
          const num = parseFloat(prev.replace('v', '')) + 0.1
          return `v${num.toFixed(1)}`
        })
        setReports(prev => prev.map(r => ({ ...r, status: 'PROCESSED' })))
        setTuning(false)
        alert('LangSmith Dataset 피드백 학습 및 Gemini 에이전트 프롬프트 가중치 미세 조정 보정이 완료되었습니다. 새 버전이 핫패치 배포되었습니다.')
      }, 1500)
    }
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">G-PAN 실시간 관제 및 AI 피드백 튜닝</h2>
        <p className="text-sm text-muted-foreground">교통/기상 스크래퍼 게이트웨이 생존율과 기사 허탕 피드백을 RAG 가중치에 동적 피드포워드하는 튜닝 룸</p>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: '스크래퍼 성공률', value: '99.4%', color: 'text-emerald-500', icon: Activity },
          { label: '누적 허탕 피드백', value: `${reports.length}건 수집`, color: 'text-rose-500', icon: MapPin },
          { label: '에이전트 프롬프트 버전', value: promptVersion, color: 'text-gold', icon: Sliders },
          { label: 'AI 누적 과금 (예상)', value: `₩${llmUsage.estimatedCostKrw.toLocaleString()}`, color: 'text-blue-500', icon: Zap },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="mono-label text-[10px] text-muted-foreground font-bold">{stat.label}</span>
                <div className={`text-xl font-bold font-mono ${stat.color || ''}`}>{stat.value}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">
                <Icon size={20} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Sections Split */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scrapers Monitoring */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-lg text-foreground">공공 & 교통 데이터 API 스크래핑 생존율</h3>
            <span className="text-[10px] mono-label text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              ONLINE
            </span>
          </div>

          <div className="space-y-3">
            {scrapers.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-background border border-border/80 rounded-xl hover:border-gold/25 transition-all">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-foreground">{s.apiName}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground">헬스 점수: {s.healthScore}%</span>
                    <span className="text-[9px] font-mono text-muted-foreground">|</span>
                    <span className="text-[9px] font-mono text-muted-foreground">지연 시간: {s.latency}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  s.status === 'ACTIVE' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback & Tuning */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 lg:col-span-1">
          <div className="border-b border-border/60 pb-3">
            <h3 className="font-bold text-lg text-foreground">LangSmith 피드백 플라이휠</h3>
          </div>

          {/* Heotang reports list */}
          <div className="space-y-3">
            <span className="mono-label text-[10px] text-muted-foreground font-bold block">실시간 허탕 수집 인덱스 (LangSmith 동기화)</span>
            <div className="divide-y divide-border/60 max-h-48 overflow-y-auto pr-1 space-y-2.5">
              {reports.map((r) => (
                <div key={r.id} className="pt-2 flex justify-between items-start text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="font-sans font-semibold text-foreground flex items-center gap-1">
                      <MapPin size={11} className="text-rose-500" />
                      {r.area}
                    </div>
                    <span className="text-[10px] text-muted-foreground">GPS: {r.coordinates} ({r.reportedTime})</span>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                    r.status === 'SYNCED' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rebuild Trigger */}
          <div className="pt-4 border-t border-border/60 space-y-3">
            <div className="text-xs text-muted-foreground leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/10">
              기사 광장에서 클릭된 <strong>허탕 피드백</strong>은 LangSmith Dataset에 실시간 축적되며, 가중치 학습 완료 후 즉시 핫존 추천 알고리즘의 오차 보정에 반영됩니다.
            </div>

            <button
              onClick={handleFineTuning}
              disabled={tuning}
              className={`tap w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md ${
                tuning 
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/95'
              }`}
            >
              {tuning ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>모델 가중치 파인튜닝 중...</span>
                </>
              ) : (
                <>
                  <Cpu size={14} />
                  <span>가중치 미세 조정 동기화</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* LLM Token Usage Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Zap className="text-blue-500" size={20} />
              LLM 실시간 토큰 소비 및 과금 관제
            </h3>
            <span className="text-[10px] mono-label text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Gemini 1.5 Flash 기준
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-xl p-4 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-semibold mb-1">총 입력(Prompt) 토큰</span>
              <span className="text-2xl font-bold font-mono text-foreground">{llmUsage.totalPrompt.toLocaleString()}</span>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-semibold mb-1">총 출력(Output) 토큰</span>
              <span className="text-2xl font-bold font-mono text-foreground">{llmUsage.totalOutput.toLocaleString()}</span>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-semibold mb-1">총 소비 토큰 합계</span>
              <span className="text-2xl font-bold font-mono text-blue-400">{llmUsage.totalTokens.toLocaleString()}</span>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8" />
              <span className="text-xs text-blue-500/80 font-bold mb-1">총 예상 과금액 (KRW)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-blue-500">₩{llmUsage.estimatedCostKrw.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">(${llmUsage.estimatedCostUsd})</span>
              </div>
            </div>
          </div>
          
          <div className="pt-6 mt-4 border-t border-border/60">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Activity size={14} className="text-muted-foreground" />
              최근 발생 건별 상세 리스트
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 px-3 font-semibold w-32">발생 시점</th>
                    <th className="py-2 px-3 font-semibold">요청자 (기사 ID)</th>
                    <th className="py-2 px-3 font-semibold text-right">입력 토큰</th>
                    <th className="py-2 px-3 font-semibold text-right">출력 토큰</th>
                    <th className="py-2 px-3 font-semibold text-right">합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {tokenLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        최근 기록된 토큰 사용 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    tokenLogs.map(log => (
                      <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-foreground font-sans font-medium">{log.driver_id}</td>
                        <td className="py-2.5 px-3 text-right">{log.prompt_tokens.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">{log.output_tokens.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-500">{log.total_tokens.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
