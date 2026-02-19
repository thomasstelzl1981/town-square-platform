/**
 * useLegalConsent — Central hook for checking portal legal consent status.
 * 
 * Checks if user has accepted the latest active versions of portal_agb + portal_privacy.
 * Provides requireConsent() that shows a blocking toast + redirect if not consented.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useLegalConsent() {
  const { user, activeTenantId } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['legal-consent-status', user?.id, activeTenantId],
    queryFn: async () => {
      if (!user?.id || !activeTenantId) return { isConsentGiven: false };

      // 1. Get active versions for portal_agb + portal_privacy
      const { data: docs } = await supabase
        .from('compliance_documents')
        .select('id, doc_key, current_version')
        .in('doc_key', ['portal_agb', 'portal_privacy']);

      if (!docs?.length) {
        // No documents configured yet — don't block
        return { isConsentGiven: true };
      }

      // Get active version numbers
      const docMap: Record<string, { id: string; version: number }> = {};
      for (const doc of docs) {
        const { data: versions } = await supabase
          .from('compliance_document_versions')
          .select('version')
          .eq('document_id', doc.id)
          .eq('status', 'active')
          .order('version', { ascending: false })
          .limit(1);
        
        if (versions?.[0]) {
          docMap[doc.doc_key] = { id: doc.id, version: versions[0].version };
        }
      }

      // If no active versions exist, don't block
      if (!docMap.portal_agb && !docMap.portal_privacy) {
        return { isConsentGiven: true };
      }

      // 2. Check user_consents
      const { data: consents } = await supabase
        .from('user_consents')
        .select('compliance_doc_id, compliance_version')
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenantId)
        .not('compliance_doc_id', 'is', null)
        .eq('status', 'accepted');

      const hasAgb = !docMap.portal_agb || consents?.some(
        c => c.compliance_doc_id === docMap.portal_agb.id && c.compliance_version === docMap.portal_agb.version
      );
      const hasPrivacy = !docMap.portal_privacy || consents?.some(
        c => c.compliance_doc_id === docMap.portal_privacy.id && c.compliance_version === docMap.portal_privacy.version
      );

      return { isConsentGiven: hasAgb && hasPrivacy };
    },
    enabled: !!user?.id && !!activeTenantId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const isConsentGiven = data?.isConsentGiven ?? false;

  const requireConsent = (): boolean => {
    if (isLoading) return false; // block while loading
    if (isConsentGiven) return true;

    toast.error('Bitte bestätige zuerst die Nutzungsvereinbarungen', {
      description: 'Unter Stammdaten → Rechtliches kannst du die AGB und Datenschutzerklärung akzeptieren.',
      action: {
        label: 'Zu Rechtliches',
        onClick: () => navigate('/portal/stammdaten/rechtliches'),
      },
      duration: 8000,
    });
    return false;
  };

  return { isConsentGiven, isLoading, requireConsent };
}
