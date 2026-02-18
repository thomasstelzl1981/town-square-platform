// Portal Layout Context — provides navigation & responsive state
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AreaKey, deriveAreaFromPath, areaConfig } from '@/manifests/areaConfig';
import { getModulesSorted } from '@/manifests/routesManifest';

const SIDEBAR_KEY = 'sot-portal-sidebar-collapsed';
const ARMSTRONG_KEY = 'sot-portal-armstrong-visible';
const ARMSTRONG_EXPANDED_KEY = 'sot-portal-armstrong-expanded';
const ARMSTRONG_POSITION_KEY = 'armstrong-position';

interface PortalLayoutState {
  // Legacy sidebar (kept for backward compatibility during transition)
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Armstrong visibility (panel shown/hidden)
  armstrongVisible: boolean;
  setArmstrongVisible: (visible: boolean) => void;
  toggleArmstrong: () => void;
  
  // Armstrong expanded state (collapsed card vs full stripe)
  armstrongExpanded: boolean;
  setArmstrongExpanded: (expanded: boolean) => void;
  toggleArmstrongExpanded: () => void;
  
  // Armstrong recovery helpers
  showArmstrong: (options?: { resetPosition?: boolean; expanded?: boolean }) => void;
  hideArmstrong: () => void;
  resetArmstrong: () => void;
  
  // Area navigation (new 3-level nav) - null = Dashboard/no area selected
  activeArea: AreaKey | null;
  setActiveArea: (area: AreaKey | null) => void;
  
  // SubTabs visibility (Level 3 nav)
  subTabsVisible: boolean;
  setSubTabsVisible: (visible: boolean) => void;
  
  // Responsive state
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Mobile navigation state
  mobileNavView: 'areas' | 'modules' | 'tiles';
  setMobileNavView: (view: 'areas' | 'modules' | 'tiles') => void;
  selectedMobileModule: string | null;
  setSelectedMobileModule: (code: string | null) => void;
}

const PortalLayoutContext = createContext<PortalLayoutState | null>(null);

