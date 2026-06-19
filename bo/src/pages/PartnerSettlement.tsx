import React, { useState } from 'react'
import { Landmark, Store, CreditCard, ShieldCheck, RefreshCw } from 'lucide-react'

interface PartnerTransaction {
  id: string
  partnerName: string
  serviceName: string
  totalSales: number
  commissionRate: number // percent e.g. 10
  status: 'PENDING' | 'SETTLED'
  updatedAt: string
}

export function PartnerSettlement() {
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([
    { id: '1', partnerName: '금호타이어 제휴몰', serviceName: '기사 제휴 타이어 교환', totalSales: 24000000, commissionRate: 8, status: 'PENDING', updatedAt: '2026-06-19' },
    { id: '2', partnerName: '서초 공인 지정 정비소', serviceName: '소모품 교환 공임비 할인', totalSales: 15600000, commissionRate: 10, status: 'PENDING', updatedAt: '2026-06-18' },
    { id: '3', partnerName: '장안 세무회계 법인', serviceName: '기사 전문 종소세 대행 수수료', totalSales: 8900000, commissionRate: 12, status: 'SETTLED', updatedAt: '2026-06-15' },
    { id: '4', partnerName: '메리츠 안심 보증 대행', serviceName: '면허 유지 보증보험 단체 가입', totalSales: 35000000, commissionRate: 5, status: 'SETTLED', updatedAt: '2026-06-12' },
  ])

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleSettle = (id: string, partnerName: string, amount: number) => {
    if (confirm(`⚠️ [정산 송금 실행]\n${partnerName}에 정산금액 ₩ ${amount.toLocaleString()}원을 실제로 지급 송금하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      setLoadingId(id)
      setTimeout(() => {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: 'SETTLED', updatedAt: new Date().toISOString().slice(0, 10) } : t
          )
        )
        setLoadingId(null)
        alert(`${partnerName} 앞으로의 B2B 정산 송금이 정상 완료 처리되었습니다.`)
      }, 1000)
    }
  }

  // Derived metrics
  const totalSalesSum = transactions.reduce((acc, t) => acc + t.totalSales, 0)
  const totalCommissionSum = transactions.reduce((acc, t) => acc + (t.totalSales * (t.commissionRate / 100)), 0)
  const pendingPayoutSum = transactions
    .filter((t) => t.status === 'PENDING')
    .reduce((acc, t) => acc + (t.totalSales * (1 - t.commissionRate / 100)), 0)

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">B2B 제휴사 정산 관리</h2>
        <p className="text-sm text-muted-foreground">타이어, 정비소, 세무사, 보증 서비스 등 제휴 스토어 매출 정산 통계 및 송금 대행</p>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: '누적 제휴 매출', value: `₩ ${totalSalesSum.toLocaleString()}`, icon: Store },
          { label: '누적 플랫폼 수수료 (수익)', value: `₩ ${totalCommissionSum.toLocaleString()}`, icon: CreditCard, color: 'text-gold' },
          { label: '정산 대기 송금액', value: `₩ ${pendingPayoutSum.toLocaleString()}`, icon: Landmark, color: 'text-amber-500' },
          { label: '활성 제휴 네트워크', value: `${transactions.length}개 기관`, icon: ShieldCheck, color: 'text-emerald-500' },
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

      {/* Table Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="font-bold text-lg text-foreground">제휴 기관별 실시간 정산 통계</h3>
          <span className="text-[10px] mono-label text-muted-foreground font-bold">B2B TRANSACTION SETTLEMENT</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-2">제휴처명</th>
                <th className="py-3 px-2">제휴 서비스</th>
                <th className="py-3 px-2 text-right">매출 총액</th>
                <th className="py-3 px-2 text-center">수수료율</th>
                <th className="py-3 px-2 text-right">플랫폼 수익</th>
                <th className="py-3 px-2 text-right">실지급 예정액</th>
                <th className="py-3 px-2 text-center">상태</th>
                <th className="py-3 px-2 text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactions.map((t) => {
                const commission = t.totalSales * (t.commissionRate / 100)
                const netPayout = t.totalSales - commission
                const isPending = t.status === 'PENDING'

                return (
                  <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-2 font-bold text-foreground">{t.partnerName}</td>
                    <td className="py-3.5 px-2 text-xs text-muted-foreground">{t.serviceName}</td>
                    <td className="py-3.5 px-2 text-right font-mono font-medium">₩ {t.totalSales.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-center font-mono font-bold text-muted-foreground">{t.commissionRate}%</td>
                    <td className="py-3.5 px-2 text-right font-mono font-medium text-gold">₩ {commission.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-right font-mono font-bold text-foreground">₩ {netPayout.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        t.status === 'SETTLED'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                      }`}>
                        {isPending ? '지급 대기' : '정산 완료'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {isPending ? (
                        <button
                          onClick={() => handleSettle(t.id, t.partnerName, netPayout)}
                          disabled={loadingId !== null}
                          className="tap bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-primary/95 disabled:opacity-50"
                        >
                          {loadingId === t.id ? (
                            <RefreshCw size={12} className="animate-spin inline mr-1" />
                          ) : null}
                          <span>정산 실행</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold font-mono">{t.updatedAt}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
