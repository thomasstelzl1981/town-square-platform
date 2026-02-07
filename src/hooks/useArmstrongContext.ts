/**
 * useArmstrongContext — Context injection for Armstrong
 * 
 * Provides Zone 2 and Zone 3 context based on current route and auth state.
 * Used by ChatPanel and ArmstrongWidget to inject context into requests.
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { zone2Portal } from '@/manifests/routesManifest';
import { 
  getActionsForZone, 
  filterActionsByRole, 
  type ArmstrongAction,
  type ArmstrongZone 
} from '@/manifests/armstrongManifest';

// =============================================================================
// TYPES
// =============================================================================

export interface Zone2Context {
  zone: 'Z2';
  tenant_id: string;
  user_id: string;
  user_roles: string[];
  
  // Navigation Context
  current_module: string | null;
  current_area: string | null;
  current_path: string;
  
  // Entity Context (when on detail page)
  entity_type: string | null;
  entity_id: string | null;
  
  // Permissions
  allowed_actions: string[];
  web_research_enabled: boolean;
}

export interface Zone3Context {
  zone: 'Z3';
  website: 'kaufy' | 'miety' | 'sot' | 'futureroom' | null;
  
  // No user/tenant in Zone 3
  user_id: null;
  tenant_id: null;
  
  // Page Context
  current_path: string;
  listing_id: string | null;
  
  // Session (anonymous)
  session_id: string;
  
  // Limitations
  allowed_actions: string[];
  web_research_enabled: false;
}

export type ArmstrongContext = Zone2Context | Zone3Context;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Determine current zone from path
 */
function getZoneFromPath(pathname: string): ArmstrongZone {
  if (pathname.startsWith('/portal')) return 'Z2';
  if (pathname.startsWith('/kaufy') || 
      pathname.startsWith('/miety') || 
      pathname.startsWith('/sot') || 
      pathname.startsWith('/futureroom')) return 'Z3';
  // Default to Z3 for public routes
  return 'Z3';
}

/**
 * Determine website brand from path
 */
function getWebsiteFromPath(pathname: string): Zone3Context['website'] {
  if (pathname.startsWith('/kaufy')) return 'kaufy';
  if (pathname.startsWith('/miety')) return 'miety';
  if (pathname.startsWith('/sot')) return 'sot';
  if (pathname.startsWith('/futureroom')) return 'futureroom';
  return null;
}

/**
 * Extract module code from portal path
 */
function getModuleFromPath(pathname: string): string | null {
  if (!pathname.startsWith('/portal/')) return null;
  
  const segments = pathname.replace('/portal/', '').split('/');
  const moduleBase = segments[0];
  
  // Find matching module in manifest
  for (const [code, module] of Object.entries(zone2Portal.modules || {})) {
    if (module.base === moduleBase) {
      return code;
    }
  }
  
  return null;
}

/**
 * Extract area from module code
 */
function getAreaFromModule(moduleCode: string | null): string | null {
  if (!moduleCode) return null;
  
  // Map modules to areas based on areaConfig
  const moduleNum = parseInt(moduleCode.replace('MOD-', ''), 10);
  
  if ([1, 2, 3, 16, 20].includes(moduleNum)) return 'base';
  if ([4, 5, 6, 7, 8].includes(moduleNum)) return 'missions';
  if ([9, 10, 11, 12, 13].includes(moduleNum)) return 'operations';
  if ([14, 15, 17, 18, 19].includes(moduleNum)) return 'services';
  
  return null;
}

/**
 * Extract entity info from path
 */
function getEntityFromPath(pathname: string): { type: string | null; id: string | null } {
  // Pattern: /portal/module/entity/:id
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const segments = pathname.split('/').filter(Boolean);
  
  const idIndex = segments.findIndex(s => uuidPattern.test(s));
  if (idIndex === -1) return { type: null, id: null };
  
  const id = segments[idIndex];
  const type = segments[idIndex - 1] || null;
  
  return { type, id };
}

/**
 * Get or create anonymous session ID for Zone 3
 */
function getSessionId(): string {
  const storageKey = 'armstrong_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

/**
 * Extract listing ID from path (Zone 3)
 */
function getListingIdFromPath(pathname: string): string | null {
  // Pattern: /kaufy/objekt/:publicId or /kaufy/listing/:id
  const patterns = [
    /\/objekt\/([a-zA-Z0-9-]+)/,
    /\/listing\/([a-zA-Z0-9-]+)/,
    /\/immobilie\/([a-zA-Z0-9-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = pathname.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// =============================================================================
// HOOK
// =============================================================================

export function useArmstrongContext(): ArmstrongContext {
  const location = useLocation();
  const { user, activeOrganization, activeMembership, isPlatformAdmin } = useAuth();
  
  // Derive user roles from membership and platform admin status
  const userRoles = useMemo(() => {
    const roles: string[] = [];
    if (activeMembership?.role) {
      roles.push(activeMembership.role);
    }
    if (isPlatformAdmin) {
      roles.push('platform_admin');
    }
    return roles;
  }, [activeMembership, isPlatformAdmin]);
  
  return useMemo(() => {
    const zone = getZoneFromPath(location.pathname);
    if (zone === 'Z2' && user && activeOrganization) {
      // Zone 2: Full context with auth
      const moduleCode = getModuleFromPath(location.pathname);
      const entity = getEntityFromPath(location.pathname);
      const roles = userRoles || [];
      
      // Get allowed actions filtered by zone and role
      const zoneActions = getActionsForZone('Z2');
      const allowedActions = filterActionsByRole(zoneActions, roles);
      
      // Check if web research is enabled for this org
      const webResearchEnabled = true; // TODO: Read from org settings
      
      const context: Zone2Context = {
        zone: 'Z2',
        tenant_id: activeOrganization.id,
        user_id: user.id,
        user_roles: roles,
        current_module: moduleCode,
        current_area: getAreaFromModule(moduleCode),
        current_path: location.pathname,
        entity_type: entity.type,
        entity_id: entity.id,
        allowed_actions: allowedActions.map(a => a.action_code),
        web_research_enabled: webResearchEnabled,
      };
      
      return context;
    }
    
    // Zone 3: Anonymous context
    const zone3Actions = getActionsForZone('Z3');
    
    const context: Zone3Context = {
      zone: 'Z3',
      website: getWebsiteFromPath(location.pathname),
      user_id: null,
      tenant_id: null,
      current_path: location.pathname,
      listing_id: getListingIdFromPath(location.pathname),
      session_id: getSessionId(),
      allowed_actions: zone3Actions.map(a => a.action_code),
      web_research_enabled: false,
    };
    
    return context;
  }, [location.pathname, user, activeOrganization, userRoles, isPlatformAdmin]);
}

/**
 * Hook to get available actions for current context
 */
export function useArmstrongActions(): ArmstrongAction[] {
  const context = useArmstrongContext();
  
  return useMemo(() => {
    const zone = context.zone as ArmstrongZone;
    const zoneActions = getActionsForZone(zone);
    
    if (context.zone === 'Z2') {
      return filterActionsByRole(zoneActions, context.user_roles);
    }
    
    return zoneActions;
  }, [context]);
}

/**
 * Hook to check if specific action is available
 */
export function useCanExecuteAction(actionCode: string): boolean {
  const context = useArmstrongContext();
  return context.allowed_actions.includes(actionCode);
}
