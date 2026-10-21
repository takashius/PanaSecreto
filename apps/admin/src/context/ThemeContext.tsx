import { useEffect, useState, ReactNode } from 'react';
import { ThemeContext, type Theme } from './contexts';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDarkMode');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return false;
      }
    }
    const legacy = localStorage.getItem('theme');
    if (legacy === 'dark') return true;
    return false;
  });

  const theme: Theme = isDarkMode ? 'dark' : 'light';

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleTheme = toggleDarkMode;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
