import React, { useState, useEffect, useCallback } from 'react'
import {
  Wifi, RefreshCw, ToggleLeft, ToggleRight,
  CheckCircle, XCircle, Activity,
  Cloud, Car, Music, Plane, Train, MapPin, Droplets, Navigation, Fuel,
  Clock, TrendingUp, ShieldCheck, ShieldAlert, AlertTriangle,
  ChevronDown, ChevronUp, Filter, Search, Package
} from 'lucide-react'

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ApiStatus {
  id: string
  name: string
  provider: string
  group: string
  envKey?: string
  sandboxMode: boolean
  health: 'OK' | 'ERROR' | 'UNKNOWN'
  lastChecked?: string
  callsToday: number
  note?: string
}

const API_ICONS: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  address: MapPin, deeplink: Navigation,
  fintech: Fuel, weather: Cloud, traffic: Car,
  trains: Train, subway_seoul: Train, subway_metro: Train,
  airport: Plane, restrooms: Droplets, opinet: Fuel,
  events_kopis: Music, events_culture: Music,
  events_seoul: Music, events_gyeonggi: Music, events_busan: Music, events_incheon: Music,
  events_sports: Activity, events_concert: Music, events_convention: Package, events_outdoor: Music,
}

const GROUP_COLORS: Record<string, string> = {
  '인프라/지도': '#06b6d4',
  '금융/세무': '#8b5cf6',
  '기상': '#f59e0b',
  '교통 - 도로': '#ef4444',
  '교통 - 대중교통': '#3b82f6',
  '교통 - 항공': '#0ea5e9',
  '생활편의': '#10b981',
  '문화행사 - 전국': '#ec4899',
  '문화행사 - 지역별': '#f97316',
  '문화행사 - 목적별': '#a855f7',
}

const GROUP_ORDER = [
  '인프라/지도', '금융/세무', '기상',
  '교통 - 도로', '교통 - 대중교통', '교통 - 항공',
  '생활편의',
  '문화행사 - 전국', '문화행사 - 지역별', '문화행사 - 목적별',
]

function HealthBadge({ health }: { health: 'OK' | 'ERROR' | 'UNKNOWN' }) {
  if (health === 'OK') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />정상
    </span>
  )
  if (health === 'ERROR') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />오류
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />미확인
    </span>
  )
}

