/**
 * SoT Layout — SpaceX-Inspired Dark-First Design
 * Theme is applied both via CSS class AND useEffect for proper cascade
 */
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SotHeader, SotFooter, SotInputBar } from '@/components/zone3/sot';
import { useSotTheme } from '@/hooks/useSotTheme';
import '@/styles/zone3-theme.css';
import '@/styles/sot-premium.css';

export default function SotLayout() {
  const { themeClass, isDark } = useSotTheme();

  // Force re-apply theme class on mount and theme change for mobile Safari
  useEffect(() => {
    const root = document.documentElement;
    // Remove any competing theme classes
    root.classList.remove('theme-sot', 'theme-sot-dark', 'dark', 'light');
    // Apply the correct theme class
    root.classList.add(themeClass);
    
    // Also set a data attribute for CSS fallback
    root.setAttribute('data-sot-theme', isDark ? 'dark' : 'light');
    
    return () => {
      root.classList.remove('theme-sot', 'theme-sot-dark');
      root.removeAttribute('data-sot-theme');
    };
  }, [themeClass, isDark]);

  return (
    <div className={`${themeClass} zone3-page min-h-screen flex flex-col`}>
      <SotHeader />
      
      <main className="flex-1 pt-16 lg:pt-20 pb-20">
        <Outlet />
      </main>
      
      <SotFooter />
      <SotInputBar />
    </div>
  );
}