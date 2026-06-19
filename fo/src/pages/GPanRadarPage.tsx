import React, { useState } from 'react';
import { Play, Square, Radio, Volume2, VolumeX } from 'lucide-react';

export function GPanRadarPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const hotZones = [
    { id: 1, name: '강남역 사거리', status: '수요 폭증', time: '대기 15분', detail: '기상 악화로 현재 강남 일대 택시 수요가 평소 대비 230% 급증하고 있습니다.' },
    { id: 2, name: '김포공항 국내선', status: '도착 승객 집중', time: '대기 5분', detail: '제주발 항공기 3편이 연속 연착되어 입국장에 승객 대기열이 길게 형성되어 있습니다.' }
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-12 pt-6">
      {/* 백그라운드 그리드 레이아웃 */}
      <div className="grid-lines absolute inset-0 -z-10 opacity-20" />
      
      <div className="relative px-5 flex flex-col gap-8">
        
        {/* 헤더 */}
        <header className="text-center flex flex-col gap-2">
          <div className="mx-auto flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span className="mono-label text-[10px] text-primary font-bold">REALTIME GPS OBSERVATORY</span>
          </div>
          <h2 className="hero-head text-foreground mt-2">G-PAN RADAR</h2>
          <p className="text-body-lg text-muted-foreground">실시간 지능형 오디오 관제</p>
        </header>

        {/* 1. Zero-Touch 오디오 재생 버튼 및 조작부 */}
        <div className="flex flex-col items-center gap-6 my-4">
          <div className="relative flex items-center justify-center">
            {/* 맥동 효과 */}
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isPlaying ? 'gpan-glow scale-105' : 'bg-transparent'}`} />
            
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`tap relative w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 border-background shadow-xl transition-all duration-500 ${
                isPlaying 
                  ? 'bg-gold text-primary-foreground' 
                  : 'bg-card text-foreground hover:border-gold/50'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="h-14 w-14 fill-primary-foreground stroke-none animate-pulse" />
                  <span className="mono-label mt-3 font-extrabold text-[12px] tracking-widest text-primary-foreground">ON AIR</span>
                </>
              ) : (
                <>
                  <Play className="h-14 w-14 fill-foreground stroke-none ml-2" />
                  <span className="mono-label mt-3 font-extrabold text-[12px] tracking-widest text-muted-foreground">STANDBY</span>
                </>
              )}
            </button>
          </div>

          {/* 현재 오디오 방송 상태 안내판 */}
          <div className="w-full max-w-sm bg-card border border-border/80 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 overflow-hidden w-[70%]">
              <Radio size={16} className={`text-gold flex-shrink-0 ${isPlaying ? 'animate-pulse' : ''}`} />
              <div className="text-sm font-semibold truncate text-foreground">
                {isPlaying ? 'AI 추천: "김포공항 방면 올림픽대로 정체 우회..."' : '관제 방송 대기 중'}
              </div>
            </div>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="tap flex items-center justify-center p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
              title="음소거 토글"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* 2. 실시간 핫존 리스트 */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-foreground">실시간 핫존 현황</h3>
            <span className="text-[11px] mono-label text-muted-foreground font-bold">LIVE UPDATE</span>
          </div>

          <div className="flex flex-col gap-4">
            {hotZones.map((zone) => (
              <div 
                key={zone.id} 
                className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:border-gold/30 flex flex-col gap-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                    {zone.name}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs bg-gold/10 text-gold px-2.5 py-0.5 rounded-full font-bold border border-gold/15">
                      {zone.status}
                    </span>
                    <span className="text-[11px] mono-label text-muted-foreground font-bold">
                      {zone.time}
                    </span>
                  </div>
                </div>
                <p className="text-body-lg text-muted-foreground">
                  {zone.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
