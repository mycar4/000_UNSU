import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'day' | 'sunset' | 'night';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('day');

  useEffect(() => {
    // 테마가 변경될 때마다 html 클래스 업데이트
    const root = window.document.documentElement;
    root.classList.remove('theme-day', 'theme-sunset', 'theme-night');
    if (theme !== 'day') {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  // 실제 앱에서는 디바이스 시간 기반으로 자동 전환 로직을 여기에 추가할 수 있습니다.
  // const currentHour = new Date().getHours();
  // if (currentHour >= 18 && currentHour < 20) setTheme('sunset'); ...

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
