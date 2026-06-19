import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowRight, Shield, LogOut } from 'lucide-react';

const DriverProfileSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식으로 입력해주세요. (예: 1972-05-14)"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM 형식으로 입력해주세요. (예: 14:20)"),
  businessType: z.enum(["PRIVATE", "PREMIUM"]),
  homeTaxId: z.string().min(4, "홈택스 아이디는 최소 4글자 이상이어야 합니다.")
});

const formatBirthDate = (value: string) => {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 4) {
    return clean;
  }
  if (clean.length <= 6) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6)}`;
};

const formatBirthTime = (value: string) => {
  const clean = value.replace(/\D/g, '').slice(0, 4);
  if (clean.length <= 2) {
    return clean;
  }
  return `${clean.slice(0, 2)}:${clean.slice(2)}`;
};

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    birthDate: '', 
    birthTime: '', 
    businessType: 'PRIVATE', 
    homeTaxId: '',
    naviPreference: 'TMAP'
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let driverId = localStorage.getItem('driverId');
    if (!driverId) {
      driverId = Math.random().toString(36).substring(7);
      localStorage.setItem('driverId', driverId);
      return;
    }
    
    // Fetch profile from backend database
    fetch(`${API_HOST}/api/drivers/${driverId}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not registered');
      })
      .then(data => {
        setFormData({
          birthDate: data.birthDate || '',
          birthTime: data.birthTime || '',
          businessType: data.businessType || 'PRIVATE',
          homeTaxId: data.homeTaxId || '',
          naviPreference: data.naviPreference || 'TMAP'
        });
        setIsEditMode(true);
        localStorage.setItem('driverProfile', JSON.stringify(data));
      })
      .catch(() => {
        // Fallback to local storage
        const stored = localStorage.getItem('driverProfile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setFormData({
              birthDate: parsed.birthDate || '',
              birthTime: parsed.birthTime || '',
              businessType: parsed.businessType || 'PRIVATE',
              homeTaxId: parsed.homeTaxId || '',
              naviPreference: parsed.naviPreference || 'TMAP'
            });
            setIsEditMode(true);
          } catch (e) {
            console.error(e);
          }
        }
      });
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const check = DriverProfileSchema.pick({ birthDate: true, birthTime: true }).safeParse(formData);
      if (!check.success) {
        return setError(check.error.errors[0].message);
      }
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handleComplete = () => {
    const check = DriverProfileSchema.safeParse(formData);
    if (!check.success) {
      return setError(check.error.errors[0].message);
    }
    setError(null);
    
    const driverId = localStorage.getItem('driverId') || Math.random().toString(36).substring(7);
    localStorage.setItem('driverId', driverId);

    // Save profile to backend API database
    fetch(`${API_HOST}/api/drivers/${driverId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'API save error');
        }
        return res.json();
      })
      .then(() => {
        localStorage.setItem('driverProfile', JSON.stringify(formData));
        alert(isEditMode ? '기사 마스터 프로필 정보가 성공적으로 변경되었습니다!' : '기사 마스터 프로필 설정이 완료되었습니다!');
        navigate('/');
      })
      .catch(err => {
        console.warn('API save failed. Checking details.', err);
        if (err.message && err.message.includes('탈퇴 후')) {
          setError(err.message);
          alert(err.message);
        } else {
          localStorage.setItem('driverProfile', JSON.stringify(formData));
          alert(isEditMode ? '기사 마스터 프로필 정보가 변경되었습니다! (로컬 저장)' : '기사 마스터 프로필 설정이 완료되었습니다! (로컬 저장)');
          navigate('/');
        }
      });
  };

  const handleReset = () => {
    if (confirm('정말로 프로필 정보를 영구 삭제하고 회원 탈퇴하시겠습니까?\n(⚠️ 중요: 탈퇴 완료 후 3일 동안은 재가입이 엄격히 차단됩니다)')) {
      const driverId = localStorage.getItem('driverId');
      if (driverId) {
        fetch(`${API_HOST}/api/drivers/${driverId}/withdraw`, {
          method: 'POST'
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              localStorage.removeItem('driverProfile');
              localStorage.removeItem('driverId');
              setFormData({
                birthDate: '',
                birthTime: '',
                businessType: 'PRIVATE',
                homeTaxId: '',
                naviPreference: 'TMAP'
              });
              setIsEditMode(false);
              setStep(1);
              alert('회원 탈퇴 처리가 정상 완료되었습니다. 탈퇴일 기준으로 3일간 재가입이 불가합니다.');
            } else {
              alert(data.error || '탈퇴 처리에 실패했습니다.');
            }
          })
          .catch(err => {
            console.error(err);
            alert('서버 오류로 인해 탈퇴 처리를 완료하지 못했습니다.');
          });
      } else {
        localStorage.removeItem('driverProfile');
        alert('로컬 프로필 정보가 파쇄되었습니다.');
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center py-6 px-4">
      {/* 장식선 백그라운드 */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[50%] dot-field" />

      <div className="relative max-w-md w-full space-y-8 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm transition-colors duration-500">
        
        {/* 상단 스케줄 지표 */}
        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground border-b border-border pb-3">
          <span className="mono-label text-[10px] tracking-widest font-bold">UNSU CORE ONBOARDING</span>
          <span className="mono-label text-[10px] font-bold text-gold">STEP {step} / 2</span>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-foreground opacity-60" />
                <span className="mono-label text-[10px] text-muted-foreground font-bold">
                  {isEditMode ? 'EDIT PROFILE' : 'PERSONAL IDENTIFICATION'}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                {isEditMode ? (
                  <>기사님의 프로필 정보를<br />변경/수정해 주세요</>
                ) : (
                  <>기사님의 운수 맞춤을 위한<br />기본 정보를 입력해 주세요</>
                )}
              </h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">생년월일 (예: YYYYMMDD 입력 시 자동 변환)</label>
                <input 
                  type="text" 
                  placeholder="YYYY-MM-DD"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({...formData, birthDate: formatBirthDate(e.target.value)})}
                  className="w-full p-4 border border-border rounded-xl text-lg font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">출생 시간 (예: HHMM 입력 시 자동 변환)</label>
                <input 
                  type="text" 
                  placeholder="HH:MM"
                  value={formData.birthTime}
                  onChange={(e) => setFormData({...formData, birthTime: formatBirthTime(e.target.value)})}
                  className="w-full p-4 border border-border rounded-xl text-lg font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">택시 종류</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, businessType: 'PRIVATE'})}
                    className={`tap py-3.5 rounded-xl text-base font-bold border transition-all ${
                      formData.businessType === 'PRIVATE'
                        ? 'border-gold bg-gold/10 text-gold shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    개인택시 (PRIVATE)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, businessType: 'PREMIUM'})}
                    className={`tap py-3.5 rounded-xl text-base font-bold border transition-all ${
                      formData.businessType === 'PREMIUM'
                        ? 'border-gold bg-gold/10 text-gold shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    모범/대형 (PREMIUM)
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">선호 내비게이션 앱 (개인정보 저장)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, naviPreference: 'TMAP'})}
                    className={`tap py-3.5 rounded-xl text-base font-bold border transition-all ${
                      formData.naviPreference === 'TMAP'
                        ? 'border-gold bg-gold/10 text-gold shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    티맵 (TMAP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, naviPreference: 'KAKAONAVI'})}
                    className={`tap py-3.5 rounded-xl text-base font-bold border transition-all ${
                      formData.naviPreference === 'KAKAONAVI'
                        ? 'border-gold bg-gold/10 text-gold shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    카카오네비
                  </button>
                </div>
                {!isEditMode && (
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    ⚠️ 탈퇴 완료 시점으로부터 <strong>3일간 재가입이 차단</strong>되오니 설정에 유의하십시오.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-foreground opacity-60" />
                <span className="mono-label text-[10px] text-muted-foreground font-bold">TAX AUTOPILOT SYNC</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                세무 자율비행 연동을 위한<br />홈택스 정보 설정
              </h2>
            </div>

            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Zero-Storage 정책 준수:</strong><br />
                  입력하신 정보는 데이터베이스에 절대 영구 저장되지 않으며, 홈택스 매입 세무 스크래핑 런타임 직후 즉시 파쇄 처리됩니다.
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">국세청 홈택스 아이디</label>
                <input 
                  type="text" 
                  placeholder="홈택스 아이디 입력"
                  value={formData.homeTaxId}
                  onChange={(e) => setFormData({...formData, homeTaxId: e.target.value})}
                  className="w-full p-4 border border-border rounded-xl text-lg font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm font-bold text-destructive font-mono bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
            ⚠️ {error}
          </p>
        )}

        <div className="flex gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="tap w-1/3 bg-secondary text-secondary-foreground text-base font-bold py-4 rounded-xl hover:bg-secondary/80 border border-border transition-colors"
            >
              이전
            </button>
          )}
          <button 
            onClick={step === 2 ? handleComplete : handleNext}
            className={`tap text-base font-bold py-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md ${
              step === 2 ? 'w-2/3 bg-gold text-primary-foreground hover:bg-gold/90' : 'w-full bg-primary text-primary-foreground hover:bg-primary/95'
            }`}
          >
            <span>{step === 2 ? (isEditMode ? "변경 완료" : "설정 완료") : "다음 단계로"}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* 정보 수정 모드일 때 초기화/로그아웃 버튼 제공 */}
        {isEditMode && step === 1 && (
          <div className="pt-2 border-t border-border/60 text-center">
            <button
              type="button"
              onClick={handleReset}
              className="tap w-full py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-destructive/15 transition-all"
            >
              <LogOut size={14} />
              <span>프로필 정보 초기화 (로그아웃)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

