import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  DEV_TENANT_UUID,
  DEV_MOCK_ORG,
  DEV_MOCK_PROFILE,
  DEV_MOCK_MEMBERSHIP,
  isDevelopmentEnvironment,
} from '@/config/tenantConstants';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevelopmentMode] = useState(isDevelopmentEnvironment());
  
  // P0-FIX: Track if dev mode has been initialized to prevent double-init
  const devInitializedRef = useRef(false);

  const isPlatformAdmin = memberships.some(m => m.role === 'platform_admin');
  const activeMembership = memberships.find(m => m.tenant_id === profile?.active_tenant_id) || memberships[0] || null;
  
  // P0-1 FIX: In dev mode, ALWAYS force DEV_TENANT_UUID to prevent tenant mismatch
  const activeTenantId = isDevelopmentMode 
    ? DEV_TENANT_UUID 
    : (profile?.active_tenant_id || activeOrganization?.id || activeMembership?.tenant_id || null);

  // P0-FIX: Stable setter that only updates if ID actually changed
  const setActiveOrgStable = useCallback((org: Organization | null) => {
    setActiveOrganization(prev => {
      if (prev?.id === org?.id) return prev;
      return org;
    });
  }, []);

  // ============================================================================
  // P0-ID-CTX-INTERNAL-DEFAULT: INTERNAL ORG IS DEFAULT CONTEXT FOR PLATFORM ADMIN
  // ============================================================================
  const fetchDevelopmentData = useCallback(async () => {
    if (devInitializedRef.current) return;
    devInitializedRef.current = true;
    
    try {
      const { data: internalOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('org_type', 'internal')
        .limit(1)
        .maybeSingle();
      
      if (internalOrg) {
        console.log('[Dev-Mode] Using internal org:', internalOrg.name);
        setActiveOrgStable(internalOrg);
        
        const mockMembership: Membership = {
          id: 'dev-membership-internal',
          user_id: 'dev-user',
          tenant_id: internalOrg.id,
          role: 'platform_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMemberships([mockMembership]);
        
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
      
      console.warn('[Dev-Mode] No internal org found, falling back to first available org');
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (orgData) {
        console.log('[Dev-Mode] Using fallback org:', orgData.name);
        setActiveOrgStable(orgData);
        
        const mockMembership: Membership = {
          id: 'dev-membership',
          user_id: 'dev-user',
          tenant_id: orgData.id,
          role: 'platform_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMemberships([mockMembership]);
        
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
      
      console.log('[Dev-Mode] No organizations accessible, using fixed dev constants');
      setActiveOrgStable(DEV_MOCK_ORG);
      setMemberships([DEV_MOCK_MEMBERSHIP]);
      setProfile(DEV_MOCK_PROFILE);
      
    } catch (error) {
      console.error('[Dev-Mode] Error fetching development data:', error);
      setActiveOrgStable(DEV_MOCK_ORG);
      setMemberships([DEV_MOCK_MEMBERSHIP]);
      setProfile(DEV_MOCK_PROFILE);
    }
  }, [setActiveOrgStable]);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(profileData);

      const { data: membershipData } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId);
      
      setMemberships(membershipData || []);

      if (profileData?.active_tenant_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.active_tenant_id)
          .maybeSingle();
        
        setActiveOrgStable(orgData);
      } else if (membershipData && membershipData.length > 0) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membershipData[0].tenant_id)
          .maybeSingle();
        
        setActiveOrgStable(orgData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [setActiveOrgStable]);

  const refreshAuth = useCallback(async () => {
    if (user) {
      await fetchUserData(user.id);
    } else if (isDevelopmentMode) {
      devInitializedRef.current = false;
      await fetchDevelopmentData();
    }
  }, [user, fetchUserData, isDevelopmentMode, fetchDevelopmentData]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // P0-SESSION-FIX: Only clear user state on explicit SIGNED_OUT event.
        // During token refresh cycles, session can briefly be null — we must NOT
        // reset state in that case, or it triggers unwanted redirects to /auth.
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setMemberships([]);
          setActiveOrganization(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else if (isDevelopmentMode) {
          setActiveOrgStable(DEV_MOCK_ORG);
          setMemberships([DEV_MOCK_MEMBERSHIP]);
          setProfile(DEV_MOCK_PROFILE);
          setTimeout(() => {
            fetchDevelopmentData();
          }, 0);
        }
        // else: transient null state during refresh — do NOT touch user/session
        setIsLoading(false);
      }
    );

    // P0-FIX: On app start, try to refresh the session first to renew expired access tokens.
    // This prevents users from being logged out after browser restart when the access token
    // has expired but the refresh token (7+ days) is still valid.
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession) {
        // Try refreshing to get a fresh access token
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        const activeSession = refreshedSession || existingSession;
        setSession(activeSession);
        setUser(activeSession?.user ?? null);
        if (activeSession?.user) {
          fetchUserData(activeSession.user.id);
        }
      } else if (isDevelopmentMode) {
        setActiveOrgStable(DEV_MOCK_ORG);
        setMemberships([DEV_MOCK_MEMBERSHIP]);
        setProfile(DEV_MOCK_PROFILE);
        fetchDevelopmentData();
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData, fetchDevelopmentData, isDevelopmentMode, setActiveOrgStable]);

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
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();
      
      if (orgData) {
        setActiveOrgStable(orgData);
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
