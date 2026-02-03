import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Membership = Tables<'memberships'>;
type Profile = Tables<'profiles'>;
type Organization = Tables<'organizations'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  memberships: Membership[];
  activeMembership: Membership | null;
  activeOrganization: Organization | null;
  activeTenantId: string | null;
  isPlatformAdmin: boolean;
  isLoading: boolean;
  isDevelopmentMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Development mode detection - enables bypass for Lovable preview
const isDevelopmentEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname.includes('lovable.app') || 
         hostname.includes('lovableproject.com') ||
         hostname.includes('localhost') || 
         hostname.includes('127.0.0.1') ||
         hostname.includes('preview') ||
         hostname.includes('id-preview');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevelopmentMode] = useState(isDevelopmentEnvironment());
  // P0-PERF: Flag to prevent race condition between onAuthStateChange and getSession
  const [hasInitialized, setHasInitialized] = useState(false);

  const isPlatformAdmin = memberships.some(m => m.role === 'platform_admin');
  const activeMembership = memberships.find(m => m.tenant_id === profile?.active_tenant_id) || memberships[0] || null;
  const activeTenantId = profile?.active_tenant_id || activeOrganization?.id || activeMembership?.tenant_id || null;

  // ============================================================================
  // P0-ID-CTX-INTERNAL-DEFAULT: INTERNAL ORG IS DEFAULT CONTEXT FOR PLATFORM ADMIN
  // Marker ID: P0-ID-CTX-INTERNAL-DEFAULT
  // Dev-Mode prioritizes org_type='internal' over 'client' orgs.
  // ============================================================================
  const fetchDevelopmentData = useCallback(async () => {
    try {
      // Priority 1: Try to get internal organization (platform context)
      const { data: internalOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('org_type', 'internal')
        .limit(1)
        .maybeSingle();
      
      if (internalOrg) {
        console.log('[Dev-Mode] Using internal org:', internalOrg.name);
        setActiveOrganization(internalOrg);
        
        // Create mock membership for development with internal org
        const mockMembership: Membership = {
          id: 'dev-membership-internal',
          user_id: 'dev-user',
          tenant_id: internalOrg.id,
          role: 'platform_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMemberships([mockMembership]);
        
        // Create mock profile using org name (no hardcoded "Entwickler")
        const mockProfile = {
          id: 'dev-user',
          display_name: internalOrg.name,
          email: 'admin@systemofatown.de',
          avatar_url: null,
          active_tenant_id: internalOrg.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile;
        setProfile(mockProfile);
        return;
      }
      
      // Priority 2: Fallback to first organization (with warning)
      console.warn('[Dev-Mode] No internal org found, falling back to first available org');
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (orgData) {
        console.log('[Dev-Mode] Using fallback org:', orgData.name);
        setActiveOrganization(orgData);
        
        const mockMembership: Membership = {
          id: 'dev-membership',
          user_id: 'dev-user',
          tenant_id: orgData.id,
          role: 'platform_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMemberships([mockMembership]);
        
        // Use org name, not hardcoded value
        const mockProfile = {
          id: 'dev-user',
          display_name: orgData.name,
          email: 'dev@systemofatown.de',
          avatar_url: null,
          active_tenant_id: orgData.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile;
        setProfile(mockProfile);
        return;
      }
      
      // Priority 3: No orgs in DB - use FIXED DEV UUID (not mock string!)
      // This UUID matches the 'System of a Town' internal org created by migration
      console.log('[Dev-Mode] No organizations accessible, using fixed dev UUID');
      const DEV_TENANT_UUID = 'a0000000-0000-4000-a000-000000000001';
      const mockOrg: Organization = {
        id: DEV_TENANT_UUID,
        name: 'System of a Town',
        slug: 'system-of-a-town',
        public_id: 'SOT-T-INTERNAL01',
        org_type: 'internal',
        parent_id: null,
        materialized_path: '/',
        depth: 0,
        parent_access_blocked: false,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveOrganization(mockOrg);
      
      const mockMembership: Membership = {
        id: 'dev-membership-mock',
        user_id: 'dev-user',
        tenant_id: DEV_TENANT_UUID,
        role: 'platform_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMemberships([mockMembership]);
      
      const mockProfile = {
        id: 'dev-user',
        display_name: 'Max Mustermann',
        email: 'max@mustermann.de',
        avatar_url: null,
        active_tenant_id: DEV_TENANT_UUID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile;
      setProfile(mockProfile);
      
    } catch (error) {
      console.error('[Dev-Mode] Error fetching development data:', error);
      // Emergency fallback with VALID UUID
      const DEV_TENANT_UUID = 'a0000000-0000-4000-a000-000000000001';
      const mockOrg: Organization = {
        id: DEV_TENANT_UUID,
        name: 'System of a Town (Fallback)',
        slug: 'system-of-a-town',
        public_id: 'SOT-T-INTERNAL01',
        org_type: 'internal',
        parent_id: null,
        materialized_path: '/',
        depth: 0,
        parent_access_blocked: false,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveOrganization(mockOrg);
    }
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(profileData);

      // Fetch memberships
      const { data: membershipData } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId);
      
      setMemberships(membershipData || []);

      // Fetch active organization
      if (profileData?.active_tenant_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.active_tenant_id)
          .maybeSingle();
        
        setActiveOrganization(orgData);
      } else if (membershipData && membershipData.length > 0) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membershipData[0].tenant_id)
          .maybeSingle();
        
        setActiveOrganization(orgData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id);
    } else if (isDevelopmentMode) {
      await fetchDevelopmentData();
    }
  }, [user, fetchUserData, isDevelopmentMode, fetchDevelopmentData]);

  // P0-PERF: Unified auth initialization - prevents race condition between onAuthStateChange and getSession
  useEffect(() => {
    let isMounted = true;
    
    // Helper to handle auth state (only runs once via hasInitialized flag)
    const handleAuthState = async (session: Session | null, source: string) => {
      if (!isMounted) return;
      
      console.log(`[Auth] ${source} triggered, hasInitialized:`, hasInitialized);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else if (isDevelopmentMode) {
        await fetchDevelopmentData();
      } else {
        setProfile(null);
        setMemberships([]);
        setActiveOrganization(null);
      }
      
      if (isMounted) {
        setHasInitialized(true);
        setIsLoading(false);
      }
    };

    // Subscribe to auth changes (fires on login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Always handle auth state changes (login, logout, token refresh)
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          handleAuthState(session, `onAuthStateChange:${event}`);
        } else if (!hasInitialized) {
          // Initial event - only process if not yet initialized
          handleAuthState(session, 'onAuthStateChange:INITIAL');
        }
      }
    );

    // Fallback: getSession only if onAuthStateChange hasn't fired after 300ms
    const fallbackTimeout = setTimeout(async () => {
      if (!hasInitialized && isMounted) {
        console.log('[Auth] Fallback: getSession()');
        const { data: { session } } = await supabase.auth.getSession();
        if (!hasInitialized && isMounted) {
          await handleAuthState(session, 'getSession:fallback');
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [fetchUserData, fetchDevelopmentData, isDevelopmentMode, hasInitialized]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const switchTenant = async (tenantId: string) => {
    if (!user && !isDevelopmentMode) return;
    
    if (isDevelopmentMode && !user) {
      // In development mode, just switch the active organization
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();
      
      if (orgData) {
        setActiveOrganization(orgData);
      }
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ active_tenant_id: tenantId })
      .eq('id', user!.id);
    
    if (!error) {
      await refreshAuth();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      memberships,
      activeMembership,
      activeOrganization,
      activeTenantId,
      isPlatformAdmin,
      isLoading,
      isDevelopmentMode,
      signIn,
      signUp,
      signOut,
      switchTenant,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
