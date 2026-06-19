import React, { useState } from 'react';
import { Calculator, ArrowRight, Sparkles, Wrench, Shield, Car, Check } from 'lucide-react';

export function AutopilotPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [refundAmount, setRefundAmount] = useState(0);

  const handleCalculate = () => {
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setRefundAmount(428000); // 42만 8천원 환급 예상
    }, 1500);
  };

  const benefits = [
    { title: '금호타이어 제휴몰', desc: '기사 전용 20% 추가 할인', icon: Wrench, link: '#' },
    { title: '공식 지정 정비소', desc: '소모품 교환 공임비 15% 감면', icon: Car, link: '#' },
    { title: '종합 소득세 대행', desc: '운수 기사 전문 제휴 세무사 매칭', icon: Calculator, link: '#' },
    { title: '안심 단체 보증', desc: '면허 유지 및 사고 보증 지원', icon: Shield, link: '#' }
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6">
      {/* 백그라운드 효과 */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      
      <div className="relative px-5 flex flex-col gap-8">
        
        {/* 헤더 */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-foreground opacity-60" />
            <span className="mono-label text-[11px] text-muted-foreground font-bold">AUTOPILOT CONTROLLER</span>
          </div>
          <h2 className="hero-head text-foreground mt-1">오토파일럿</h2>
          <p className="text-body-lg text-muted-foreground">스마트 경영 및 1초 모바일 부가세 환급 대행</p>
        </header>

        {/* 1. 수익 및 고정비 실시간 전광판 */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="mono-label text-[10px] text-muted-foreground font-bold">이번 달 경영 지표 요약</span>
            <span className="text-[11px] text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/15">실시간 집계</span>
          </div>

          <div className="flex flex-col gap-1 py-2">
            <span className="text-sm text-muted-foreground">예상 순수익</span>
            <div className="text-4xl sm:text-5xl font-extrabold text-gold tracking-tight font-mono">
              ₩ 3,450,000
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/50 pt-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">총 운행 매출</span>
              <span className="text-lg font-bold text-foreground font-mono">₩ 4,500,000</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-4">
              <span className="text-xs text-muted-foreground">고정 지출 (연료/보험)</span>
              <span className="text-lg font-bold text-foreground/80 font-mono">₩ 1,050,000</span>
            </div>
          </div>
        </section>

        {/* 2. 원클릭 정산 트리거 카드 */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0 text-primary">
              <Calculator size={22} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-xl text-foreground">홈택스 실시간 간편 환급</h3>
              <p className="text-body-lg text-muted-foreground leading-relaxed">
                복잡한 자료 입력 없이 국세청 홈택스에 동기화하여 실시간 부가세/종소세 환급액을 분석합니다.
              </p>
            </div>
          </div>

          {status === 'success' && (
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 flex items-center gap-3">
              <Sparkles className="text-gold h-5 w-5 flex-shrink-0" />
              <div className="text-base text-foreground font-semibold">
                이번 달 예상 부가세 환급액: <span className="text-gold font-mono font-bold">₩ 428,000</span>
              </div>
            </div>
          )}

          <div>
            <button 
              onClick={handleCalculate}
              disabled={status === 'loading'}
              className={`tap w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-md ${
                status === 'loading' 
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/95'
              }`}
            >
              {status === 'idle' && (
                <>
                  <span>1초 만에 자동 정산하기</span>
                  <ArrowRight size={18} />
                </>
              )}
              {status === 'loading' && (
                <>
                  <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  <span>홈택스 데이터 조회 중...</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <Check size={18} className="text-primary-foreground" />
                  <span>분석 완료 (다시 정산하기)</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 3. 제휴 혜택 그리드 */}
        <section className="flex flex-col gap-4">
          <h3 className="font-bold text-xl text-foreground">제휴 기사 혜택</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div 
                  key={i} 
                  className="tap bg-card border border-border/80 rounded-xl p-4 flex items-center gap-4 hover:border-gold/30 hover:bg-card/90"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground flex-shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-bold text-foreground">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
