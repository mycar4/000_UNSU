import React, { useState } from 'react'
import { FileText, Camera, AlertTriangle, ShieldCheck, CheckCircle2, Ban, EyeOff } from 'lucide-react'

interface ReceiptAudit {
  id: string
  driverName: string
  ocrAmount: number
  officialAmount: number
  ocrRoute: string
  status: 'PENDING' | 'APPROVED' | 'ABUSE_BANNED'
}

interface ReportedPost {
  id: string
  author: string
  content: string
  reason: string
  status: 'PENDING' | 'BLINDED' | 'DISMISSED'
}

export function PlazaModeration() {
  const [audits, setAudits] = useState<ReceiptAudit[]>([
    { id: '1', driverName: '서울 개인 9882', ocrAmount: 54200, officialAmount: 54200, ocrRoute: '서울역 → 인천공항 T1', status: 'PENDING' },
    { id: '2', driverName: '인천 개인 1204', ocrAmount: 85000, officialAmount: 25000, ocrRoute: '청라국제도시 → 강남역 (허위 부풀리기 혐의)', status: 'PENDING' },
    { id: '3', driverName: '경기 개인 5530', ocrAmount: 29400, officialAmount: 29400, ocrRoute: '수원 영통 → 가산디지털', status: 'APPROVED' },
  ])

  const [posts, setPosts] = useState<ReportedPost[]>([
    { id: '1', author: '서울 개인 0021', content: '이런 개X같은 카카오 플랫폼 제재 때문에 영업 다 베렸네요 에휴...', reason: '심한 비속어 및 욕설 사용', status: 'PENDING' },
    { id: '2', author: '인천 개인 7001', content: '다들 구석진 데 가셔서 대기하지 마시고 꿀콜 떴을 때 얼른 낚아채세요~', reason: '어뷰징 조장 오독 유도', status: 'PENDING' },
  ])

  const handleApproveReceipt = (id: string, name: string) => {
    setAudits(prev => prev.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a))
    alert(`[승인 완료] ${name} 기사의 영수증 매출이 정상 승인되었습니다.`)
  }

  const handleBanReceipt = (id: string, name: string) => {
    if (confirm(`⚠️ [어뷰징 최종 제재]\n${name} 기사에 대해 리더보드 등극 자격을 박탈하고 일시 주행 인증 계정을 정지하시겠습니까? 이력 보존 로그에 기록됩니다.`)) {
      setAudits(prev => prev.map(a => a.id === id ? { ...a, status: 'ABUSE_BANNED' } : a))
      alert(`[제재 완료] ${name} 기사는 허위 인증 어뷰징으로 분류되어 리더보드 자격이 박탈되었습니다.`)
    }
  }

  const handleBlindPost = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'BLINDED' } : p))
    alert('해당 게시물이 블라인드(숨김) 처리되었습니다.')
  }

  const handleDismissPost = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'DISMISSED' } : p))
    alert('신고가 무혐의 종결 처리되었습니다.')
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">커뮤니티 및 영수증 신뢰 모니터링</h2>
        <p className="text-sm text-muted-foreground">로드보더 기사 광장의 스팸 게시물 검토 및 영수증 OCR 허위 매출 업로드(어뷰징) 심사</p>
      </div>

      {/* Domain 1: 영수증 OCR 대조 심사 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Camera className="text-gold h-5 w-5" />
          <h3 className="font-bold text-lg text-foreground">영수증 OCR 대조 심사 센터</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {audits.map((a) => {
            const discrepancy = Math.abs((a.ocrAmount - a.officialAmount) / a.officialAmount) * 100
            const hasAnomaly = discrepancy > 5
            const isPending = a.status === 'PENDING'

            return (
              <div 
                key={a.id}
                className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden ${
                  hasAnomaly && isPending ? 'border-rose-500/40 bg-rose-500/5' : 'border-border'
                }`}
              >
                {/* Status Badges */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground">{a.driverName}</span>
                  <div className="flex gap-2">
                    {hasAnomaly && isPending && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                        <AlertTriangle size={10} />
                        오차 {discrepancy.toFixed(0)}% 검출 (경고)
                      </span>
                    )}
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      a.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      a.status === 'ABUSE_BANNED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-secondary text-secondary-foreground border-border'
                    }`}>
                      {a.status === 'APPROVED' ? '승인 완료' : a.status === 'ABUSE_BANNED' ? '어뷰징 제재' : '승인 대기'}
                    </span>
                  </div>
                </div>

                {/* Audit Grid Details */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-background border border-border/50 p-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[9px] uppercase font-sans">영수증 OCR 추출 금액</span>
                    <span className="text-sm font-bold text-foreground">₩ {a.ocrAmount.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 border-l border-border/60 pl-4">
                    <span className="text-muted-foreground block text-[9px] uppercase font-sans">실제 카드 결사 정산금</span>
                    <span className={`text-sm font-bold ${hasAnomaly && isPending ? 'text-rose-500' : 'text-foreground'}`}>
                      ₩ {a.officialAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-border/50 pt-2 mt-1 font-sans">
                    <span className="text-muted-foreground block text-[9px]">추출 주행 코스</span>
                    <span className="text-xs font-medium text-foreground">{a.ocrRoute}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {isPending && (
                  <div className="flex gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => handleApproveReceipt(a.id, a.driverName)}
                      className="tap flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow hover:bg-emerald-600 flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 size={13} />
                      매출 승인
                    </button>
                    <button
                      onClick={() => handleBanReceipt(a.id, a.driverName)}
                      className="tap flex-1 py-2 bg-rose-500 text-white rounded-lg text-xs font-bold shadow hover:bg-rose-600 flex items-center justify-center gap-1"
                    >
                      <Ban size={13} />
                      어뷰징 제재
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Domain 2: 기사 광장 신고 관리 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <FileText className="text-gold h-5 w-5" />
          <h3 className="font-bold text-lg text-foreground">기사 광장 커뮤니티 신고 검토</h3>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">대상 기사</th>
                  <th className="py-3 px-2">게시글 내용</th>
                  <th className="py-3 px-2">신고 접수 사유</th>
                  <th className="py-3 px-2 text-center">상태</th>
                  <th className="py-3 px-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {posts.map((p) => {
                  const isPending = p.status === 'PENDING'

                  return (
                    <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-2 font-bold text-foreground">{p.author}</td>
                      <td className="py-3.5 px-2 text-xs max-w-xs truncate text-muted-foreground">"{p.content}"</td>
                      <td className="py-3.5 px-2">
                        <span className="text-xs text-rose-500 font-semibold bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10">
                          {p.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          p.status === 'BLINDED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          p.status === 'DISMISSED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          'bg-secondary text-secondary-foreground border-border'
                        }`}>
                          {p.status === 'BLINDED' ? '블라인드' : p.status === 'DISMISSED' ? '무혐의 종결' : '검토 대기'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleBlindPost(p.id)}
                              className="tap bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white p-1.5 rounded-lg border border-rose-500/20"
                              title="블라인드 숨김 처리"
                            >
                              <EyeOff size={13} />
                            </button>
                            <button
                              onClick={() => handleDismissPost(p.id)}
                              className="tap bg-secondary text-foreground hover:bg-emerald-500 hover:text-white p-1.5 rounded-lg border border-border"
                              title="신고 반려 (무혐의)"
                            >
                              <ShieldCheck size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">완료</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
