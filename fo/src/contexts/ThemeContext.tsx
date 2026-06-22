import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'day' | 'sunset' | 'night';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isOnDuty: boolean;
  setIsOnDuty: (onDuty: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('day');
  const [isOnDuty, setIsOnDuty] = useState(() => {
    return localStorage.getItem('isRestMode') !== 'true';
  });

  useEffect(() => {
    // 테마가 변경될 때마다 html 클래스 업데이트
    const root = window.document.documentElement;
    root.classList.remove('theme-day', 'theme-sunset', 'theme-night');
    if (theme !== 'day') {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isOnDuty, setIsOnDuty }}>
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
