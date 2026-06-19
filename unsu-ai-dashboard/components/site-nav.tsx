'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

const links = [
  { label: '기능', href: '#features' },
  { label: '작동 방식', href: '#how' },
  { label: '운수 리포트', href: '#report' },
  { label: '요금제', href: '#pricing' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <a href="#" className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tracking-tight">운수대통</span>
          <span className="mono-label text-muted-foreground">UNSU</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#pricing"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex md:px-2"
          >
            로그인
          </a>
          <a
            href="#pricing"
            className="tap hidden rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground md:inline-flex"
          >
            기사 등록
          </a>
          <button
            type="button"
            aria-label="메뉴"
            onClick={() => setOpen((v) => !v)}
            className="tap inline-flex h-9 w-9 items-center justify-center rounded-full border border-border md:hidden"
          >
            {open ? (
              <X className="h-4 w-4" strokeWidth={1.6} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={1.6} />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border/60 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-secondary"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="tap mt-2 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              기사 등록
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
