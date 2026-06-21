import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Radio, Award, Compass, Moon } from 'lucide-react'

export function BottomNavBar() {
  const location = useLocation()

  const tabs = [
    { label: '루틴', path: '/', icon: Home },
    { label: 'G-PAN', path: '/gpan', icon: Radio },
    { label: '로드보더', path: '/board', icon: Award },
    { label: '오토파일럿', path: '/autopilot', icon: Compass },
    { label: '달의뒷편', path: '/darkside', icon: Moon },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 py-2 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md justify-around px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`tap flex flex-col items-center gap-1 px-3 py-1.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium tracking-tight">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
