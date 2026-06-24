import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowRight, Shield, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

declare global {
  interface Window {
    daum: any;
  }
}

const DriverProfileSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식으로 입력해주세요. (예: 1972-05-14)").refine((val: string) => {
    const parts = val.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const currentYear = new Date().getFullYear();
    if (year < 1930 || year > currentYear) return false;
    
    // Validate actual date existence (e.g. Feb 30th)
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day;
  }, { message: "생년월일이 정상 범위를 벗어났습니다. 올바른 날짜를 입력해주세요." }),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM 형식으로 입력해주세요. (예: 14:20)").refine((val: string) => {
    const [h, m] = val.split(':').map(Number);
    return h >= 0 && h < 24 && m >= 0 && m < 60;
  }, { message: "출생 시간이 정상 범위를 벗어났습니다. (00:00 ~ 23:59)" }),
  businessType: z.enum(["PRIVATE", "PREMIUM"]),
  homeTaxId: z.string().min(4, "홈택스 아이디는 최소 4글자 이상이어야 합니다.").max(15, "홈택스 아이디는 최대 15자까지 입력 가능합니다."),
  name: z.string().min(2, "이름은 최소 2글자 이상이어야 합니다.").max(10, "이름은 최대 10자까지 입력 가능합니다."),
  phoneNumber: z.string().min(8, "올바른 전화번호를 입력해주세요.").max(20, "전화번호는 최대 20자까지 입력 가능합니다.")
});

const formatBirthDate = (value: string) => {
  let clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 4) {
    const year = clean.slice(0, 4);
    let month = clean.slice(4, 6);
    let day = clean.slice(6, 8);

    if (month.length === 2) {
      const mNum = parseInt(month, 10);
      if (mNum > 12) month = '12';
      else if (mNum === 0) month = '01';
    } else if (month.length === 1) {
      const mFirst = parseInt(month, 10);
      if (mFirst > 1) month = `0${month}`;
    }

    if (day.length === 2) {
      const dNum = parseInt(day, 10);
      const mNum = parseInt(month, 10);
      const yNum = parseInt(year, 10);
      
      // Calculate max day for the month
      let maxDay = 31;
      if (month.length === 2 && !isNaN(mNum)) {
        if ([4, 6, 9, 11].includes(mNum)) {
          maxDay = 30;
        } else if (mNum === 2) {
          const isLeap = (yNum % 4 === 0 && yNum % 100 !== 0) || (yNum % 400 === 0);
          maxDay = isLeap ? 29 : 28;
        }
      }

      if (dNum > maxDay) day = String(maxDay);
      else if (dNum === 0) day = '01';
    } else if (day.length === 1) {
      const dFirst = parseInt(day, 10);
      if (dFirst > 3) day = `0${day}`;
    }

    clean = year + month + day;
  }

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

const formatPhoneNumber = (value: string) => {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 3) {
    return clean;
  }
  if (clean.length <= 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
};

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const KNOWN_CARS = [
  '현대 그랜저',
  '현대 쏘나타',
  '현대 아이오닉 5',
  '기아 K8',
  '기아 K5',
  '기아 EV6'
];

// 개인정보 보호용 마스킹 헬퍼 함수들
const maskName = (name: string) => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
};

const maskPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const parts = phone.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-****-${parts[2]}`;
  }
  return phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-****-$3');
};

const maskBirthDate = (date: string) => {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-**-**`;
  }
  return date;
};

const maskBirthTime = (time: string) => {
  if (!time) return '';
  return '**:**';
};

const maskHomeTaxId = (id: string) => {
  if (!id) return '';
  if (id.length <= 3) return '*'.repeat(id.length);
  return id.slice(0, 3) + '*'.repeat(id.length - 3);
};

const maskCarNumber = (num: string) => {
  if (!num) return '';
  if (num.length <= 4) return '*'.repeat(num.length);
  return num.slice(0, num.length - 4) + '****';
};

