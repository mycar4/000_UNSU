import React, { useState } from 'react'
import { Activity, MapPin, Sliders, CheckCircle2, AlertTriangle, RefreshCw, Cpu } from 'lucide-react'

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
    { id: '1', apiName: '기상청 실시간 단기예보 OpenAPI', latency: '48ms', status: 'ACTIVE', healthScore: 98 },
    { id: '2', apiName: '서울시 TOPIS 돌발 소통 트래픽 API', latency: '120ms', status: 'ACTIVE', healthScore: 95 },
    { id: '3', apiName: '한국공항공사 항공편 출도착 실시간 API', latency: '245ms', status: 'ACTIVE', healthScore: 92 },
    { id: '4', apiName: '서울 지하철 실시간 열차 운행 API', latency: '650ms', status: 'WARNING', healthScore: 84 },
  ])

  const [tuning, setTuning] = useState(false)
  const [promptVersion, setPromptVersion] = useState('v1.4.1')

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
          { label: 'RAG 평균 레이턴시', value: '45ms', color: 'text-foreground', icon: Cpu },
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
      </div>
    </div>
  )
}
