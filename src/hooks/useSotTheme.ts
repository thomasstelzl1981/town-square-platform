import { useState, useEffect, useCallback } from 'react';

type SotTheme = 'light' | 'dark';

const STORAGE_KEY = 'sot-theme-preference';

/**
 * Hook for SoT-specific theme management
 * Defaults to dark (SpaceX-inspired)
 */
export function useSotTheme() {
  const [theme, setThemeState] = useState<SotTheme>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as SotTheme | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    // Default to dark (SpaceX-style)
    return 'dark';
  });

  // Apply theme class to body when in SoT context
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Store preference
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((newTheme: SotTheme) => {
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
    themeClass: theme === 'dark' ? 'theme-sot-dark' : 'theme-sot',
  };
}