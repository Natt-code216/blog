import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { getTheme, getServerTheme, subscribeTheme, toggleTheme, type Theme } from '../theme';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
