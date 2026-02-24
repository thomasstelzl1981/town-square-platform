/**
 * useDemoAutoLogin — Silent auto-login for demo mode
 * 
 * Triggered by ?mode=demo URL parameter.
 * Lifecycle: Login → Cleanup → Seed → Portal ready
 * On leave: Cleanup → Logout
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_TENANT_ID,
  isDemoSession,
  setDemoSessionFlag,
} from '@/config/demoAccountConfig';
import { seedDemoData } from '@/hooks/useDemoSeedEngine';
import { cleanupDemoData } from '@/hooks/useDemoCleanup';

export type DemoState = 'idle' | 'logging-in' | 'seeding' | 'ready' | 'cleaning' | 'error';

export function useDemoAutoLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [demoState, setDemoState] = useState<DemoState>('idle');
  const initRef = useRef(false);
  const cleanupRunningRef = useRef(false);

  const isDemo = searchParams.get('mode') === 'demo' || isDemoSession();

  // Cleanup + logout
  const cleanupAndLogout = useCallback(async () => {
    if (cleanupRunningRef.current) return;
    cleanupRunningRef.current = true;
    
    try {
      if (import.meta.env.DEV) console.log('[DemoAutoLogin] Cleaning up demo data...');
      await cleanupDemoData(DEMO_TENANT_ID);
      setDemoSessionFlag(false);
      await supabase.auth.signOut();
      if (import.meta.env.DEV) console.log('[DemoAutoLogin] ✓ Cleanup + logout complete');
    } catch (err) {
      console.error('[DemoAutoLogin] Cleanup error:', err);
    } finally {
      cleanupRunningRef.current = false;
    }
  }, []);

  // Explicit end demo (called from banner button)
  const endDemo = useCallback(async () => {
    setDemoState('cleaning');
    await cleanupAndLogout();
    navigate('/sot');
  }, [cleanupAndLogout, navigate]);

  // Auto-login + seed flow
  useEffect(() => {
    if (!isDemo || initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        // Step 1: Login
        setDemoState('logging-in');
        if (import.meta.env.DEV) console.log('[DemoAutoLogin] Signing in as demo user...');
        
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        if (loginError) {
          console.error('[DemoAutoLogin] Login failed:', loginError.message);
          setDemoState('error');
          return;
        }

        setDemoSessionFlag(true);

        // Step 2: Clean slate
        setDemoState('seeding');
        if (import.meta.env.DEV) console.log('[DemoAutoLogin] Running clean-slate: cleanup → seed...');
        await cleanupDemoData(DEMO_TENANT_ID);
        await seedDemoData(DEMO_TENANT_ID);

        setDemoState('ready');
        if (import.meta.env.DEV) console.log('[DemoAutoLogin] ✓ Demo ready');
      } catch (err) {
        console.error('[DemoAutoLogin] Init error:', err);
        setDemoState('error');
      }
    };

    init();
  }, [isDemo]);

  // Register cleanup handlers on leave
  useEffect(() => {
    if (!isDemo) return;

    const handleBeforeUnload = () => {
      // Best-effort: send cleanup via sendBeacon or sync signOut
      // Note: async operations may not complete, but the clean-slate on next entry covers this
      setDemoSessionFlag(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDemo]);

  return {
    isDemo,
    demoState,
    endDemo,
  };
}
