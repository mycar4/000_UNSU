import React from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Settings, RefreshCw, Database } from 'lucide-react'
import { PromptPlayground } from './pages/PromptPlayground'
import { ScrapingControl } from './pages/ScrapingControl'
import { VectorCapacity } from './pages/VectorCapacity'

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const navs = [
    { label: '프롬프트 테스트 룸', path: '/', icon: Settings },
    { label: '스크래핑 관제', path: '/scraping', icon: RefreshCw },
    { label: '벡터 DB 모니터링', path: '/vector', icon: Database },
  ]

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/80 bg-card/60 backdrop-blur-md flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/60">
          <Link to="/" className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight">운수대통 관제</span>
            <span className="mono-label text-[10px] text-muted-foreground">BO</span>
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
        <div className="p-4 border-t border-border/60">
          <span className="mono-label text-[10px] text-muted-foreground">Admin Session Active</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-6xl">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PromptPlayground />} />
          <Route path="/scraping" element={<ScrapingControl />} />
          <Route path="/vector" element={<VectorCapacity />} />
          <Route path="*" element={<PromptPlayground />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
