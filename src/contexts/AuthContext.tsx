import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Fixed Dev-Tenant UUID - MUST match the seeded internal organization
const DEV_TENANT_UUID = 'a0000000-0000-4000-a000-000000000001';

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

// DEV-BYPASS DEAKTIVIERT — Login wird immer erzwungen
// Damit ist garantiert: Alle Geräte müssen sich einloggen = identischer Auth-State
const isDevelopmentEnvironment = () => {
  return false;
};

// P0-FIX: Define mock objects as STABLE CONSTANTS outside component
// This prevents new object references on every render
const DEV_MOCK_ORG: Organization = {
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
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const DEV_MOCK_MEMBERSHIP: Membership = {
  id: 'dev-membership-internal',
  user_id: 'dev-user',
  tenant_id: DEV_TENANT_UUID,
  role: 'platform_admin',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const DEV_MOCK_PROFILE: Profile = {
  id: 'dev-user',
  display_name: 'System of a Town',
  email: 'admin@systemofatown.de',
  avatar_url: null,
  active_tenant_id: DEV_TENANT_UUID,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  // Additional required fields with null defaults
  first_name: null,
  last_name: null,
  street: null,
  house_number: null,
  postal_code: null,
  city: null,
  country: null,
  tax_id: null,
  tax_number: null,
  is_business: null,
  person_mode: null,
  spouse_profile_id: null,
  phone_landline: null,
  phone_mobile: null,
  phone_whatsapp: null,
  // Email signature and letterhead fields
  email_signature: null,
  letterhead_logo_url: null,
  letterhead_company_line: null,
  letterhead_extra_line: null,
  letterhead_bank_name: null,
  letterhead_iban: null,
  letterhead_bic: null,
  letterhead_website: null,
  deleted_at: null,
};

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
      if (prev?.id === org?.id) return prev; // No change needed
      return org;
    });
  }, []);

  // ============================================================================
  // P0-ID-CTX-INTERNAL-DEFAULT: INTERNAL ORG IS DEFAULT CONTEXT FOR PLATFORM ADMIN
  // Marker ID: P0-ID-CTX-INTERNAL-DEFAULT
  // Dev-Mode prioritizes org_type='internal' over 'client' orgs.
  // ============================================================================
  const fetchDevelopmentData = useCallback(async () => {
    // P0-FIX: Prevent double initialization
    if (devInitializedRef.current) return;
    devInitializedRef.current = true;
    
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
        setActiveOrgStable(internalOrg);
        
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
      
      // Priority 3: No orgs in DB - use FIXED constants
      console.log('[Dev-Mode] No organizations accessible, using fixed dev constants');
      setActiveOrgStable(DEV_MOCK_ORG);
      setMemberships([DEV_MOCK_MEMBERSHIP]);
      setProfile(DEV_MOCK_PROFILE);
      
    } catch (error) {
      console.error('[Dev-Mode] Error fetching development data:', error);
      // Emergency fallback with STABLE constants
      setActiveOrgStable(DEV_MOCK_ORG);
      setMemberships([DEV_MOCK_MEMBERSHIP]);
      setProfile(DEV_MOCK_PROFILE);
    }
  }, [setActiveOrgStable]);

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
      devInitializedRef.current = false; // Allow re-fetch
      await fetchDevelopmentData();
    }
  }, [user, fetchUserData, isDevelopmentMode, fetchDevelopmentData]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else if (isDevelopmentMode) {
          // P0-FIX: Immediately set STABLE mock org to prevent race condition
          setActiveOrgStable(DEV_MOCK_ORG);
          setMemberships([DEV_MOCK_MEMBERSHIP]);
          setProfile(DEV_MOCK_PROFILE);
          
          // In development mode, load data without auth
          setTimeout(() => {
            fetchDevelopmentData();
          }, 0);
        } else {
          setProfile(null);
          setMemberships([]);
          setActiveOrganization(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else if (isDevelopmentMode) {
        // P0-FIX: Immediately set STABLE mock org to prevent race condition
        setActiveOrgStable(DEV_MOCK_ORG);
        setMemberships([DEV_MOCK_MEMBERSHIP]);
        setProfile(DEV_MOCK_PROFILE);
        
        // In development mode, load data without auth
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
      // In development mode, just switch the active organization
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
