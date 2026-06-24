import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Users, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function EventMonitor() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [surgeOnly, setSurgeOnly] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (category) query.append('category', category);
      if (region) query.append('region', region);
      if (surgeOnly) query.append('surgeOnly', 'true');

      const res = await fetch(`${API_HOST}/api/external/events/aggregate?${query.toString()}`);
      if (!res.ok) throw new Error('이벤트 데이터를 가져오지 못했습니다.');
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, region, surgeOnly]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded text-xs font-bold font-mono border border-primary/30">
              AGGREGATED EVENTS
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">통합 문화행사 관제</h1>
          <p className="text-muted-foreground mt-1">
            공연예술, 전시, 축제, 스포츠 등 10여 개 API의 행사 데이터를 통합하여 모니터링합니다.
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="tap flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-colors text-sm font-semibold whitespace-nowrap"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-primary' : ''} />
          데이터 갱신 (캐시 동기화)
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          <Filter size={16} /> 필터링
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">전체 카테고리</option>
          <option value="sports">스포츠</option>
          <option value="concert">콘서트/공연</option>
          <option value="convention">전시/컨벤션</option>
          <option value="festival">지역축제</option>
          <option value="culture">문화행사</option>
        </select>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">전국 전체</option>
          <option value="seoul">서울특별시</option>
          <option value="gyeonggi">경기도</option>
          <option value="busan">부산광역시</option>
          <option value="incheon">인천광역시</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer bg-background border border-border px-3 py-2 rounded-lg text-sm hover:border-primary transition-colors">
          <input
            type="checkbox"
            checked={surgeOnly}
            onChange={(e) => setSurgeOnly(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="font-semibold">대규모 인원 (Surge) 예상만 보기</span>
        </label>
      </div>

      {error ? (
        <div className="p-8 text-center bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl">
          <AlertCircle size={32} className="mx-auto mb-3" />
          <p className="font-bold">{error}</p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <RefreshCw size={32} className="mx-auto mb-4 animate-spin text-primary" />
          <p>통합 이벤트 데이터를 수집 중입니다...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border rounded-2xl">
          <Calendar size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground font-semibold">조건에 맞는 행사 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, idx) => {
            const attendees = event.expectedAttendees || 0;
            const isSurge = attendees >= 1000;
            return (
              <div key={idx} className={`relative bg-card border ${isSurge ? 'border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'border-border'} rounded-2xl p-5 hover:border-primary/50 transition-colors flex flex-col justify-between`}>
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-secondary text-secondary-foreground border border-border">
                      {event.category}
                    </span>
                    {isSurge && (
                      <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-primary/20 text-primary border border-primary/30 flex items-center gap-1 animate-pulse">
                        <AlertCircle size={12} /> SURGE WARNING
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg leading-tight line-clamp-2">{event.title}</h3>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary/70" />
                      <span>{event.date} {event.time} 종료 예정</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary/70" />
                      <span className="line-clamp-1">{event.location || event.venue}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Users size={14} className="text-muted-foreground" />
                    예상 <span className={isSurge ? 'text-primary' : 'text-foreground'}>{attendees.toLocaleString()}명</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    출처: {event.source}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
