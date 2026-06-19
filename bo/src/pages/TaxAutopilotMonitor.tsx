import React, { useState } from 'react'
import { Landmark, AlertCircle, Play, CheckCircle, RefreshCw } from 'lucide-react'

interface DriverFiling {
  id: string
  name: string
  homeTaxId: string
  businessType: 'PRIVATE' | 'PREMIUM'
  revenue: number
  expense: number
  refund: number
  status: 'SUCCESS' | 'PENDING' | 'ERROR'
  updatedAt: string
}

export function TaxAutopilotMonitor() {
  const [filings, setFilings] = useState<DriverFiling[]>([
    { id: '1', name: '김*수', homeTaxId: 'kims***', businessType: 'PRIVATE', revenue: 4500000, expense: 1050000, refund: 428000, status: 'SUCCESS', updatedAt: '04:12:05' },
    { id: '2', name: '이*민', homeTaxId: 'leem***', businessType: 'PREMIUM', revenue: 8600000, expense: 2300000, refund: 856000, status: 'SUCCESS', updatedAt: '04:09:12' },
    { id: '3', name: '박*준', homeTaxId: 'park***', businessType: 'PRIVATE', revenue: 3200000, expense: 800000, refund: 304000, status: 'PENDING', updatedAt: '04:05:44' },
    { id: '4', name: '최*영', homeTaxId: 'choi***', businessType: 'PRIVATE', revenue: 5100000, expense: 1200000, refund: 485000, status: 'ERROR', updatedAt: '03:58:20' },
  ])

  const [loading, setLoading] = useState(false)
  const [errorRate, setErrorRate] = useState(0.15)

  const handleManualDispatch = () => {
    if (confirm('대기 및 오류 처리된 핀테크 정산 건을 국세청 홈택스로 즉시 수동 재발송하시겠습니까?')) {
      setLoading(true)
      setTimeout(() => {
        setFilings((prev) =>
          prev.map((f) =>
            f.status !== 'SUCCESS' ? { ...f, status: 'SUCCESS', updatedAt: new Date().toTimeString().split(' ')[0] } : f
          )
        )
        setErrorRate(0.0)
        setLoading(false)
        alert('보류 및 실패 정산 건(2건)이 국세청 홈택스 API로 정상적으로 수동 재조정 및 완료 처리되었습니다.')
      }, 1200)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title & PII Safe Guard Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">세무 자율비행 정산 관제</h2>
          <p className="text-sm text-muted-foreground">국세청 홈택스 세무 대행 정산 상태 및 핀테크 연동 데이터 관제</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-2 rounded-xl text-xs font-bold w-fit">
          <Landmark size={14} />
          <span>PII Zero-Storage 보안 규격 준수 중</span>
        </div>
      </div>

      {/* PII Alert Shield Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-4">
        <AlertCircle className="text-gold h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">보안 준수 사항 (PII Shield)</strong>
          <p className="mt-1">
            기사 마스터 프로필의 주민등록번호, 휴대폰 번호, 간편인증 토큰 등 민감한 개인 식별 정보(PII)는 데이터베이스에 절대 저장하지 않으며 본 백오피스 화면에서도 평문 노출이 원천 금지됩니다. 모든 정보는 마스킹 및 해시 인덱스 처리되어 출력됩니다.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: '누적 정산 기사 수', value: '1,284명' },
          { label: '금월 총 수입 매출', value: '₩ 4,821,500,000' },
          { label: '금월 환급 대행 규모', value: '₩ 348,500,000', color: 'text-gold' },
          { label: 'CODEF/쿠콘 에러율', value: `${errorRate.toFixed(2)}%`, color: errorRate > 0 ? 'text-amber-500' : 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="mono-label text-[10px] text-muted-foreground font-bold">{stat.label}</span>
            <div className={`mt-2 text-2xl font-bold font-mono ${stat.color || ''}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Monitoring Logs & Manual Action Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-bold text-lg text-foreground">실시간 세무 신고 이력</h3>
            <span className="text-[10px] mono-label text-muted-foreground font-bold">REALTIME DATA SYNC</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">기사명</th>
                  <th className="py-3 px-2">홈택스 ID</th>
                  <th className="py-3 px-2">택시구분</th>
                  <th className="py-3 px-2 text-right">매출액</th>
                  <th className="py-3 px-2 text-right">환급예상액</th>
                  <th className="py-3 px-2 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filings.map((filing) => (
                  <tr key={filing.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-2 font-bold text-foreground">{filing.name}</td>
                    <td className="py-3.5 px-2 font-mono text-xs">{filing.homeTaxId}</td>
                    <td className="py-3.5 px-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        filing.businessType === 'PREMIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-secondary text-secondary-foreground border border-border'
                      }`}>
                        {filing.businessType}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-medium">₩ {filing.revenue.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-right font-mono font-bold text-gold">₩ {filing.refund.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        filing.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        filing.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {filing.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action / Fintech API Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 lg:col-span-1">
          <div className="border-b border-border/60 pb-3">
            <h3 className="font-bold text-lg text-foreground">API 게이트웨이 관제</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="mono-label text-[10px] text-muted-foreground font-bold">API 연결 상태</span>
              <div className="flex items-center gap-2 rounded-xl bg-background border border-border p-4">
                <CheckCircle className="text-emerald-500 h-5 w-5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-foreground">CODEF / 쿠콘 게이트웨이</div>
                  <div className="text-xs text-muted-foreground font-mono">Status: CONNECTED (200 OK)</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="mono-label text-[10px] text-muted-foreground font-bold">보류 및 에러 배치 현황</span>
              <div className="rounded-xl bg-background border border-border p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">보류 정산건</span>
                  <span className="font-bold font-mono text-amber-500">
                    {filings.filter(f => f.status === 'PENDING').length}건
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">전송 에러건</span>
                  <span className="font-bold font-mono text-rose-500">
                    {filings.filter(f => f.status === 'ERROR').length}건
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleManualDispatch}
                disabled={loading}
                className={`tap w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md ${
                  loading 
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/95'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>홈택스 재전송 중...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-primary-foreground stroke-none" />
                    <span>임시 보류건 수동 재발송</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
