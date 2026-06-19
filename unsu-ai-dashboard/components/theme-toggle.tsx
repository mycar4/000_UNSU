'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('unsu-theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="tap inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:bg-secondary"
    >
      {mounted && dark ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.6} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.6} />
      )}
    </button>
  )
}