function getBreakpointDefault(): { sidebarCollapsed: boolean } {
  if (typeof window === 'undefined') return { sidebarCollapsed: false };
  const width = window.innerWidth;
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

// Build module route map for area detection
function buildModuleRouteMap(): Record<string, string> {
  const modules = getModulesSorted();
  const map: Record<string, string> = {};
  for (const { code, module } of modules) {
    map[code] = `/portal/${module.base}`;
  }
  return map;
}

// Migration key for localStorage cleanup — v4 for complete position/expanded reset
const ARMSTRONG_MIGRATION_KEY = 'sot-armstrong-migrated-v4';

// Run migration BEFORE React renders (synchronous, outside component)
if (typeof window !== 'undefined' && !localStorage.getItem(ARMSTRONG_MIGRATION_KEY)) {
  // Remove ALL legacy Armstrong keys
  localStorage.removeItem(ARMSTRONG_KEY);
  localStorage.removeItem(ARMSTRONG_EXPANDED_KEY);
  localStorage.removeItem(ARMSTRONG_POSITION_KEY);
  localStorage.removeItem('sot-armstrong-migrated-v2');
  localStorage.removeItem('sot-armstrong-migrated-v3');
  localStorage.removeItem('draggable-position'); // Old draggable key
  
  // Set clean defaults: visible=true, expanded=false (circle)
  localStorage.setItem(ARMSTRONG_KEY, 'true');
  localStorage.setItem(ARMSTRONG_EXPANDED_KEY, 'false');
  localStorage.setItem(ARMSTRONG_MIGRATION_KEY, 'true');
  if (import.meta.env.DEV) {
    console.log('[Armstrong] Migration v4: Complete reset to visible circle');
  }
}

export function PortalLayoutProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  // Legacy sidebar state
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(SIDEBAR_KEY) : null;
    if (stored !== null) return stored === 'true';
    return getBreakpointDefault().sidebarCollapsed;
  });
  
  // Armstrong visibility (default VISIBLE as Planet)
  const [armstrongVisible, setArmstrongVisibleState] = useState(() => {
    return getStoredValue(ARMSTRONG_KEY, true);
  });
  
  // Armstrong expanded state — ALWAYS start as false (collapsed circle)
  // We do NOT read from localStorage for expanded state anymore to prevent legacy issues
  const [armstrongExpanded, setArmstrongExpandedState] = useState(false);
  
  // Active area (derived from route initially) - null for Dashboard
  const [activeArea, setActiveAreaState] = useState<AreaKey | null>(() => {
    if (typeof window === 'undefined') return null;
    // Dashboard paths return null
    if (location.pathname === '/portal' || location.pathname === '/portal/') {
      return null;
    }
    const moduleRouteMap = buildModuleRouteMap();
    return deriveAreaFromPath(location.pathname, moduleRouteMap);
  });
  
  // Mobile navigation state
  const [mobileNavView, setMobileNavView] = useState<'areas' | 'modules' | 'tiles'>('areas');
  const [selectedMobileModule, setSelectedMobileModule] = useState<string | null>(null);
  
  // SubTabs visibility (hidden by default, shown when module is selected)
  const [subTabsVisible, setSubTabsVisible] = useState(false);

  // Handle breakpoint changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync active area with route changes
  useEffect(() => {
    const moduleRouteMap = buildModuleRouteMap();
    const derivedArea = deriveAreaFromPath(location.pathname, moduleRouteMap);
    if (derivedArea !== activeArea) {
      setActiveAreaState(derivedArea);
    }
  }, [location.pathname]);

  // Sidebar controls
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  // Armstrong visibility controls
  const setArmstrongVisible = useCallback((visible: boolean) => {
    setArmstrongVisibleState(visible);
    localStorage.setItem(ARMSTRONG_KEY, String(visible));
  }, []);

  const toggleArmstrong = useCallback(() => {
    setArmstrongVisible(!armstrongVisible);
  }, [armstrongVisible, setArmstrongVisible]);

  // Armstrong expanded controls — do NOT persist to localStorage
  const setArmstrongExpanded = useCallback((expanded: boolean) => {
    setArmstrongExpandedState(expanded);
    // Removed localStorage persistence for expanded state
  }, []);

  const toggleArmstrongExpanded = useCallback(() => {
    setArmstrongExpanded(!armstrongExpanded);
  }, [armstrongExpanded, setArmstrongExpanded]);

  // Armstrong recovery helpers
  const showArmstrong = useCallback((options?: { resetPosition?: boolean; expanded?: boolean }) => {
    const { resetPosition = false, expanded = false } = options || {};
    
    if (resetPosition) {
      localStorage.removeItem(ARMSTRONG_POSITION_KEY);
      if (import.meta.env.DEV) {
        console.log('[Armstrong] Position reset');
      }
    }
    
    setArmstrongVisibleState(true);
    localStorage.setItem(ARMSTRONG_KEY, 'true');
    
    // Always set expanded state (default: false = circle)
    setArmstrongExpandedState(expanded);
  }, []);

  const hideArmstrong = useCallback(() => {
    setArmstrongVisibleState(false);
    localStorage.setItem(ARMSTRONG_KEY, 'false');
    // Reset expanded to false so next show starts as circle
    setArmstrongExpandedState(false);
  }, []);

  const resetArmstrong = useCallback(() => {
    // Clear all Armstrong state and reset to defaults
    localStorage.removeItem(ARMSTRONG_POSITION_KEY);
    localStorage.removeItem(ARMSTRONG_KEY);
    localStorage.removeItem(ARMSTRONG_EXPANDED_KEY);
    
    setArmstrongVisibleState(true);
    setArmstrongExpandedState(false);
    
    localStorage.setItem(ARMSTRONG_KEY, 'true');
    localStorage.setItem(ARMSTRONG_EXPANDED_KEY, 'false');
    
    if (import.meta.env.DEV) {
      console.log('[Armstrong] Full reset completed');
    }
  }, []);

  // Area controls - hide SubTabs when area changes (accepts null for Dashboard)
  const setActiveArea = useCallback((area: AreaKey | null) => {
    setActiveAreaState(area);
    setSubTabsVisible(false); // Hide Level 3 when Level 1 is clicked
  }, []);

  const value: PortalLayoutState = {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    armstrongVisible,
    setArmstrongVisible,
    toggleArmstrong,
    armstrongExpanded,
    setArmstrongExpanded,
    toggleArmstrongExpanded,
    showArmstrong,
    hideArmstrong,
    resetArmstrong,
    activeArea,
    setActiveArea,
    subTabsVisible,
    setSubTabsVisible,
    isMobile,
    isTablet,
    isDesktop,
    mobileNavView,
    setMobileNavView,
    selectedMobileModule,
    setSelectedMobileModule,
  };

  return (
    <PortalLayoutContext.Provider value={value}>
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
