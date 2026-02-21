/**
 * useDataReadiness — Combined guard: Legal Consent + Demo Data awareness.
 *
 * Provides `requireReadiness()` which returns true if the user may proceed
 * with a write action. If not, it shows the appropriate modal:
 *  - DataReadinessModal  → when demo data is ON *and* consent is missing
 *  - ConsentRequiredModal → when only consent is missing
 *
 * When demo data is still ON but consent is given, the action is allowed
 * (user has deliberately kept demo data active).
 */
import { useState, useCallback } from 'react';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { useDemoToggles } from '@/hooks/useDemoToggles';

export function useDataReadiness() {
  const consent = useLegalConsent();
  const { allEnabled: demoAllOn, noneEnabled: demoAllOff } = useDemoToggles();

  const [showReadinessModal, setShowReadinessModal] = useState(false);

  const demoActive = !demoAllOff; // at least one demo toggle is on

  const requireReadiness = useCallback((): boolean => {
    if (consent.isLoading) return false;

    // Happy path: consent given → allow (regardless of demo state)
    if (consent.isConsentGiven) return true;

    // Consent missing + demo active → show combined readiness modal
    if (demoActive) {
      setShowReadinessModal(true);
      return false;
    }

    // Consent missing + demo off → show standard consent modal
    return consent.requireConsent();
  }, [consent, demoActive]);

  return {
    requireReadiness,
    // Readiness modal (combined explanation)
    showReadinessModal,
    setShowReadinessModal,
    // Standard consent modal (passthrough)
    showConsentModal: consent.showConsentModal,
    setShowConsentModal: consent.setShowConsentModal,
    // State info
    isConsentGiven: consent.isConsentGiven,
    isDemoActive: demoActive,
    isLoading: consent.isLoading,
  };
}
