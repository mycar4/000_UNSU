import React, { useState } from 'react'

export function VectorCapacity() {
  const [totalVectors, setTotalVectors] = useState(48210)
  const [indexing, setIndexing] = useState(false)

  const handleReindex = () => {
    setIndexing(true)
    setTimeout(() => {
      setTotalVectors((prev) => prev + 124)
      setIndexing(false)
      alert('벡터 데이터베이스 리인덱싱이 정상적으로 완료되었습니다.')
    }, 1200)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">벡터 임베딩 저장소 모니터링</h2>
        <p className="text-sm text-muted-foreground">Supabase Vector DB의 용량 상태 및 유사도 검색 레이턴시 인덱스를 실시간 관제합니다.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">임베딩 스토리지 및 인덱스</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">누적 벡터 레코드</span>
              <span className="font-semibold">{totalVectors.toLocaleString()} / 100,000 (48.2%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '48.2%' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <span className="mono-label text-[10px] text-muted-foreground">마지막 빌드 시간</span>
              <div className="text-sm font-semibold mt-1">2026-06-19 14:02:18</div>
            </div>
            <div>
              <span className="mono-label text-[10px] text-muted-foreground">인덱스 상태</span>
              <div className="text-sm font-semibold text-emerald-500 mt-1">정상 (ACTIVE)</div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleReindex}
              disabled={indexing}
              className="tap w-full rounded-full border border-border bg-background py-2 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {indexing ? '인덱싱 진행 중...' : '인덱싱 강제 동기화 (Rebuild)'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">RAG 검색 속도 벤치마크 (Similarity Latency)</h3>

          <div className="space-y-4">
            {[
              { query: '강남역 심야 할증 교통 분석', latency: '42ms', similarity: '0.942' },
              { query: '김포공항 국내선 게이트 대기열', latency: '58ms', similarity: '0.887' },
              { query: '여의도 교차로 비 오는 날 핫존', latency: '49ms', similarity: '0.912' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center rounded-lg bg-secondary/40 p-3 border border-border">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold">{item.query}</div>
                  <span className="mono-label text-[9px] text-muted-foreground">유사도 점수: {item.similarity}</span>
                </div>
                <div className="text-sm font-bold font-mono text-primary">{item.latency}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
