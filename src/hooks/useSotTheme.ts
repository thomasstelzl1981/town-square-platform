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
  // NO CLEANUP that removes the class - we want it to persist during toggle
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const themeClass = theme === 'dark' ? 'theme-sot-dark' : 'theme-sot';
    const oppositeClass = theme === 'dark' ? 'theme-sot' : 'theme-sot-dark';
    
    // Remove the opposite theme class (not all classes!)
    root.classList.remove(oppositeClass);
    
    // Add the current theme class
    root.classList.add(themeClass);
    
    // Set data attribute for CSS fallback
    root.setAttribute('data-sot-theme', theme);
    
    // Store preference
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Note: We do NOT clean up on every theme change
    // Cleanup only happens when component unmounts (leaving SoT)
  }, [theme]);

  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      root.classList.remove('theme-sot', 'theme-sot-dark');
      root.removeAttribute('data-sot-theme');
    };
  }, []); // Empty deps = only runs on unmount

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