function ApiCard({ api, onToggle, isToggling }: {
  api: ApiStatus
  onToggle: () => void
  isToggling: boolean
}) {
  const Icon = API_ICONS[api.id] || Activity
  const color = GROUP_COLORS[api.group] || '#6366f1'

  return (
    <div
      className="bg-background border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground text-xs leading-tight">{api.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{api.provider}</div>
          </div>
        </div>
        <HealthBadge health={api.health} />
      </div>

      {api.note && (
        <div className="mt-2 text-[10px] text-muted-foreground bg-muted/40 rounded px-2 py-1 border border-border">
          {api.note}
        </div>
      )}

      {api.envKey && (
        <div className="mt-1.5 text-[10px] font-mono text-primary/70 bg-primary/5 rounded px-2 py-1 border border-primary/10">
          .env: {api.envKey}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground">
          금일 <span className="font-bold text-foreground">{api.callsToday}</span>회
          {api.lastChecked && (
            <span className="ml-2">· {new Date(api.lastChecked).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold ${api.sandboxMode ? 'text-amber-400' : 'text-emerald-400'}`}>
            {api.sandboxMode ? 'MOCK' : 'REAL'}
          </span>
          <button
            onClick={onToggle}
            disabled={isToggling}
            title={api.sandboxMode ? '실제 API로 전환' : '샌드박스로 전환'}
            className="transition-all disabled:opacity-40"
          >
            {api.sandboxMode
              ? <ToggleLeft size={22} className="text-amber-400 hover:text-amber-300" />
              : <ToggleRight size={22} className="text-emerald-400 hover:text-emerald-300" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function GroupSection({ group, apis, onToggle, togglingId, onGroupToggle }: {
  group: string
  apis: ApiStatus[]
  onToggle: (api: ApiStatus) => void
  togglingId: string | null
  onGroupToggle: (group: string, sandbox: boolean) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const color = GROUP_COLORS[group] || '#6366f1'
  const okCount = apis.filter(a => a.health === 'OK').length
  const sandboxCount = apis.filter(a => a.sandboxMode).length
  const totalCalls = apis.reduce((s, a) => s + a.callsToday, 0)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Group Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-all"
        style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold text-sm text-foreground">{group}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {apis.length}개 API · 정상 {okCount}개 · 금일 {totalCalls}회 호출
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sandboxCount > 0 && (
            <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
              MOCK {sandboxCount}개
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onGroupToggle(group, true) }}
            className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all"
          >샌드박스</button>
          <button
            onClick={e => { e.stopPropagation(); onGroupToggle(group, false) }}
            className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >실제 API</button>
          {collapsed ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronUp size={14} className="text-muted-foreground" />}
        </div>
      </div>

      {/* API Cards Grid */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {apis.map(api => (
            <ApiCard
              key={api.id}
              api={api}
              onToggle={() => onToggle(api)}
              isToggling={togglingId === api.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ExternalApiMonitor() {
  const [apis, setApis] = useState<ApiStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false) // Default OFF
  const [refreshInterval, setRefreshInterval] = useState(4 * 60 * 60 * 1000) // Default 4 hours
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMockOnly, setFilterMockOnly] = useState(false)

  const fetchApis = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch(`${API_HOST}/api/admin/external-apis`)
      if (res.ok) {
        const data: ApiStatus[] = await res.json()
        setApis(data)
        setLastRefreshed(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch API status:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchApis() }, [fetchApis])
  useEffect(() => {
    if (!autoRefresh) return
    const intervalId = setInterval(() => fetchApis(true), refreshInterval)
    return () => clearInterval(intervalId)
  }, [autoRefresh, fetchApis, refreshInterval])

  const handleToggle = async (api: ApiStatus) => {
    setTogglingId(api.id)
    try {
      const res = await fetch(`${API_HOST}/api/admin/external-apis/${api.id}/toggle-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxMode: !api.sandboxMode })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.list) setApis(data.list)
      }
    } catch (err) { console.error('Toggle failed:', err) }
    finally { setTogglingId(null) }
  }

  const handleGroupToggle = async (group: string, sandbox: boolean) => {
    const groupApis = apis.filter(a => a.group === group)
    for (const api of groupApis) {
      await fetch(`${API_HOST}/api/admin/external-apis/${api.id}/toggle-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxMode: sandbox })
      })
    }
    await fetchApis(true)
  }

  const handleBulkSandbox = async (enable: boolean) => {
    for (const api of apis) {
      await fetch(`${API_HOST}/api/admin/external-apis/${api.id}/toggle-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxMode: enable })
      })
    }
    await fetchApis(true)
  }

  // Derived stats
  const totalCalls = apis.reduce((s, a) => s + a.callsToday, 0)
  const okCount = apis.filter(a => a.health === 'OK').length
  const errorCount = apis.filter(a => a.health === 'ERROR').length
  const sandboxCount = apis.filter(a => a.sandboxMode).length

  // Filtered & grouped
  const filteredApis = apis.filter(api => {
    const matchSearch = !searchQuery ||
      api.name.includes(searchQuery) ||
      api.provider.includes(searchQuery) ||
      (api.envKey || '').includes(searchQuery)
    const matchMock = !filterMockOnly || api.sandboxMode
    return matchSearch && matchMock
  })

  const grouped: Record<string, ApiStatus[]> = {}
  for (const api of filteredApis) {
    if (!grouped[api.group]) grouped[api.group] = []
    grouped[api.group].push(api)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-mono text-primary font-bold mb-2">
            <Wifi size={11} />
            EXTERNAL API CONTROL CENTER
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">외부 API 관제 대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 {apis.length}개 API 관리 중 ·{' '}
            {lastRefreshed ? `마지막 갱신: ${lastRefreshed.toLocaleTimeString('ko-KR')}` : '연결 중...'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
                autoRefresh ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {autoRefresh ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {autoRefresh ? '자동갱신 켜짐' : '자동갱신 꺼짐'}
            </button>
            <div className="h-4 w-[1px] bg-border/50 mx-1"></div>
            <select
              value={refreshInterval}
              onChange={e => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
              className="bg-transparent text-xs text-foreground px-2 py-1.5 focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value={15 * 1000}>15초</option>
              <option value={60 * 1000}>1분</option>
              <option value={5 * 60 * 1000}>5분</option>
              <option value={60 * 60 * 1000}>1시간</option>
              <option value={4 * 60 * 60 * 1000}>4시간</option>
            </select>
          </div>
          <button
            onClick={() => fetchApis(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />새로고침
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '정상 API', value: okCount, sub: `전체 ${apis.length}개 중`, icon: CheckCircle, color: 'emerald' },
          { label: '오류 API', value: errorCount, sub: errorCount > 0 ? '즉시 점검 필요' : '이상 없음', icon: XCircle, color: 'red' },
          { label: '샌드박스', value: sandboxCount, sub: 'Mock 데이터 응답', icon: ShieldAlert, color: 'amber' },
          { label: '금일 총 호출', value: totalCalls, sub: `실제 API ${apis.length - sandboxCount}개 활성`, icon: TrendingUp, color: 'blue' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className={`flex items-center gap-2 text-${color}-400 mb-1`}>
              <Icon size={13} /><span className="text-xs font-semibold">{label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="API 검색 (이름, 제공자, Key 변수명...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={() => setFilterMockOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            filterMockOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-card border-border text-muted-foreground'
          }`}
        >
          <Filter size={12} />Mock만 보기
        </button>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5">
          <AlertTriangle size={12} className="text-amber-400" />
          <span className="text-xs text-muted-foreground">일괄:</span>
          <button onClick={() => handleBulkSandbox(true)} className="text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20">전체 MOCK</button>
          <button onClick={() => handleBulkSandbox(false)} className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">전체 REAL</button>
        </div>
      </div>

      {/* Grouped API Sections */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <RefreshCw size={18} className="animate-spin mr-2" />API 상태 조회 중...
        </div>
      ) : (
        <div className="space-y-3">
          {GROUP_ORDER.filter(g => grouped[g]?.length > 0).map(group => (
            <GroupSection
              key={group}
              group={group}
              apis={grouped[group]}
              onToggle={handleToggle}
              togglingId={togglingId}
              onGroupToggle={handleGroupToggle}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">이용 안내</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
          <div className="flex gap-2"><ToggleRight size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">REAL 모드</strong>: 실제 외부 API 호출. .env에 Key 없으면 자동 Fallback.</span></div>
          <div className="flex gap-2"><ToggleLeft size={13} className="text-amber-400 mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">MOCK 모드</strong>: Mock 데이터 강제 응답. API 장애 시 긴급 대처.</span></div>
          <div className="flex gap-2"><Clock size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /><span><strong className="text-foreground">호출 횟수</strong>: 서버 재시작 시 초기화되는 인메모리 카운터.</span></div>
        </div>
      </div>
    </div>
  )
}
