import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

const SIDEBAR_KEY = 'sot-portal-sidebar-collapsed';
const ARMSTRONG_KEY = 'sot-portal-armstrong-visible';

interface PortalLayoutState {
  sidebarCollapsed: boolean;
  armstrongVisible: boolean;
  isMobile: boolean;
  isTablet: boolean;
  toggleSidebar: () => void;
  toggleArmstrong: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setArmstrongVisible: (visible: boolean) => void;
}

const PortalLayoutContext = createContext<PortalLayoutState | null>(null);

function getBreakpointDefault(): { sidebarCollapsed: boolean } {
  if (typeof window === 'undefined') return { sidebarCollapsed: false };
  const width = window.innerWidth;
  // >= 1280px (xl): expanded default
  // 768px - 1279px: collapsed default
  // < 768px: no sidebar (drawer instead)
  if (width >= 1280) return { sidebarCollapsed: false };
  if (width >= 768) return { sidebarCollapsed: true };
  return { sidebarCollapsed: true };
}

function getStoredValue(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored === 'true';
}

export function PortalLayoutProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Initialize with breakpoint defaults, then check localStorage
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(SIDEBAR_KEY) : null;
    if (stored !== null) return stored === 'true';
    return getBreakpointDefault().sidebarCollapsed;
  });
  
  // Armstrong default HIDDEN
  const [armstrongVisible, setArmstrongVisibleState] = useState(() => {
    return getStoredValue(ARMSTRONG_KEY, false);
  });

  // Handle breakpoint changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, []);

  const setArmstrongVisible = useCallback((visible: boolean) => {
    setArmstrongVisibleState(visible);
    localStorage.setItem(ARMSTRONG_KEY, String(visible));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const toggleArmstrong = useCallback(() => {
    setArmstrongVisible(!armstrongVisible);
  }, [armstrongVisible, setArmstrongVisible]);

  return (
    <PortalLayoutContext.Provider value={{
      sidebarCollapsed,
      armstrongVisible,
      isMobile,
      isTablet,
      toggleSidebar,
      toggleArmstrong,
      setSidebarCollapsed,
      setArmstrongVisible,
    }}>
      {children}
    </PortalLayoutContext.Provider>
  );
}

export function usePortalLayout(): PortalLayoutState {
  const context = useContext(PortalLayoutContext);
  if (!context) {
    throw new Error('usePortalLayout must be used within PortalLayoutProvider');
  }
  return context;
}
