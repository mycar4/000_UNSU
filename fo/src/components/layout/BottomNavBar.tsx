import { NavLink } from 'react-router-dom';
import { Home, Radio, Trophy, Calculator } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BottomNavBar() {
  const links = [
    { to: '/', icon: Home, label: '루틴' },
    { to: '/gpan', icon: Radio, label: 'G-PAN' },
    { to: '/board', icon: Trophy, label: '로드보더' },
    { to: '/autopilot', icon: Calculator, label: '정산' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background/90 border-t border-border/80 z-50 px-4 pb-safe flex items-center justify-around backdrop-blur-lg shadow-lg shadow-black/5 transition-colors duration-500">
      <div className="flex w-full max-w-md mx-auto justify-around items-center h-full">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "tap flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary bg-secondary/60 font-bold" 
                  : "text-muted-foreground hover:text-foreground opacity-80"
              )
            }
          >
            <link.icon size={22} strokeWidth={2.2} />
            <span className="mono-label text-[10px] tracking-tight font-bold">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
