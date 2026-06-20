import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ArrowRight, Sparkles, Wrench, Shield, Car, Check, UserPlus } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DriverProfile {
  birthDate: string;
  birthTime: string;
  businessType: 'PRIVATE' | 'PREMIUM';
  homeTaxId: string;
}

interface Financials {
  total_revenue: number;
  fixed_expense: number;
}

export function AutopilotPage() {
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    const id = localStorage.getItem('driverId');
    setDriverId(id);

    if (!id) {
      setOnboardingRequired(true);
      return;
    }

    // 1. Fetch profile to check if driver is registered
    fetch(`${API_HOST}/api/drivers/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Profile not found');
        }
        return res.json();
      })
      .then((profileData: DriverProfile) => {
        setProfile(profileData);
        setOnboardingRequired(false);
        // 2. Fetch monthly financials
        return fetch(`${API_HOST}/api/drivers/${id}/financials`);
      })
      .then((res) => {
        if (res && res.ok) return res.json();
        return null;
      })
      .then((finData: Financials | null) => {
        if (finData) {
          setFinancials(finData);
        }
      })
      .catch((err) => {
        console.warn('[Autopilot] Onboarding required or fetch failed:', err);
        setOnboardingRequired(true);
      });
  }, []);

  const handleCalculate = () => {
    if (!driverId) return;
    setStatus('loading');
    
    fetch(`${API_HOST}/api/drivers/${driverId}/tax-refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        month: new Date().toISOString().slice(0, 7)
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Tax refund calculation failed');
        }
        return res.json();
      })
      .then((data) => {
        setRefundAmount(data.estimatedRefundAmount);
        setStatus('success');
      })
      .catch((err) => {
        console.error('[Autopilot] Calculate error:', err);
        setStatus('idle');
        alert('세무 환급 데이터를 계산하는 도중 오류가 발생했습니다.');
      });
  };

  const benefits = [
    { title: '금호타이어 제휴몰', desc: '기사 전용 20% 추가 할인', icon: Wrench },
    { title: '공식 지정 정비소', desc: '소모품 교환 공임비 15% 감면', icon: Car },
    { title: '종합 소득세 대행', desc: '운수 기사 전문 제휴 세무사 매칭', icon: Calculator },
    { title: '안심 단체 보증', desc: '면허 유지 및 사고 보증 지원', icon: Shield }
  ];

  // Estimated net income based on total revenue and fixed expense
  const revenue = financials?.total_revenue || 4500000;
  const expense = financials?.fixed_expense || 1050000;
  const netIncome = revenue - expense;

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

        {/* 온보딩 미등록 시 안내 배너 */}
        {onboardingRequired && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0 text-destructive">
                <UserPlus size={22} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-lg text-foreground">기사 온보딩 프로필 미등록</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  자율 세무/정산 및 실시간 연동을 활성화하려면 먼저 생년월일과 홈택스 계정 등 마스터 정보를 설정해야 합니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              className="tap bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow hover:bg-primary/95"
            >
              <span>1분 만에 기사 마스터 설정 완료하기</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* 1. 수익 및 고정비 실시간 전광판 */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="mono-label text-[10px] text-muted-foreground font-bold">이번 달 경영 지표 요약</span>
            <span className="text-[11px] text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/15">실시간 집계</span>
          </div>

          <div className="flex flex-col gap-1 py-2">
            <span className="text-sm text-muted-foreground">예상 순수익</span>
            <div className="text-4xl sm:text-5xl font-extrabold text-gold tracking-tight font-mono">
              ₩ {netIncome.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/50 pt-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">총 운행 매출</span>
              <span className="text-lg font-bold text-foreground font-mono">₩ {revenue.toLocaleString()}</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-4">
              <span className="text-xs text-muted-foreground">고정 지출 (연료/보험)</span>
              <span className="text-lg font-bold text-foreground/80 font-mono">₩ {expense.toLocaleString()}</span>
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
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-5 flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="text-gold h-5 w-5 flex-shrink-0" />
                <div className="text-base text-foreground font-semibold">
                  예상 부가세 환급액: <span className="text-gold font-mono font-bold">₩ {refundAmount.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground border-t border-gold/20 pt-2">
                {profile?.businessType === 'PREMIUM' 
                  ? '* 일반과세자 부가세 매입세액 100% 전액 환급이 적용되었습니다.' 
                  : '* 개인택시 간이과세자 신용카드 등 공제 가중치 50%가 적용되었습니다.'}
              </p>
            </div>
          )}

          <div>
            <button 
              onClick={handleCalculate}
              disabled={status === 'loading' || onboardingRequired}
              className={`tap w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-md ${
                status === 'loading' 
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : onboardingRequired
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

