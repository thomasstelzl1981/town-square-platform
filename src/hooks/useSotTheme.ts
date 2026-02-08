import { useState, useEffect, useCallback } from 'react';

type SotTheme = 'light' | 'dark';

const STORAGE_KEY = 'sot-theme-preference';

/**
 * Hook for SoT-specific theme management
 * Defaults to dark (SpaceX-inspired)
 * Applies theme class directly to document.documentElement for proper CSS variable scoping
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

  // Apply theme class to documentElement (html) for proper CSS variable cascade
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const themeClass = theme === 'dark' ? 'theme-sot-dark' : 'theme-sot';
    
    // Remove any existing SoT theme classes
    root.classList.remove('theme-sot', 'theme-sot-dark');
    
    // Add the current theme class
    root.classList.add(themeClass);
    
    // Store preference
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Cleanup on unmount (when leaving SoT pages)
    return () => {
      root.classList.remove('theme-sot', 'theme-sot-dark');
    };
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