import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'

export function TopAppBar() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tracking-tight">운수대통</span>
          <span className="mono-label text-muted-foreground">UNSU</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className={`text-sm transition-colors hover:text-foreground ${location.pathname === '/' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            오늘의 루틴
          </Link>
          <Link to="/search" className={`text-sm transition-colors hover:text-foreground ${location.pathname === '/search' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            G-PAN 레이더
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button className="tap rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
            기사 출근
          </button>
        </div>
      </nav>
    </header>
  )
}