const maskEmail = (email: string) => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length === 2) {
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 3) return '*'.repeat(name.length) + '@' + domain;
    return name.slice(0, 3) + '*'.repeat(name.length - 3) + '@' + domain;
  }
  return email;
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setIsOnDuty } = useTheme();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    birthDate: '', 
    birthTime: '', 
    businessType: 'PRIVATE', 
    homeTaxId: '',
    naviPreference: 'TMAP',
    name: '',
    phoneNumber: '',
    carModel: '',
    carNumber: '',
    email: '',
    address: '',
    detailAddress: ''
  });

  // 인트로 이미지 미리보기 상태
  const [introPreview, setIntroPreview] = useState<string>('');
  const introFileInputRef = React.useRef<HTMLInputElement>(null);

  // 마스킹 토글 여부 상태
  const [unmaskedFields, setUnmaskedFields] = useState<Record<string, boolean>>({
    name: false,
    phoneNumber: false,
    birthDate: false,
    birthTime: false,
    homeTaxId: false,
    carNumber: false,
    email: false
  });
  const [addressSaved, setAddressSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 3) {
      // 3단계 진입 시 최신 인트로 이미지 미리보기 정보 로드
      fetch(`${API_HOST}/api/global/intro-image`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('No custom image');
        })
        .then(data => {
          if (data.introImage) setIntroPreview(data.introImage);
        })
        .catch(err => console.log('[Onboarding] Custom intro image fetch failed, using default.', err));
    }
  }, [step]);

  const handleIntroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('이미지 크기는 최대 2MB 이하여야 합니다.');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const res = await fetch(`${API_HOST}/api/global/intro-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ introImage: base64 })
          });
          if (res.ok) {
            setIntroPreview(base64);
            alert('서비스 인트로 이미지가 성공적으로 변경되었습니다!');
          } else {
            alert('인트로 이미지 업로드에 실패했습니다.');
          }
        } catch (err) {
          console.error(err);
          alert('서버 연결 실패. 인트로 이미지를 업데이트하지 못했습니다.');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Track dropdown brand selection
  const [carSelectionMode, setCarSelectionMode] = useState<'dropdown' | 'manual'>('dropdown');
  const [selectedKnownCar, setSelectedKnownCar] = useState('현대 그랜저');

  useEffect(() => {
    const scriptId = 'daum-postcode-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSearchAddress = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          let fullAddress = data.roadAddress || data.jibunAddress;
          if (data.buildingName) {
            fullAddress += ` (${data.buildingName})`;
          }
          setFormData(prev => ({ ...prev, address: fullAddress, detailAddress: '' }));
          setAddressSaved(false); // Enable detailed address entry mode before saving
        }
      }).open();
    } else {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

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
        let baseAddr = data.address || '';
        let detailAddr = '';
        if (baseAddr.includes(' | ')) {
          const parts = baseAddr.split(' | ');
          baseAddr = parts[0];
          detailAddr = parts.slice(1).join(' | ');
        }
        setFormData({
          birthDate: data.birthDate || '',
          birthTime: data.birthTime || '',
          businessType: data.businessType || 'PRIVATE',
          homeTaxId: data.homeTaxId || '',
          naviPreference: data.naviPreference || 'TMAP',
          name: data.name || '',
          phoneNumber: data.phoneNumber || '',
          carModel: data.carModel || '',
          carNumber: data.carNumber || '',
          email: data.email || '',
          address: baseAddr,
          detailAddress: detailAddr
        });
        if (baseAddr) {
          setAddressSaved(true);
        }
        setIsEditMode(true);
        localStorage.setItem('driverProfile', JSON.stringify(data));
        
        // Handle car model setting dropdown vs manual
        if (data.carModel) {
          if (KNOWN_CARS.includes(data.carModel)) {
            setSelectedKnownCar(data.carModel);
            setCarSelectionMode('dropdown');
          } else {
            setCarSelectionMode('manual');
          }
        }
      })
      .catch(() => {
        // Fallback to local storage
        const stored = localStorage.getItem('driverProfile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            let baseAddr = parsed.address || '';
            let detailAddr = '';
            if (baseAddr.includes(' | ')) {
              const parts = baseAddr.split(' | ');
              baseAddr = parts[0];
              detailAddr = parts.slice(1).join(' | ');
            }
            setFormData({
              birthDate: parsed.birthDate || '',
              birthTime: parsed.birthTime || '',
              businessType: parsed.businessType || 'PRIVATE',
              homeTaxId: parsed.homeTaxId || '',
              naviPreference: parsed.naviPreference || 'TMAP',
              name: parsed.name || '',
              phoneNumber: parsed.phoneNumber || '',
              carModel: parsed.carModel || '',
              carNumber: parsed.carNumber || '',
              email: parsed.email || '',
              address: baseAddr,
              detailAddress: detailAddr
            });
            if (baseAddr) {
              setAddressSaved(true);
            }
            setIsEditMode(true);
            
            if (parsed.carModel) {
              if (KNOWN_CARS.includes(parsed.carModel)) {
                setSelectedKnownCar(parsed.carModel);
                setCarSelectionMode('dropdown');
              } else {
                setCarSelectionMode('manual');
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const check = DriverProfileSchema.pick({ birthDate: true, birthTime: true, name: true, phoneNumber: true }).safeParse(formData);
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

    // Prepare final form data (if in dropdown mode, use selectedKnownCar)
    const finalForm = { ...formData };
    if (carSelectionMode === 'dropdown') {
      finalForm.carModel = selectedKnownCar;
    }
    // Combine base address and detailed address to preserve it during Step 2 save
    if (formData.address) {
      finalForm.address = formData.detailAddress 
        ? `${formData.address} | ${formData.detailAddress}`
        : formData.address;
    }

    // Save profile to backend API database (Step 2 completed - Required)
    fetch(`${API_HOST}/api/drivers/${driverId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalForm)
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'API save error');
        }
        return res.json();
      })
      .then(() => {
        localStorage.setItem('driverProfile', JSON.stringify(finalForm));
        setIsOnDuty(true);
        localStorage.setItem('isRestMode', 'false');
        alert(isEditMode ? '기사 마스터 프로필 정보가 성공적으로 변경되었습니다!' : '기사 마스터 프로필 설정이 완료되었습니다!');
        
        // Go to optional Step 3
        setStep(3);
      })
      .catch(err => {
        console.warn('API save failed. Checking details.', err);
        if (err.message && err.message.includes('탈퇴 후')) {
          setError(err.message);
          alert(err.message);
        } else {
          localStorage.setItem('driverProfile', JSON.stringify(finalForm));
          setIsOnDuty(true);
          localStorage.setItem('isRestMode', 'false');
          alert(isEditMode ? '기사 마스터 프로필 정보가 변경되었습니다! (로컬 저장)' : '기사 마스터 프로필 설정이 완료되었습니다! (로컬 저장)');
          setStep(3);
        }
      });
  };

  const handleSaveAdditionalInfo = () => {
    // Validate optional commercial vehicle number format (strip spaces first)
    if (formData.carNumber) {
      const cleanCarNum = formData.carNumber.replace(/\s+/g, '');
      const carNumCheck = z.string().regex(/^([가-힣]{2})?[0-9]{2,3}[가-힣]{1}[0-9]{4}$/, '올바른 영업용 차량번호 형식이 아닙니다. (예: 서울31아9993 또는 31아1234)').safeParse(cleanCarNum);
      if (!carNumCheck.success) {
        return setError(carNumCheck.error.errors[0].message);
      }
    }

    // If optional email is entered, validate format
    if (formData.email) {
      const emailCheck = z.string().email().safeParse(formData.email);
      if (!emailCheck.success) {
        return setError('올바른 이메일 주소 형식을 입력해주세요.');
      }
    }
    setError(null);

    const driverId = localStorage.getItem('driverId');
    if (!driverId) {
      navigate('/');
      return;
    }

    const finalForm = { ...formData };
    if (formData.carNumber) {
      finalForm.carNumber = formData.carNumber.replace(/\s+/g, '');
    }
    if (carSelectionMode === 'dropdown') {
      finalForm.carModel = selectedKnownCar;
    }
    // Combine base address and detailed address
    if (formData.address) {
      finalForm.address = formData.detailAddress 
        ? `${formData.address} | ${formData.detailAddress}`
        : formData.address;
    }

    fetch(`${API_HOST}/api/drivers/${driverId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalForm)
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'API save error');
        }
        return res.json();
      })
      .then(() => {
        localStorage.setItem('driverProfile', JSON.stringify(finalForm));
        alert('추가 기사 정보가 성공적으로 저장되었습니다!');
        navigate('/');
      })
      .catch(err => {
        console.error(err);
        localStorage.setItem('driverProfile', JSON.stringify(finalForm));
        alert('추가 정보가 저장되었습니다. (로컬 동기화)');
        navigate('/');
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('driverProfile');
    localStorage.removeItem('driverId');
    setIsOnDuty(false);
    localStorage.setItem('isRestMode', 'true');
    setFormData({
      birthDate: '',
      birthTime: '',
      businessType: 'PRIVATE',
      homeTaxId: '',
      naviPreference: 'TMAP',
      name: '',
      phoneNumber: '',
      carModel: '',
      carNumber: '',
      email: '',
      address: '',
      detailAddress: ''
    });
    setIsEditMode(false);
    setStep(1);
    alert('로그아웃 되었습니다.');
  };

  const handleWithdrawal = () => {
    if (confirm('정말로 회원 탈퇴하시겠습니까?\n모든 세무/정산 및 운행 데이터가 영구적으로 삭제되며, 탈퇴 시점부터 3일간 재가입이 엄격히 제한됩니다.')) {
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
              setIsOnDuty(false);
              localStorage.setItem('isRestMode', 'true');
              setFormData({
                birthDate: '',
                birthTime: '',
                businessType: 'PRIVATE',
                homeTaxId: '',
                naviPreference: 'TMAP',
                name: '',
                phoneNumber: '',
                carModel: '',
                carNumber: '',
                email: '',
                address: '',
                detailAddress: ''
              });
              setIsEditMode(false);
              setStep(1);
              alert('회원 탈퇴 처리가 정상 완료되었습니다. 탈퇴일 기준으로 3일간 재가입이 제한됩니다.');
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
        setIsOnDuty(false);
        localStorage.setItem('isRestMode', 'true');
        alert('로컬 프로필 정보가 파쇄되었습니다.');
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center py-6 px-4 animate-slide-in-right">
      {/* 장식선 백그라운드 */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[50%] dot-field" />

      <div className="relative max-w-md w-full space-y-8 bg-card border border-border rounded-2xl p-6 shadow-sm transition-colors duration-500">
        
        {/* 상단 스케줄 지표 */}
        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground border-b border-border pb-3">
          <span className="mono-label text-[10px] tracking-widest font-bold">UNSU CORE ONBOARDING</span>
          <span className="mono-label text-[10px] font-bold text-gold">STEP {step} / 3</span>
        </div>

        {step === 1 && (
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">이름</label>
                  <input 
                    type="text" 
                    placeholder="이름 입력"
                    value={isEditMode && !unmaskedFields.name ? maskName(formData.name) : formData.name}
                    maxLength={10}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    onFocus={() => setUnmaskedFields(prev => ({ ...prev, name: true }))}
                    onBlur={() => setUnmaskedFields(prev => ({ ...prev, name: false }))}
                    className="w-full p-3 border border-border rounded-xl text-base font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">전화번호</label>
                  <input 
                    type="text" 
                    placeholder="전화번호 입력"
                    value={isEditMode && !unmaskedFields.phoneNumber ? maskPhoneNumber(formData.phoneNumber) : formData.phoneNumber}
                    maxLength={20}
                    onChange={(e) => setFormData({...formData, phoneNumber: formatPhoneNumber(e.target.value)})}
                    onFocus={() => setUnmaskedFields(prev => ({ ...prev, phoneNumber: true }))}
                    onBlur={() => setUnmaskedFields(prev => ({ ...prev, phoneNumber: false }))}
                    className="w-full p-3 border border-border rounded-xl text-base font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">생년월일 (8자리)</label>
                  <input 
                    type="text" 
                    placeholder="YYYY-MM-DD"
                    value={isEditMode && !unmaskedFields.birthDate ? maskBirthDate(formData.birthDate) : formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: formatBirthDate(e.target.value)})}
                    onFocus={() => setUnmaskedFields(prev => ({ ...prev, birthDate: true }))}
                    onBlur={() => setUnmaskedFields(prev => ({ ...prev, birthDate: false }))}
                    className="w-full p-3 border border-border rounded-xl text-base font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">출생 시간 (4자리)</label>
                  <input 
                    type="text" 
                    placeholder="HH:MM"
                    value={isEditMode && !unmaskedFields.birthTime ? maskBirthTime(formData.birthTime) : formData.birthTime}
                    onChange={(e) => setFormData({...formData, birthTime: formatBirthTime(e.target.value)})}
                    onFocus={() => setUnmaskedFields(prev => ({ ...prev, birthTime: true }))}
                    onBlur={() => setUnmaskedFields(prev => ({ ...prev, birthTime: false }))}
                    className="w-full p-3 border border-border rounded-xl text-base font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">택시 종류</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, businessType: 'PRIVATE'})}
                    className={`tap py-3 rounded-xl text-sm font-bold border transition-all ${
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
                    className={`tap py-3 rounded-xl text-sm font-bold border transition-all ${
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
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">선호 내비게이션 앱</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, naviPreference: 'TMAP'})}
                    className={`tap py-3 rounded-xl text-sm font-bold border transition-all ${
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
                    className={`tap py-3 rounded-xl text-sm font-bold border transition-all ${
                      formData.naviPreference === 'KAKAONAVI'
                        ? 'border-gold bg-gold/10 text-gold shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    카카오네비
                  </button>
                </div>
                {!isEditMode && (
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    ⚠️ 탈퇴 완료 시점으로부터 <strong>3일간 재가입이 차단</strong>되오니 설정에 유의하십시오.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
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
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Zero-Storage 정책 준수:</strong><br />
                  입력하신 정보는 데이터베이스에 절대 영구 저장되지 않으며, 홈택스 매입 세무 스크래핑 런타임 직후 즉시 파쇄 처리됩니다.
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-muted-foreground block mb-2">국세청 홈택스 아이디</label>
                <input 
                  type="text" 
                  placeholder="홈택스 아이디 입력"
                  value={isEditMode && !unmaskedFields.homeTaxId ? maskHomeTaxId(formData.homeTaxId) : formData.homeTaxId}
                  maxLength={15}
                  onChange={(e) => setFormData({...formData, homeTaxId: e.target.value})}
                  onFocus={() => setUnmaskedFields(prev => ({ ...prev, homeTaxId: true }))}
                  onBlur={() => setUnmaskedFields(prev => ({ ...prev, homeTaxId: false }))}
                  className="w-full p-4 border border-border rounded-xl text-lg font-medium bg-background text-foreground focus:outline-none focus:border-gold transition-colors font-sans"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-foreground opacity-60" />
                <span className="mono-label text-[10px] text-gold font-bold">OPTIONAL DETAILS</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                CS 및 마케팅 혜택 수신을 위한<br />추가 기사 정보 입력 (선택)
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                차량 상세 정보와 연락 수단을 설정하면 제휴 할인 혜택 PUSH 알림을 받거나 간편한 CS 처리가 가능해집니다.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">차종 선택</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCarSelectionMode('dropdown');
                      setFormData({ ...formData, carModel: selectedKnownCar });
                    }}
                    className={`tap flex-1 py-2 text-xs font-bold rounded-lg border ${
                      carSelectionMode === 'dropdown'
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    제휴 주요 차종
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCarSelectionMode('manual');
                      setFormData({ ...formData, carModel: '' });
                    }}
                    className={`tap flex-1 py-2 text-xs font-bold rounded-lg border ${
                      carSelectionMode === 'manual'
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    기타 (직접 입력)
                  </button>
                </div>

                {carSelectionMode === 'dropdown' ? (
                  <select
                    value={selectedKnownCar}
                    onChange={(e) => {
                      setSelectedKnownCar(e.target.value);
                      setFormData({ ...formData, carModel: e.target.value });
                    }}
                    className="w-full p-3.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:border-gold"
                  >
                    {KNOWN_CARS.map(car => (
                      <option key={car} value={car}>{car}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="차종 입력 (예: 제네시스 G80)"
                    value={formData.carModel}
                    maxLength={30}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    className="w-full p-3.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:border-gold font-sans"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">차량 번호</label>
                <input
                  type="text"
                  placeholder="예: 서울31아 9993"
                  value={isEditMode && !unmaskedFields.carNumber ? maskCarNumber(formData.carNumber) : formData.carNumber}
                  maxLength={14}
                  onChange={(e) => setFormData({ ...formData, carNumber: e.target.value })}
                  onFocus={() => setUnmaskedFields(prev => ({ ...prev, carNumber: true }))}
                  onBlur={() => setUnmaskedFields(prev => ({ ...prev, carNumber: false }))}
                  className="w-full p-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:border-gold font-sans"
                />
                <p className="text-[10px] text-muted-foreground/80 mt-1 block">
                  ※ 입력 예시: 서울31아 9993 (지역명, 일련번호 포함)
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">이메일 주소</label>
                <input
                  type="email"
                  placeholder="marketing-push@unsu.com"
                  value={isEditMode && !unmaskedFields.email ? maskEmail(formData.email) : formData.email}
                  maxLength={40}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setUnmaskedFields(prev => ({ ...prev, email: true }))}
                  onBlur={() => setUnmaskedFields(prev => ({ ...prev, email: false }))}
                  className="w-full p-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:border-gold font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">주소 정보</label>
                {addressSaved && formData.address ? (
                  <div className="p-4 border border-border bg-secondary/10 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 pr-2">
                        <span className="mono-label text-[9px] text-muted-foreground font-bold block">REGISTERED ADDRESS</span>
                        <p className="text-sm font-semibold text-foreground break-all leading-normal">{formData.address}</p>
                        {formData.detailAddress && (
                          <p className="text-xs font-medium text-muted-foreground break-all leading-normal">{formData.detailAddress}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        className="px-2.5 py-1.5 bg-background text-foreground hover:bg-secondary text-[11px] font-bold rounded-lg border border-border transition-colors flex-shrink-0"
                      >
                        주소 변경
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="우편번호 검색을 이용해 주세요"
                        value={formData.address}
                        readOnly
                        className="flex-1 p-3 border border-border rounded-xl text-sm bg-muted text-muted-foreground cursor-not-allowed focus:outline-none font-sans"
                      />
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        className="px-4 py-3 bg-secondary text-secondary-foreground text-xs font-bold rounded-xl border border-border hover:bg-secondary/80 transition-colors flex-shrink-0"
                      >
                        주소 검색
                      </button>
                    </div>
                    {formData.address && (
                      <div className="space-y-1.5 animation-fade-in">
                        <label className="text-[10px] font-bold text-muted-foreground block">상세 주소 입력</label>
                        <input
                          type="text"
                          placeholder="상세 주소(동, 호수 등)를 입력해 주세요"
                          value={formData.detailAddress}
                          maxLength={50}
                          onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                          className="w-full p-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:border-gold font-sans"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 서비스 소개 인트로 이미지 변경 영역 */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <label className="text-xs font-bold text-muted-foreground block">서비스 인트로 이미지 변경</label>
                <div className="flex flex-col gap-3">
                  {introPreview && (
                    <div className="relative w-full h-32 overflow-hidden rounded-xl border border-border bg-background flex items-center justify-center p-1">
                      <img src={introPreview} alt="현재 인트로 이미지 미리보기" className="h-full object-contain rounded" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={introFileInputRef}
                    onChange={handleIntroImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => introFileInputRef.current?.click()}
                    className="tap w-full py-3 border-dashed border border-gold/40 hover:bg-gold/5 text-gold rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>인트로 이미지 업로드 및 변경</span>
                  </button>
                  <p className="text-[10px] text-muted-foreground/85 leading-relaxed font-sans mt-0.5">
                    ※ 권장 규격: 800x600 이상 가로형 이미지, 용량 2MB 이하 (JPG, PNG 형식 지원)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[13px] font-semibold text-destructive font-sans bg-destructive/10 border border-destructive/20 p-3 rounded-xl leading-relaxed">
            ⚠️ {error}
          </p>
        )}

        <div className="flex gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="tap w-1/3 bg-secondary text-secondary-foreground text-sm font-bold py-3.5 rounded-xl hover:bg-secondary/80 border border-border transition-colors"
            >
              이전
            </button>
          )}

          {step === 3 ? (
            <>
              <button
                onClick={() => navigate('/')}
                className="tap w-1/3 bg-secondary text-secondary-foreground text-sm font-bold py-3.5 rounded-xl hover:bg-secondary/80 border border-border transition-colors text-center"
              >
                건너뛰기
              </button>
              <button
                onClick={handleSaveAdditionalInfo}
                className="tap w-2/3 bg-gold text-primary-foreground text-sm font-bold py-3.5 rounded-xl hover:bg-gold/90 shadow-md flex items-center justify-center gap-1.5"
              >
                <span>저장 완료</span>
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <button 
              onClick={step === 2 ? handleComplete : handleNext}
              className={`tap text-sm font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md ${
                step === 2 ? 'w-2/3 bg-gold text-primary-foreground hover:bg-gold/90' : 'w-full bg-primary text-primary-foreground hover:bg-primary/95'
              }`}
            >
              <span>{step === 2 ? (isEditMode ? "변경 완료" : "설정 완료") : "다음 단계로"}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* 정보 수정 모드일 때 로그아웃 및 회원 탈퇴 버튼 제공 */}
        {isEditMode && step === 1 && (
          <div className="pt-4 border-t border-border/60 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="tap w-full py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all border border-border"
            >
              <LogOut size={14} />
              <span>로그아웃</span>
            </button>
            <button
              type="button"
              onClick={handleWithdrawal}
              className="tap w-full py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-destructive/15 transition-all"
            >
              <LogOut size={14} className="rotate-180" />
              <span>회원 탈퇴 (계정 및 데이터 영구 삭제)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
