import React, { useState, useEffect } from 'react'
import { Sparkles, Navigation, Newspaper, ArrowRight, CloudRain, Sun, Cloud, AlertTriangle, Fuel, MapPin } from 'lucide-react'
import { openNavigationApp } from '../utils/naviLink'

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const BRAND_COLORS: Record<string, string> = {
  'E1': '#0066cc',
  'SK가스': '#e8330a',
  'GS칼텍스': '#004B97',
  'S-OIL': '#f59e0b',
  '현대오일뱅크': '#005bac',
  '자영': '#6b7280',
}

export function HomePage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [gasStations, setGasStations] = useState<any[]>([]);
  const [showGasModal, setShowGasModal] = useState(false);
  const [gasLoading, setGasLoading] = useState(false);
  const [profile, setProfile] = useState<{ naviPreference?: string } | null>(null);

  useEffect(() => {
    let driverId = localStorage.getItem('driverId');
    if (!driverId) {
      driverId = Math.random().toString(36).substring(7);
      localStorage.setItem('driverId', driverId);
    }

    fetch(`${API_HOST}/api/drivers/${driverId}`)
      .then(res => res.json())
      .then(data => { if (!data.error) setProfile(data) })
      .catch(err => console.error(err));

    fetch(`${API_HOST}/api/external/dashboard`)
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error(err));
  }, []);

  const fetchGasStations = async () => {
    setGasLoading(true);
    setShowGasModal(true);
    try {
      const res = await fetch(`${API_HOST}/api/external/opinet?fuel=LPG`);
      const data = await res.json();
      setGasStations(data || []);
    } catch (e) {
      console.error(e);
      setGasStations([]);
    } finally {
      setGasLoading(false);
    }
  };

  const weather = dashboardData?.weather;
  const traffic = dashboardData?.traffic;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-20 pt-8">
      {/* Decorative grids */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[50%] dot-field" />

      <div className="relative mx-auto max-w-4xl px-5">
        {/* Title & Weather Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-foreground" />
              <span className="mono-label text-muted-foreground">GILLOG ROUTINE</span>
            </div>
            <h1 className="hero-head mt-4 text-[clamp(2.5rem,8vw,5rem)] leading-none">
              오늘의 운수<br />
              <span className="text-muted-foreground">그리고 출발.</span>
            </h1>
          </div>
          
          {/* 130% 대형 날씨 아이콘 연출 */}
          {weather && (
            <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-3xl border border-border shadow-sm backdrop-blur-sm transform hover:scale-105 transition-transform">
              {weather.conditionStr === '맑음' ? <Sun size={56} className="text-yellow-500 mb-2 drop-shadow-md" /> : 
               weather.conditionStr.includes('비') ? <CloudRain size={56} className="text-blue-400 mb-2 drop-shadow-md" /> : 
               <Cloud size={56} className="text-gray-400 mb-2 drop-shadow-md" />}
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black font-mono tracking-tighter">{weather.temperature}°</span>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground mt-1 bg-background px-2 py-0.5 rounded-full border border-border/50">강수 {weather.precipitationProbability}%</span>
            </div>
          )}
        </div>

        {/* 실시간 교통 돌발상황 띠배너 (Ticker) */}
        {traffic && traffic.status !== '원활' && (
          <div className="mt-8 w-full overflow-hidden bg-destructive/10 border border-destructive/20 rounded-xl flex items-center relative h-12 shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 px-4 flex items-center justify-center bg-destructive/90 text-destructive-foreground font-bold text-xs z-10 shadow-[4px_0_12px_rgba(0,0,0,0.1)]">
              <AlertTriangle size={14} className="mr-1.5 animate-pulse" />
              돌발 교통
            </div>
            {/* CSS Animation required for smooth ticker. Using marquee style. */}
            <div className="flex-1 overflow-hidden ml-24 relative flex items-center h-full">
              <div className="whitespace-nowrap animate-[marquee_15s_linear_infinite] text-sm font-semibold text-destructive/90 flex items-center gap-8">
                <span>[ {traffic.roadName} {traffic.status} ] {traffic.message}</span>
                <span>[ {traffic.roadName} {traffic.status} ] {traffic.message}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Horoscope Lucky Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="mono-label text-muted-foreground">오늘의 행운 카드</span>
              <Sparkles className="h-5 w-5 text-gold animate-pulse" />
            </div>
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-28 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gold bg-gold/10">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">"동쪽에서 귀인을 만날 운세"</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                오전 9시 ~ 11시 사이에 청담동 방면 콜을 수락하시면 높은 팁과 부드러운 운행이 예상됩니다.
              </p>
            </div>
          </div>

          {/* Daily Recommended Course Banner */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="mono-label text-muted-foreground">오늘 아침 핵심 코스</span>
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">강남역 ➔ 김포공항</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                현재 가양대교 우회 경로를 추천해 드립니다. 예상 소요 시간 42분.
              </p>
            </div>
            <div className="mt-8">
              <button 
                onClick={() => {
                  const pref = profile?.naviPreference || 'TMAP';
                  // 홈페이지의 핵심 코스 추천 (하드코딩된 예시: 강남역 -> 김포공항)
                  // 김포공항 좌표를 기본값으로 사용
                  openNavigationApp(pref, '김포공항', '37.558', '126.802');
                }}
                className="tap inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
              >
                추천 경로 {profile?.naviPreference === 'KAKAONAVI' ? '카카오네비' : '티맵'} 전송
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Feed: 초보 생존 가이드 */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">택린이 초보 생존 가이드</h2>
            <Newspaper className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { t: '양도양수 리얼 꿀팁 후기', d: '개인택시 면허 양수 시 꼭 짚고 넘어가야 할 양도인 차량 대차 비용 분석.', v: '조회수 1.2만' },
              { t: '5월 부가세 환급 정산기', d: '신차 구입 매입자료 홈택스 오토파일럿 신고로 부가세 100% 환급받은 기사 실사례.', v: '조회수 8.4천' },
              { t: '심야 할증 최적화 테크닉', d: '밤 11시 이후 핫존 분포와 호출 연계율을 극대화하는 야간 조 주행 가이드.', v: '조회수 2.1만' },
            ].map((feed, i) => (
              <div key={i} className="tap rounded-xl border border-border bg-card/60 p-5 hover:bg-card">
                <span className="mono-label text-[10px] text-muted-foreground">{feed.v}</span>
                <h4 className="mt-2 font-semibold text-foreground line-clamp-1">{feed.t}</h4>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{feed.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SOS Restroom Floating Button */}
        <button 
          onClick={async () => {
            try {
              const res = await fetch(`${API_HOST}/api/external/restrooms`);
              const data = await res.json();
              if (data && data.length > 0) {
                alert(`🚨 긴급 화장실 탐색 완료!\n\n가장 가까운 화장실: ${data[0].name}\n거리: ${data[0].distanceMeter}m\n주소: ${data[0].address}\n(주정차 단속 유예 구역)`);
              }
            } catch(e) {
              alert("현재 위치 주변 개방 화장실 정보를 가져올 수 없습니다.");
            }
          }}
          className="fixed bottom-24 right-5 tap bg-destructive/90 text-destructive-foreground p-4 rounded-full shadow-lg border-2 border-destructive flex items-center justify-center animate-bounce hover:bg-destructive"
        >
          <AlertTriangle size={24} />
          <span className="sr-only">긴급 화장실 찾기</span>
        </button>

        {/* 오피넷 최저가 LPG 충전소 위젯 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Fuel size={20} className="text-amber-400" />
                주변 LPG 최저가 충전소
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">현재 위치 기준 · 오피넷 실시간 데이터</p>
            </div>
            <button
              onClick={fetchGasStations}
              className="tap flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-all"
            >
              <MapPin size={12} />
              검색
            </button>
          </div>

          {/* Gas Station Quick Preview Cards */}
          {gasStations.length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {gasStations.slice(0, 3).map((s: any, i: number) => {
                const brandColor = BRAND_COLORS[s.brand] || '#6b7280';
                return (
                  <div key={i} className={`rounded-xl border border-border bg-card/80 p-4 hover:bg-card transition-all ${!s.isOpen ? 'opacity-50' : ''}`}
                    style={{ borderLeftColor: brandColor, borderLeftWidth: 3 }}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{s.address}</div>
                      </div>
                      {!s.isOpen && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-2 flex-shrink-0">영업종료</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] text-muted-foreground">LPG 단가</div>
                        <div className="text-2xl font-black font-mono" style={{ color: brandColor }}>
                          {s.pricePerLiter.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground ml-0.5">원/L</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">거리</div>
                        <div className="text-sm font-bold text-foreground">
                          {s.distanceM >= 1000 ? `${(s.distanceM / 1000).toFixed(1)}km` : `${s.distanceM}m`}
                        </div>
                      </div>
                    </div>
                    <div
                      className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-center"
                      style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                    >
                      {s.brand}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {gasStations.length === 0 && !gasLoading && (
            <div
              onClick={fetchGasStations}
              className="cursor-pointer rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center hover:bg-amber-500/10 transition-all"
            >
              <Fuel size={28} className="text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">클릭하여 주변 최저가 충전소를 검색하세요</p>
            </div>
          )}

          {gasLoading && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground animate-pulse">
              <Fuel size={28} className="text-amber-400 mx-auto mb-2" />
              <p className="text-sm">주변 충전소 탐색 중...</p>
            </div>
          )}
        </div>

        {/* 오피넷 상세 모달 */}
        {showGasModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Fuel size={16} className="text-amber-400" />
                    주변 LPG 충전소 전체보기
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">오피넷 실시간 최저가 기준</p>
                </div>
                <button
                  onClick={() => setShowGasModal(false)}
                  className="text-muted-foreground hover:text-foreground text-lg font-bold px-2"
                >✕</button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                {gasLoading ? (
                  <div className="p-8 text-center text-muted-foreground animate-pulse">
                    탐색 중...
                  </div>
                ) : gasStations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">주변 충전소 정보를 가져올 수 없습니다.</div>
                ) : gasStations.map((s: any, i: number) => {
                  const brandColor = BRAND_COLORS[s.brand] || '#6b7280';
                  const lowestPrice = Math.min(...gasStations.map(g => g.pricePerLiter));
                  const isCheapest = s.pricePerLiter === lowestPrice;
                  return (
                    <div key={i} className={`flex items-center justify-between px-5 py-4 ${!s.isOpen ? 'opacity-40' : 'hover:bg-secondary/30'} transition-all`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                          style={{ backgroundColor: `${brandColor}20`, color: brandColor, border: `1px solid ${brandColor}40` }}>
                          {s.brand.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            {s.name}
                            {isCheapest && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">최저가</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{s.address}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-lg font-black font-mono" style={{ color: isCheapest ? '#10b981' : brandColor }}>
                          {s.pricePerLiter.toLocaleString()}원
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {s.distanceM >= 1000 ? `${(s.distanceM / 1000).toFixed(1)}km` : `${s.distanceM}m`}
                          {!s.isOpen && ' · 영업종료'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-4 border-t border-border">
                <button
                  onClick={() => setShowGasModal(false)}
                  className="w-full tap py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
