import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Sunset, Moon } from 'lucide-react';

export function TopAppBar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-6 transition-colors duration-500">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-xl tracking-tight text-foreground">운수대통</span>
        <span className="mono-label text-[10px] text-gold font-bold">AI PLATFORM</span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* 테마 컨트롤러 */}
        <div className="flex gap-1 bg-secondary/80 p-1 rounded-full border border-border/80 backdrop-blur-sm">
          <button 
            onClick={() => setTheme('day')} 
            className={`tap p-1.5 rounded-full transition-all duration-300 ${
              theme === 'day' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="낮 테마"
          >
            <Sun size={16} />
          </button>
          <button 
            onClick={() => setTheme('sunset')} 
            className={`tap p-1.5 rounded-full transition-all duration-300 ${
              theme === 'sunset' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="노을 테마"
          >
            <Sunset size={16} />
          </button>
          <button 
            onClick={() => setTheme('night')} 
            className={`tap p-1.5 rounded-full transition-all duration-300 ${
              theme === 'night' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="밤 테마"
          >
            <Moon size={16} />
          </button>
        </div>

        {/* 운행 상태 뱃지 */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="mono-label text-[9px] text-gold font-bold">ON DUTY</span>
        </div>
      </div>
    </header>
  );
}
