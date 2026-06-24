import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Landmark, Store, ShieldAlert, Radio, FileText, Terminal, RefreshCw, Play, User, Wifi, Calendar } from 'lucide-react'
import { TaxAutopilotMonitor } from './pages/TaxAutopilotMonitor'
import { PartnerSettlement } from './pages/PartnerSettlement'
import { PlazaModeration } from './pages/PlazaModeration'
import { GPanStatusDashboard } from './pages/GPanStatusDashboard'
import { ExternalApiMonitor } from './pages/ExternalApiMonitor'
import { EventMonitor } from './pages/EventMonitor'

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AdminAccount {
  email: string
  name: string
  role: string
  createdAt: string
}

function LoginPage({ onLogin }: { onLogin: (email: string, role: string) => void }) {
  const [email, setEmail] = useState('admin@unsu-platform.com')
  const [password, setPassword] = useState('admin-secure-unsu')
  const [loginStep, setLoginStep] = useState(1)
  const [error, setError] = useState('')

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault()
    setError('')
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('올바른 관리자 이메일 주소를 입력해 주세요.')
      return
    }
    setLoginStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loginStep === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('올바른 관리자 이메일 주소를 입력해 주세요.')
        return
      }
      setLoginStep(2)
      return
    }

    setError('')
    try {
      const res = await fetch(`${API_HOST}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        const data = await res.json()
        onLogin(email, data.admin?.role || 'Super Admin')
      } else {
        const data = await res.json()
        setError(data.error || '로그인 정보가 올바르지 않습니다.')
      }
    } catch (err) {
      console.error(err)
      setError('서버 연결 실패. 네트워크 상태를 확인하세요.')
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-background px-4 py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-20" />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg transition-all duration-300">
        <div className="text-center space-y-2 mb-8 animate-fade-in-up">
          <div className="inline-flex items-baseline gap-1 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-mono text-primary font-bold">
            UNSU SYSTEM CONTROL
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">운수대통 BO 로그인</h2>
          <p className="text-sm text-muted-foreground">본사 관리자 및 파트너 정산 관제 시스템</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                관리자 이메일
              </label>
              {loginStep === 2 && (
                <button
                  type="button"
                  onClick={() => setLoginStep(1)}
                  className="text-xs text-gold font-bold hover:underline"
                >
                  이메일 수정
                </button>
              )}
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loginStep === 2}
              className={`w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                loginStep === 2 ? 'opacity-60 cursor-not-allowed bg-secondary/50' : ''
              }`}
            />
          </div>

          {/* 슬라이딩 비밀번호 영역 */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              loginStep === 2 
                ? 'max-h-40 opacity-100 pointer-events-auto visible' 
                : 'max-h-0 opacity-0 pointer-events-none invisible'
            }`}
          >
            <div className="space-y-1 mt-3">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={loginStep === 2}
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="font-sans text-[13px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              ⚠️ {error}
            </p>
          )}

          {loginStep === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="tap w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>다음 단계로</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="tap w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/95 transition-colors"
              >
                슈퍼어드민 로그인
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onLogin('test.manager@unsu-platform.com', 'Manager');
                }}
                className="tap w-full py-3.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-bold shadow hover:bg-secondary/80 transition-colors"
              >
                테스트 ID로 로그인 (Manager)
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 pt-5 border-t border-border/80 text-xs text-muted-foreground leading-relaxed">
          <p className="font-bold text-foreground mb-1">💡 테스트 계정 안내</p>
          <p>초기 테스트용 슈퍼어드민 계정 정보가 지정되어 있습니다.</p>
          <p className="mt-1">
            * 초기 비밀번호는 <strong className="text-gold font-mono font-bold select-all">admin-secure-unsu</strong> 입니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function Layout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const location = useLocation()
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', role: 'Manager' })
  
  // Edit admin states
  const [editingAdminEmail, setEditingAdminEmail] = useState<string | null>(null)
  const [editAdminName, setEditAdminName] = useState('')
  const [editAdminRole, setEditAdminRole] = useState('Manager')

  // Admin history states
  const [showAdminHistoryModal, setShowAdminHistoryModal] = useState(false)
  const [adminHistoryLogs, setAdminHistoryLogs] = useState<any[]>([])
  const [isAdminHistoryLoading, setIsAdminHistoryLoading] = useState(false)
  const [historyAdminEmail, setHistoryAdminEmail] = useState('')

  const currentAdminEmail = sessionStorage.getItem('admin_email') || 'admin@unsu-platform.com'
  const currentAdminRole = sessionStorage.getItem('admin_role') || 'Manager'

  // Retrieve admins from API
  const [admins, setAdmins] = useState<AdminAccount[]>([])

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/admin/accounts`)
      if (res.ok) {
        const data = await res.json()
        const mapped = data.map((a: any) => ({
          email: a.email,
          name: a.name,
          role: a.role,
          createdAt: a.created_at || a.createdAt
        }))
        setAdmins(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err)
    }
  }

  React.useEffect(() => {
    fetchAdmins()
  }, [])

  const navs = [
    { label: '정산 관제', path: '/', icon: Landmark },
    { label: '제휴사 정산', path: '/partner', icon: Store },
    { label: '커뮤니티 및 OCR', path: '/plaza', icon: ShieldAlert },
    { label: 'G-PAN 대시보드', path: '/gpan', icon: Radio },
    { label: '이벤트 관제', path: '/events', icon: Calendar },
    { label: '기사 정보 관리', path: '/drivers', icon: User },
    { label: '감사 로그', path: '/audit-logs', icon: FileText },
    { label: 'API 테스트베드', path: '/api-playground', icon: Terminal },
    { label: '외부 API 관제', path: '/external-apis', icon: Wifi },
  ]

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdmin.email || !newAdmin.name) return

    // Check duplicate
    if (admins.some(a => a.email === newAdmin.email)) {
      alert('이미 등록된 관리자 이메일입니다.')
      return
    }

    try {
      const res = await fetch(`${API_HOST}/api/admin/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentAdminEmail
        },
        body: JSON.stringify({
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role
        })
      })
      if (res.ok) {
        alert(`${newAdmin.name} 관리자 계정이 정상 추가되었습니다. (로그인 비밀번호는 기본 'admin-secure-unsu'로 설정됩니다)`)
        setNewAdmin({ email: '', name: '', role: 'Manager' })
        await fetchAdmins()
      } else {
        const data = await res.json()
        alert(data.error || '계정 추가에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('서버 오류로 인해 계정을 추가하지 못했습니다.')
    }
  }

  const handleUpdateAdminSubmit = async (email: string) => {
    if (!editAdminName.trim()) return
    try {
      const res = await fetch(`${API_HOST}/api/admin/accounts/${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentAdminEmail
        },
        body: JSON.stringify({
          name: editAdminName,
          role: editAdminRole
        })
      })
      if (res.ok) {
        alert('관리자 계정 정보가 정상 수정되었습니다.')
        setEditingAdminEmail(null)
        await fetchAdmins()
      } else {
        const data = await res.json()
        alert(data.error || '계정 수정에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('서버 오류로 인해 계정 수정을 처리하지 못했습니다.')
    }
  }

  const handleDeleteAdmin = async (email: string) => {
    if (email === 'admin@unsu-platform.com') {
      alert('최고관리자 계정은 삭제할 수 없습니다.')
      return
    }
    if (confirm('선택한 관리자 계정을 파쇄하시겠습니까?')) {
      try {
        const res = await fetch(`${API_HOST}/api/admin/accounts/${email}`, {
          method: 'DELETE',
          headers: {
            'x-admin-email': currentAdminEmail
          }
        })
        if (res.ok) {
          alert('계정이 성공적으로 삭제되었습니다.')
          await fetchAdmins()
        } else {
          const data = await res.json()
          alert(data.error || '계정 삭제에 실패했습니다.')
        }
      } catch (err) {
        console.error(err)
        alert('서버 오류로 인해 계정을 삭제하지 못했습니다.')
      }
    }
  }

  const openAdminHistory = async (email: string) => {
    setHistoryAdminEmail(email)
    setShowAdminHistoryModal(true)
    setIsAdminHistoryLoading(true)
    try {
      const res = await fetch(`${API_HOST}/api/admin/audit-logs`)
      if (res.ok) {
        const data = await res.json()
        const filtered = data.filter((log: any) =>
          log.target_identifier === email &&
          (log.action_type === 'ADMIN_UPDATE' || log.action_type === 'ADMIN_CREATE' || log.action_type === 'ADMIN_DELETE')
        )
        setAdminHistoryLogs(filtered)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdminHistoryLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      <div className="pointer-events-none fixed inset-y-0 right-0 w-[60%] dot-field z-0 opacity-30" />
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/80 bg-card/70 backdrop-blur-xl flex flex-col relative z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="h-16 flex items-center px-6 border-b border-border/60">
          <Link to="/" className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight">운수대통 관제</span>
            <span className="mono-label text-[10px] text-gold">BO</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navs.map((nav) => {
            const isActive = location.pathname === nav.path
            const Icon = nav.icon
            return (
              <Link
                key={nav.path}
                to={nav.path}
                className={`tap flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {nav.label}
              </Link>
            )
          })}
        </nav>
        
        {/* Sidebar Footer with Session Control */}
        <div className="p-4 border-t border-border/60 space-y-2">
          <button
            onClick={() => setShowAdminModal(true)}
            className="tap w-full text-left flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground py-1.5 px-2 rounded hover:bg-secondary/40"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>관리자 계정 관리 ({admins.length})</span>
          </button>
          
          <button
            onClick={onLogout}
            className="tap w-full text-left text-xs font-semibold text-rose-500 hover:text-rose-600 py-1.5 px-2 rounded hover:bg-rose-500/10"
          >
            시스템 로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-6xl relative z-10">
        {children}
      </main>

      {/* Admin Accounts Management Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold text-foreground">관리자 계정 등록 및 권한 설정</h3>
              <button 
                onClick={() => setShowAdminModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                닫기
              </button>
            </div>

            {/* List of current administrators */}
            <div className="space-y-3">
              <span className="mono-label text-[10px] text-muted-foreground font-bold block">등록된 관리자 목록</span>
              <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border/60 text-muted-foreground font-bold">
                      <th className="p-3">이름</th>
                      <th className="p-3">이메일</th>
                      <th className="p-3">권한</th>
                      <th className="p-3">등록일시</th>
                      <th className="p-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-sans text-foreground/90">
                    {admins.map((a) => {
                      const isEditing = editingAdminEmail === a.email;
                      return (
                        <tr key={a.email} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editAdminName}
                                onChange={(e) => setEditAdminName(e.target.value)}
                                className="w-full rounded border border-border bg-background p-1 text-xs focus:outline-none focus:border-gold text-foreground"
                              />
                            ) : (
                              <span className="font-bold">{a.name}</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px]">{a.email}</td>
                          <td className="p-3">
                            {isEditing ? (
                              <select
                                value={editAdminRole}
                                onChange={(e) => setEditAdminRole(e.target.value)}
                                className="rounded border border-border bg-background p-1 text-xs focus:outline-none focus:border-gold text-foreground"
                              >
                                <option value="Manager">Manager</option>
                                <option value="Auditor">Auditor</option>
                                <option value="Super Admin">Super Admin</option>
                              </select>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                a.role === 'Super Admin' 
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                  : a.role === 'Auditor'
                                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                  : 'bg-secondary text-secondary-foreground border-border'
                              }`}>
                                {a.role}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {new Date(a.createdAt).toLocaleString('ko-KR')}
                          </td>
                          <td className="p-3 text-center space-x-2 whitespace-nowrap">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAdminSubmit(a.email)}
                                  className="text-emerald-500 hover:text-emerald-700 font-bold"
                                >
                                  저장
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingAdminEmail(null)}
                                  className="text-muted-foreground hover:text-foreground font-bold"
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <>
                                {currentAdminRole === 'Super Admin' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAdminEmail(a.email);
                                        setEditAdminName(a.name);
                                        setEditAdminRole(a.role);
                                      }}
                                      className="text-primary hover:text-primary/80 font-bold mr-2"
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdmin(a.email)}
                                      className="text-rose-500 hover:text-rose-700 font-bold mr-2"
                                    >
                                      삭제
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openAdminHistory(a.email)}
                                  className="text-sky-500 hover:text-sky-700 font-bold"
                                >
                                  이력
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form to add a new admin account */}
            <form onSubmit={handleAddAdmin} className="border-t border-border/60 pt-4 space-y-4">
              <span className="mono-label text-[10px] text-muted-foreground font-bold block">신규 관리자 추가 등록</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="관리자 이름"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  required
                  className="rounded-lg border border-border bg-background p-2.5 text-xs focus:outline-none focus:border-gold"
                />
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                  className="rounded-lg border border-border bg-background p-2.5 text-xs focus:outline-none focus:border-gold"
                />
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="rounded-lg border border-border bg-background p-2.5 text-xs focus:outline-none focus:border-gold"
                >
                  <option value="Manager">Manager</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="tap w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/95"
              >
                신규 관리자 계정 추가
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Account History Audit Trail Modal */}
      {showAdminHistoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[75vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h4 className="text-base font-bold text-foreground font-sans">관리자 정보 변경 이력</h4>
                <p className="text-xs text-muted-foreground">계정: <strong className="text-foreground">{historyAdminEmail}</strong></p>
              </div>
              <button 
                onClick={() => setShowAdminHistoryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                닫기
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1">
              {isAdminHistoryLoading ? (
                <p className="text-center text-xs text-muted-foreground py-8 font-sans">이력을 불러오는 중...</p>
              ) : adminHistoryLogs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8 font-sans">해당 관리자 계정의 변경 이력이 존재하지 않습니다.</p>
              ) : (
                <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/60 text-muted-foreground font-bold">
                        <th className="p-3">변경 시간</th>
                        <th className="p-3">변경자 (Operator)</th>
                        <th className="p-3">이전 → 이후 상세 변경 내역</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {adminHistoryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-secondary/20">
                          <td className="p-3 whitespace-nowrap text-muted-foreground">
                            {new Date(log.created_at || log.createdAt).toLocaleString('ko-KR')}
                          </td>
                          <td className="p-3 font-sans font-bold text-foreground">{log.admin_email}</td>
                          <td className="p-3 font-sans leading-relaxed text-foreground/90 max-w-xs whitespace-pre-wrap">
                            {log.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 1. Audit Logs Dashboard
// ============================================================================
function AuditLogsDashboard() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterOperator, setFilterOperator] = useState('')
  const [filterAction, setFilterAction] = useState('ALL')

  const fetchLogs = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_HOST}/api/admin/audit-logs`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      } else {
        setError('감사 로그를 불러오지 못했습니다.')
      }
    } catch (err) {
      console.error(err)
      setError('서버 연결에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchOperator = log.operator_email.toLowerCase().includes(filterOperator.toLowerCase())
    const matchAction = filterAction === 'ALL' || log.action_type === filterAction
    return matchOperator && matchAction
  })

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'ADMIN_CREATE':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20'
      case 'ADMIN_DELETE':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      case 'ADMIN_UPDATE':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
      case 'DRIVER_UPDATE':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default:
        return 'bg-secondary text-secondary-foreground border-border'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">시스템 감사 로그 (Audit Logs)</h2>
          <p className="text-sm text-muted-foreground">관리자의 개인정보 수정, 권한 부여/회수 및 보안 관련 세부 이력을 추적합니다.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="tap flex items-center gap-2 bg-secondary border border-border px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-secondary/80 disabled:opacity-50 text-foreground cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">작업자 이메일 필터</label>
            <input
              type="text"
              placeholder="operator@example.com"
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs focus:outline-none focus:border-gold transition-colors text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">액션 유형 필터</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs focus:outline-none focus:border-gold transition-colors text-foreground"
            >
              <option value="ALL">전체 보기</option>
              <option value="LOGIN">LOGIN (시스템 로그인)</option>
              <option value="ADMIN_CREATE">ADMIN_CREATE (관리자 추가)</option>
              <option value="ADMIN_DELETE">ADMIN_DELETE (관리자 파쇄)</option>
              <option value="ADMIN_UPDATE">ADMIN_UPDATE (관리자 정보 변경)</option>
              <option value="DRIVER_UPDATE">DRIVER_UPDATE (기사 정보 변경)</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
            ⚠️ {error}
          </p>
        )}

        <div className="border border-border/40 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/20 border-b border-border/40 text-muted-foreground font-bold">
                  <th className="p-3.5">일시</th>
                  <th className="p-3.5">작업자 이메일</th>
                  <th className="p-3.5">액션 유형</th>
                  <th className="p-3.5">대상 리소스 ID</th>
                  <th className="p-3.5">상세 내용</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground font-sans">
                      감사 이력을 불러오는 중...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground font-sans">
                      조회된 감사 로그가 존재하지 않습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                        {new Date(log.created_at || log.createdAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-bold text-foreground font-sans">{log.operator_email}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-sans font-bold border text-[9px] ${getActionBadgeClass(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-bold text-foreground">{log.target_id || '-'}</td>
                      <td className="p-3.5 font-sans leading-relaxed text-foreground/90 max-w-xs md:max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 2. API Test Playground (Swagger Mock Console)
// ============================================================================
interface ApiSpec {
  name: string
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  description: string
  defaultPathParams: Record<string, string>
  defaultQueryParams: Record<string, string>
  defaultHeaders: Record<string, string>
  defaultBody: string | null
}

const API_SPECS: ApiSpec[] = [
  {
    name: '기사 프로필 조회',
    method: 'GET',
    path: '/api/drivers/:id',
    description: '특정 기사(ID)의 기본 정보 및 가입 상세 프로필을 조회합니다. 민감정보(홈택스 ID)는 복호화되어 반환됩니다.',
    defaultPathParams: { id: 'driver-101' },
    defaultQueryParams: {},
    defaultHeaders: {},
    defaultBody: null
  },
  {
    name: '관리자 권한 기사 프로필 수정',
    method: 'POST',
    path: '/api/admin/drivers/:id',
    description: '관리자 권한으로 특정 기사(ID)의 개인정보 및 내비게이션 설정을 강제 업데이트하고 감사 로그를 기록합니다. 민감정보(홈택스 ID)는 데이터베이스에 암호화되어 저장됩니다.',
    defaultPathParams: { id: 'driver-101' },
    defaultQueryParams: {},
    defaultHeaders: { 'x-admin-email': 'admin@unsu-platform.com' },
    defaultBody: JSON.stringify({
      birthDate: '1975-08-15',
      birthTime: '09:30',
      businessType: 'PRIVATE',
      homeTaxId: '123-45-67890',
      naviPreference: 'TMAP'
    }, null, 2)
  },
  {
    name: '기사 회원탈퇴 처리',
    method: 'POST',
    path: '/api/drivers/:id/withdraw',
    description: '기사의 회원 탈퇴 처리를 수행합니다. 기존 PII 프로필을 삭제하며, 3일 이내 재가입 방지를 위해 주민번호(홈택스 ID)의 SHA-256 단방향 해시값을 락 정보로 기록합니다.',
    defaultPathParams: { id: 'driver-101' },
    defaultQueryParams: {},
    defaultHeaders: {},
    defaultBody: null
  },
  {
    name: '신규 관리자 등록',
    method: 'POST',
    path: '/api/admin/accounts',
    description: '운수대통 BO 시스템에 진입할 수 있는 새로운 관리자 계정을 추가하고 감사 로그를 기록합니다. 초기 비밀번호는 디폴트로 자동 지정됩니다.',
    defaultPathParams: {},
    defaultQueryParams: {},
    defaultHeaders: { 'x-admin-email': 'admin@unsu-platform.com' },
    defaultBody: JSON.stringify({
      email: 'new-manager@unsu-platform.com',
      name: '홍길동',
      role: 'Manager'
    }, null, 2)
  },
  {
    name: '관리자 계정 삭제',
    method: 'DELETE',
    path: '/api/admin/accounts/:email',
    description: '지정된 이메일을 가진 관리자 계정을 시스템 관리자 목록에서 영구 파쇄 처리하고 감사 로그에 기록합니다.',
    defaultPathParams: { email: 'new-manager@unsu-platform.com' },
    defaultQueryParams: {},
    defaultHeaders: { 'x-admin-email': 'admin@unsu-platform.com' },
    defaultBody: null
  },
  {
    name: '운행 분석 RAG 에이전트 스트리밍',
    method: 'GET',
    path: '/api/recommend/stream',
    description: 'LangGraph RAG 에이전트를 가동하여 질의에 대한 오더 대기지 분석 보고서를 SSE 스트리밍으로 출력합니다.',
    defaultPathParams: {},
    defaultQueryParams: { q: '강남구 주변 대기 시간 짧은 핫스팟 추천해줘' },
    defaultHeaders: {},
    defaultBody: null
  }
]

function ApiPlayground() {
  const [selectedApi, setSelectedApi] = useState<ApiSpec>(API_SPECS[0])
  const [pathParams, setPathParams] = useState<Record<string, string>>({})
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [headers, setHeaders] = useState<Record<string, string>>({})
  const [bodyText, setBodyText] = useState('')
  
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [responseBody, setResponseBody] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sseOutput, setSseOutput] = useState<string[]>([])

  // Load defaults when API selection changes
  React.useEffect(() => {
    setPathParams({ ...selectedApi.defaultPathParams })
    setQueryParams({ ...selectedApi.defaultQueryParams })
    setHeaders({ ...selectedApi.defaultHeaders })
    setBodyText(selectedApi.defaultBody || '')
    setResponseStatus(null)
    setResponseHeaders({})
    setResponseBody('')
    setSseOutput([])
  }, [selectedApi])

  const handleExecute = async () => {
    setIsLoading(true)
    setResponseStatus(null)
    setResponseHeaders({})
    setResponseBody('')
    setSseOutput([])

    // 1. Build URL
    let finalUrl = `${API_HOST}${selectedApi.path}`
    // Replace path params
    Object.entries(pathParams).forEach(([key, val]) => {
      finalUrl = finalUrl.replace(`:${key}`, encodeURIComponent(val))
    })
    // Append query params
    const queryStr = new URLSearchParams(queryParams).toString()
    if (queryStr) {
      finalUrl += `?${queryStr}`
    }

    // Special case: EventSource streaming for RAG Agent
    if (selectedApi.path === '/api/recommend/stream') {
      setResponseStatus(200)
      setResponseHeaders({ 'content-type': 'text/event-stream' })
      
      const eventSource = new EventSource(finalUrl)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'error') {
            setSseOutput(prev => [...prev, `[ERROR] ${data.message}`])
            eventSource.close()
            setIsLoading(false)
          } else if (data.type === 'hotzones') {
            setSseOutput(prev => [...prev, `[HOTZONES] ${JSON.stringify(data.hotzones, null, 2)}`])
          } else if (data.type === 'report') {
            setSseOutput(prev => [...prev, data.text])
          }
        } catch (e) {
          setSseOutput(prev => [...prev, event.data])
        }
      }

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err)
        setSseOutput(prev => [...prev, '[SYSTEM] 연결 해제 또는 완료'])
        eventSource.close()
        setIsLoading(false)
      }

      return
    }

    // Standard HTTP Requests
    try {
      const options: RequestInit = {
        method: selectedApi.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      if (selectedApi.method !== 'GET' && bodyText) {
        options.body = bodyText
      }

      const res = await fetch(finalUrl, options)
      setResponseStatus(res.status)
      
      // Map headers
      const resHeaders: Record<string, string> = {}
      res.headers.forEach((val, key) => {
        resHeaders[key] = val
      })
      setResponseHeaders(resHeaders)

      const text = await res.text()
      try {
        const parsed = JSON.parse(text)
        setResponseBody(JSON.stringify(parsed, null, 2))
      } catch (e) {
        setResponseBody(text)
      }
    } catch (err: any) {
      setResponseBody(`Error calling API: ${err.message || err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 items-start">
      {/* Left: API Selection List */}
      <div className="md:col-span-1 space-y-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">API 테스트베드 (Playground)</h2>
          <p className="text-xs text-muted-foreground">백엔드 API 엔드포인트 연동을 실시간으로 호출하고 결과를 검증합니다.</p>
        </div>
        <div className="flex flex-col gap-2">
          {API_SPECS.map((api, idx) => {
            const isSelected = selectedApi.path === api.path && selectedApi.method === api.method
            const methodBg = api.method === 'GET' 
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
              : api.method === 'POST'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            return (
              <button
                key={idx}
                onClick={() => setSelectedApi(api)}
                className={`tap w-full text-left p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : 'bg-card text-foreground border-border hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold border ${isSelected ? 'bg-background text-foreground' : methodBg}`}>
                    {api.method}
                  </span>
                  <span className="truncate">{api.name}</span>
                </div>
                <p className={`text-[10px] line-clamp-2 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {api.path}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Selected API parameters & Response Panel */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                selectedApi.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {selectedApi.method}
              </span>
              <span className="font-mono text-xs text-foreground">{selectedApi.path}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{selectedApi.description}</p>
          </div>

          {/* Path parameters */}
          {Object.keys(pathParams).length > 0 && (
            <div className="space-y-2">
              <span className="mono-label text-[10px] text-muted-foreground font-bold">경로 파라미터 (Path Parameters)</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.keys(pathParams).map((param) => (
                  <div key={param} className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-foreground font-semibold">:{param}</span>
                    <input
                      type="text"
                      value={pathParams[param]}
                      onChange={(e) => setPathParams({ ...pathParams, [param]: e.target.value })}
                      className="rounded-lg border border-border bg-background p-2 text-xs focus:outline-none focus:border-gold text-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query parameters */}
          {Object.keys(queryParams).length > 0 && (
            <div className="space-y-2">
              <span className="mono-label text-[10px] text-muted-foreground font-bold">쿼리 파라미터 (Query Parameters)</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.keys(queryParams).map((param) => (
                  <div key={param} className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-foreground font-semibold">?{param}</span>
                    <input
                      type="text"
                      value={queryParams[param]}
                      onChange={(e) => setQueryParams({ ...queryParams, [param]: e.target.value })}
                      className="rounded-lg border border-border bg-background p-2 text-xs focus:outline-none focus:border-gold text-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HTTP Headers */}
          <div className="space-y-2">
            <span className="mono-label text-[10px] text-muted-foreground font-bold">테스트 요청 헤더 (HTTP Headers)</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-foreground font-semibold">x-admin-email</span>
                <input
                  type="text"
                  placeholder="admin@unsu-platform.com"
                  value={headers['x-admin-email'] || ''}
                  onChange={(e) => setHeaders({ ...headers, 'x-admin-email': e.target.value })}
                  className="rounded-lg border border-border bg-background p-2 text-xs focus:outline-none focus:border-gold text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Request Body (JSON) */}
          {selectedApi.method !== 'GET' && selectedApi.defaultBody !== null && (
            <div className="space-y-2">
              <span className="mono-label text-[10px] text-muted-foreground font-bold">본문 데이터 (JSON Request Body)</span>
              <textarea
                rows={6}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full font-mono text-[11px] rounded-lg border border-border bg-background p-3 focus:outline-none focus:border-gold text-foreground"
              />
            </div>
          )}

          {/* Run Button */}
          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="tap w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isLoading ? 'API 호출 전송 중...' : 'API 요청 전송 (Execute)'}</span>
          </button>
        </div>

        {/* Response Console */}
        {(responseStatus !== null || sseOutput.length > 0) && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="mono-label text-[10px] text-muted-foreground font-bold">통신 결과 (HTTP Response)</span>
              {responseStatus !== null && (
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                  responseStatus >= 200 && responseStatus < 300 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  HTTP {responseStatus}
                </span>
              )}
            </div>

            {/* SSE Terminal Output */}
            {selectedApi.path === '/api/recommend/stream' && sseOutput.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">SSE Stream Console Output:</span>
                <div className="bg-[#1e1e1e] text-emerald-400 font-mono text-[11px] p-4 rounded-xl max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {sseOutput.map((line, idx) => (
                    <div key={idx} className="mb-1">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Response Body */}
            {selectedApi.path !== '/api/recommend/stream' && responseBody && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">JSON Response Body:</span>
                <pre className="bg-[#1e1e1e] text-slate-200 font-mono text-[11px] p-4 rounded-xl max-h-[300px] overflow-y-auto shadow-inner">
                  {responseBody}
                </pre>
              </div>
            )}
            
            {/* Headers received */}
            {Object.keys(responseHeaders).length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">Response Headers:</span>
                <pre className="text-[9px] font-mono text-muted-foreground bg-secondary/30 p-2.5 rounded border border-border/40 overflow-x-auto">
                  {Object.entries(responseHeaders).map(([k, v]) => `${k}: ${v}`).join('\n')}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 3. Driver Master Profile Management (PII Panel)
// ============================================================================
function DriverManagement() {
  const [searchId, setSearchId] = useState('')
  const [driverProfile, setDriverProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formState, setFormState] = useState({
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
    address: ''
  })

  // List of registered drivers
  const [driversList, setDriversList] = useState<any[]>([])
  const [isListLoading, setIsListLoading] = useState(false)

  // History states
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  const adminEmail = sessionStorage.getItem('admin_email') || 'admin@unsu-platform.com'
  const adminRole = sessionStorage.getItem('admin_role') || 'Manager'

  const maskHomeTaxId = (id: string) => {
    if (!id) return '';
    if (id.length <= 4) return '****';
    return id.slice(0, 3) + '*'.repeat(id.length - 3);
  };

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
    if (phone.length > 4) {
      return phone.slice(0, phone.length - 4) + '****';
    }
    return '****';
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const maskedName = name.length <= 2 ? '**' : name.slice(0, 2) + '*'.repeat(name.length - 2);
      return `${maskedName}@${parts[1]}`;
    }
    return '****';
  };

  const maskAddress = (address: string) => {
    if (!address) return '';
    const parts = address.split(' ');
    if (parts.length > 2) {
      return parts.slice(0, 2).join(' ') + ' ****';
    }
    return address.slice(0, Math.floor(address.length / 2)) + '****';
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

  const maskCarNumber = (num: string) => {
    if (!num) return '';
    if (num.length <= 4) return '*'.repeat(num.length);
    return num.slice(0, num.length - 4) + '****';
  };

  const fetchDriversList = async () => {
    setIsListLoading(true)
    try {
      const res = await fetch(`${API_HOST}/api/admin/drivers`)
      if (res.ok) {
        const data = await res.json()
        setDriversList(data)
      }
    } catch (e) {
      console.error('Failed to fetch drivers list:', e)
    } finally {
      setIsListLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDriversList()
  }, [])

  const loadDriverById = async (id: string) => {
    setIsLoading(true)
    setError('')
    setSuccessMsg('')
    setDriverProfile(null)

    try {
      const res = await fetch(`${API_HOST}/api/drivers/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDriverProfile(data)
        setFormState({
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
          address: data.address || ''
        })
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || '해당 기사 ID를 찾을 수 없습니다.')
      }
    } catch (err) {
      console.error(err)
      setError('서버 연결 실패. 네트워크 상태를 확인하세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchId.trim()) return
    await loadDriverById(searchId)
  }

  const handleSelectDriver = (id: string) => {
    setSearchId(id)
    loadDriverById(id)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch(`${API_HOST}/api/admin/drivers/${searchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify(formState)
      })

      if (res.ok) {
        setSuccessMsg('기사 마스터 프로필 정보가 성공적으로 업데이트되었습니다. (보안 감사 로그 자동 적재)')
        setDriverProfile({ ...formState })
        fetchDriversList() // Refresh list to reflect updates
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || '수정 처리에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      setError('서버 통신 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!confirm(`[경고] 기사 계정을 영구 탈퇴 처리하시겠습니까?\n\n탈퇴 시 PII 개인 식별 프로필은 파쇄되나, 재가입 남용 방지를 위한 SHA-256 해시 락 정보가 생성되어 3일간 재가입이 차단됩니다.`)) {
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch(`${API_HOST}/api/drivers/${searchId}/withdraw`, {
        method: 'POST'
      })

      if (res.ok) {
        setSuccessMsg('기사 계정이 정상적으로 탈퇴(파쇄) 처리되었습니다.')
        setDriverProfile(null)
        fetchDriversList() // Refresh list to remove withdrawn driver
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.error || '탈퇴 처리에 실패했습니다.')
      }
    } catch (err) {
      console.error(err)
      setError('서버 통신 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const openHistory = async () => {
    setShowHistoryModal(true)
    setIsHistoryLoading(true)
    try {
      const res = await fetch(`${API_HOST}/api/admin/audit-logs`)
      if (res.ok) {
        const data = await res.json()
        const filtered = data.filter((log: any) => 
          log.target_id === searchId && log.action_type === 'DRIVER_UPDATE'
        )
        setHistoryLogs(filtered)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">기사 회원 정보 관리 (PII Control Panel)</h2>
          <p className="text-sm text-muted-foreground">개인정보(홈택스 식별 ID, 생년월일 등) 복호화 조회 및 강제 수정/회원탈퇴 관리 권한을 제공합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
            adminRole === 'Super Admin' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            내 권한: {adminRole}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 좌측 2열: 검색 바 및 상세 정보/에디터 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 검색 바 */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">조회할 기사 고유 식별 ID</label>
                <input
                  type="text"
                  placeholder="기사 ID 입력"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:border-gold transition-colors text-foreground"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="tap self-end py-3 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-50"
              >
                기사 프로필 조회
              </button>
            </form>

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg mt-4">
                ⚠️ {error}
              </p>
            )}

            {successMsg && (
              <p className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg mt-4">
                ✅ {successMsg}
              </p>
            )}
          </div>

          {/* 기사 정보 수정/관리 영역 */}
          {driverProfile ? (
            <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
              {/* 좌측: 현재 프로필 요약 (복호화 데이터 표출) */}
              <div className="md:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="mono-label text-[10px] text-muted-foreground font-bold border-b border-border pb-2">기사 마스터 데이터 요약</h3>
                
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block font-bold">기사 ID</span>
                    <span className="font-mono text-sm font-bold text-foreground">{searchId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block font-bold">이름</span>
                      <span className="text-sm font-bold text-foreground">{adminRole === 'Super Admin' ? (driverProfile.name || '-') : maskName(driverProfile.name)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold">연락처</span>
                      <span className="font-mono text-sm font-bold text-foreground">{adminRole === 'Super Admin' ? (driverProfile.phoneNumber || '-') : maskPhoneNumber(driverProfile.phoneNumber)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block font-bold">생년월일 (만세력 기준)</span>
                      <span className="text-sm font-bold text-foreground">
                        {driverProfile.birthDate ? `${driverProfile.birthDate.slice(-5).replace('-', '년')}월` : '-'} 생
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold">출생시간</span>
                      <span className="font-mono text-sm font-bold text-foreground">{driverProfile.birthTime || '-'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block font-bold">영업 종류</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border inline-block mt-0.5 ${
                        driverProfile.businessType === 'PREMIUM'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-secondary text-secondary-foreground border-border'
                      }`}>
                        {driverProfile.businessType === 'PREMIUM' ? '모범/대형 (PREMIUM)' : '개인택시 (PRIVATE)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold">기본 내비게이션</span>
                      <span className="font-mono text-xs font-bold text-gold mt-0.5 inline-block">{driverProfile.naviPreference || 'TMAP'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block font-bold">차종</span>
                      <span className="text-xs font-bold text-foreground">{driverProfile.carModel || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold">차량 번호</span>
                      <span className="font-mono text-xs font-bold text-foreground">{driverProfile.carNumber || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-bold">이메일 주소</span>
                    <span className="font-mono text-xs font-bold text-foreground">{adminRole === 'Super Admin' ? (driverProfile.email || '-') : maskEmail(driverProfile.email)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-bold">주소 정보</span>
                    <span className="text-xs font-bold text-foreground">{adminRole === 'Super Admin' ? (driverProfile.address || '-') : maskAddress(driverProfile.address)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-bold">국세청 홈택스 ID</span>
                    <span className="font-mono text-sm font-bold text-foreground bg-primary/5 px-2 py-1 rounded border border-primary/10 select-all block mt-1">
                      {adminRole === 'Super Admin' ? driverProfile.homeTaxId : maskHomeTaxId(driverProfile.homeTaxId)}
                    </span>
                    {adminRole !== 'Super Admin' && (
                      <span className="text-[10px] text-amber-500 font-bold block mt-1">⚠️ 보안 마스킹 가이드 적용 중 (조회 권한 제한됨)</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/80 space-y-2">
                  <button
                    type="button"
                    onClick={openHistory}
                    className="tap w-full py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    변경 이력 보기 (Audit History)
                  </button>
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={isLoading || adminRole !== 'Super Admin'}
                    className={`tap w-full py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      adminRole !== 'Super Admin'
                        ? 'bg-secondary/40 text-muted-foreground border-border/40 cursor-not-allowed'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-500'
                    }`}
                  >
                    기사 강제 탈퇴 처리
                  </button>
                </div>
              </div>

              {/* 우측: 수정 에디터 폼 */}
              <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="mono-label text-[10px] text-muted-foreground font-bold border-b border-border pb-2 mb-4">데이터 수정 에디터</h3>
                
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">이름</label>
                      <input
                        type="text"
                        value={adminRole === 'Super Admin' ? formState.name : maskName(formState.name)}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        required
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">연락처</label>
                      <input
                        type="text"
                        value={adminRole === 'Super Admin' ? formState.phoneNumber : maskPhoneNumber(formState.phoneNumber)}
                        onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                        required
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground font-mono ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">생년월일 (YYYY-MM-DD)</label>
                      <input
                        type="text"
                        value={adminRole === 'Super Admin' ? formState.birthDate : maskBirthDate(formState.birthDate)}
                        onChange={(e) => setFormState({ ...formState, birthDate: e.target.value })}
                        required
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground font-mono ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">출생 시간 (HH:MM)</label>
                      <input
                        type="text"
                        value={adminRole === 'Super Admin' ? formState.birthTime : maskBirthTime(formState.birthTime)}
                        onChange={(e) => setFormState({ ...formState, birthTime: e.target.value })}
                        required
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground font-mono ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">영업 유형</label>
                      <select
                        value={formState.businessType}
                        onChange={(e) => setFormState({ ...formState, businessType: e.target.value as any })}
                        disabled={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      >
                        <option value="PRIVATE">개인택시 (PRIVATE)</option>
                        <option value="PREMIUM">모범/대형 (PREMIUM)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">내비게이션 설정</label>
                      <select
                        value={formState.naviPreference}
                        onChange={(e) => setFormState({ ...formState, naviPreference: e.target.value as any })}
                        disabled={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      >
                        <option value="TMAP">티맵 (TMAP)</option>
                        <option value="KAKAONAVI">카카오네비 (KAKAONAVI)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">차종</label>
                      <input
                        type="text"
                        value={formState.carModel}
                        onChange={(e) => setFormState({ ...formState, carModel: e.target.value })}
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">차량 번호</label>
                      <input
                        type="text"
                        value={adminRole === 'Super Admin' ? formState.carNumber : maskCarNumber(formState.carNumber)}
                        onChange={(e) => setFormState({ ...formState, carNumber: e.target.value })}
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground font-mono ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">이메일</label>
                      <input
                        type="email"
                        value={adminRole === 'Super Admin' ? formState.email : maskEmail(formState.email)}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground font-mono ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">주소</label>
                      <input
                        type="text"
                        value={adminRole === 'Super Admin' ? formState.address : maskAddress(formState.address)}
                        onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                        disabled={adminRole !== 'Super Admin'}
                        readOnly={adminRole !== 'Super Admin'}
                        className={`w-full rounded-lg border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground ${
                          adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed border-border' : 'border-border bg-background'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">국세청 홈택스 ID</label>
                      {adminRole !== 'Super Admin' && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded font-bold border border-rose-500/20">
                          수정 비활성화 (Super Admin 전용)
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={adminRole === 'Super Admin' ? formState.homeTaxId : maskHomeTaxId(formState.homeTaxId)}
                      onChange={(e) => setFormState({ ...formState, homeTaxId: e.target.value })}
                      required
                      disabled={adminRole !== 'Super Admin'}
                      readOnly={adminRole !== 'Super Admin'}
                      className={`w-full rounded-lg border border-border p-2.5 text-xs focus:outline-none focus:border-gold text-foreground font-mono ${
                        adminRole !== 'Super Admin' ? 'bg-secondary/40 opacity-70 cursor-not-allowed' : 'bg-background'
                      }`}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ⚠️ 저장 시 즉시 AES-256-GCM 암호화 블록으로 인코딩되어 DB에 덮어씌워지며, 관리자의 수정 행위는 로깅됩니다.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || adminRole !== 'Super Admin'}
                    className={`tap w-full py-3.5 rounded-xl text-xs font-bold shadow transition-colors cursor-pointer ${
                      adminRole !== 'Super Admin'
                        ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border/60'
                        : 'bg-primary text-primary-foreground hover:bg-primary/95'
                    }`}
                  >
                    수정 프로필 데이터 반영하기
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-sm text-muted-foreground shadow-sm">
              우측 목록에서 가입 기사를 선택하거나, 기사 고유 식별 ID를 직접 검색하여 프로필을 로드해 주세요.
            </div>
          )}
        </div>

        {/* 우측 1열: 실시간 가입 기사 목록 */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-[600px]">
          <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
            <h3 className="mono-label text-[10px] text-muted-foreground font-bold uppercase tracking-wider">실시간 가입 기사 목록 ({driversList.length})</h3>
            <button
              onClick={fetchDriversList}
              disabled={isListLoading}
              className="text-[10px] font-bold text-gold hover:text-gold/80 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              새로고침
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isListLoading ? (
              <p className="text-center text-xs text-muted-foreground py-8">목록 로드 중...</p>
            ) : driversList.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8 font-sans">가입된 기사가 없습니다.</p>
            ) : (
              driversList.map(d => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDriver(d.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                    searchId === d.id && driverProfile
                      ? 'bg-primary/10 border-primary/20 hover:bg-primary/15'
                      : 'bg-secondary/20 border-border/40 hover:bg-secondary/40 hover:border-border/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-foreground font-sans">{adminRole === 'Super Admin' ? (d.name || '이름 없음') : maskName(d.name)}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${
                      d.business_type === 'PREMIUM'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-secondary text-secondary-foreground border-border'
                    }`}>
                      {d.business_type === 'PREMIUM' ? 'PREMIUM' : 'PRIVATE'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                    <span>ID: {d.id}</span>
                    <span>{adminRole === 'Super Admin' ? (d.phone_number || '-') : maskPhoneNumber(d.phone_number)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 변경 이력 팝업 모달 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card border border-border w-full max-w-3xl rounded-2xl p-6 shadow-xl space-y-5 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">기사 프로필 정보 변경 이력</h3>
                <p className="text-xs text-muted-foreground">기사 ID: <strong className="text-foreground">{searchId}</strong>의 이전/이후 변경 이력 일체</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {isHistoryLoading ? (
                <p className="text-center text-xs text-muted-foreground py-12">이력 정보를 로드하는 중...</p>
              ) : historyLogs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-12">기사 프로필의 관리자 변경 수정 이력이 존재하지 않습니다.</p>
              ) : (
                <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/60 text-muted-foreground font-bold">
                        <th className="p-3">변경 일시</th>
                        <th className="p-3">변경자</th>
                        <th className="p-3">변경 세부 이력 (이전 → 이후 값)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {historyLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 whitespace-nowrap text-muted-foreground">
                            {new Date(log.created_at || log.createdAt).toLocaleString('ko-KR')}
                          </td>
                          <td className="p-3 font-sans font-bold text-foreground">{log.admin_email}</td>
                          <td className="p-3 font-sans leading-relaxed text-foreground/90 max-w-sm whitespace-pre-wrap">
                            {log.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('bo_logged_in') === 'true'
  })

  const handleLogin = (email: string, role: string) => {
    setIsLoggedIn(true)
    sessionStorage.setItem('bo_logged_in', 'true')
    sessionStorage.setItem('admin_email', email)
    sessionStorage.setItem('admin_role', role)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    sessionStorage.removeItem('bo_logged_in')
    sessionStorage.removeItem('admin_email')
    sessionStorage.removeItem('admin_role')
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<TaxAutopilotMonitor />} />
          <Route path="/partner" element={<PartnerSettlement />} />
          <Route path="/plaza" element={<PlazaModeration />} />
          <Route path="/gpan" element={<GPanStatusDashboard />} />
          <Route path="/events" element={<EventMonitor />} />
          <Route path="/drivers" element={<DriverManagement />} />
          <Route path="/audit-logs" element={<AuditLogsDashboard />} />
          <Route path="/api-playground" element={<ApiPlayground />} />
          <Route path="/external-apis" element={<ExternalApiMonitor />} />
          <Route path="*" element={<TaxAutopilotMonitor />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
