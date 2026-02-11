/**
 * React Hook: useGoldenPath
 * 
 * Liefert den evaluierten Golden Path fuer ein Modul.
 * Baut den Context aus DB-Queries auf und evaluiert alle Steps.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GoldenPathContext, StepEvaluation } from '@/manifests/goldenPaths';
import {
  getGoldenPath,
  evaluateGoldenPath,
  canEnterRoute,
  canRunAction,
  nextStep,
} from './engine';

interface UseGoldenPathOptions {
  propertyId?: string;
  tenantId?: string;
  enabled?: boolean;
}

interface UseGoldenPathResult {
  /** Alle Step-Evaluationen */
  evaluations: StepEvaluation[];
  /** Naechster offener Step */
  next: ReturnType<typeof nextStep>;
  /** Route-Guard Check */
  checkRoute: (routePattern: string) => ReturnType<typeof canEnterRoute>;
  /** Action-Guard Check */
  checkAction: (actionId: string) => ReturnType<typeof canRunAction>;
  /** Lade-Status */
  isLoading: boolean;
  /** Context-Flags (fuer Debugging) */
  flags: Record<string, boolean>;
}

/**
 * Baut Context-Flags aus DB-Queries fuer eine Property.
 */
function usePropertyContext(propertyId?: string, tenantId?: string, enabled = true) {
  return useQuery({
    queryKey: ['golden-path-context', propertyId, tenantId],
    queryFn: async (): Promise<Record<string, boolean>> => {
      if (!propertyId || !tenantId) {
        return {
          user_authenticated: true,
          tenant_exists: !!tenantId,
        };
      }

      const flags: Record<string, boolean> = {
        user_authenticated: true,
        tenant_exists: true,
      };

      // Parallel DB checks — use .then() to normalize types
      const propertyRes = await supabase
        .from('properties')
        .select('id')
        .eq('id', propertyId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const unitRes = await supabase
        .from('units')
        .select('id')
        .eq('property_id', propertyId)
        .limit(1)
        .maybeSingle();

      // storage_nodes has recursive types — use `as never` to bypass
      const { count: storageCount } = await supabase
        .from('storage_nodes' as never)
        .select('*', { count: 'exact', head: true })
        .eq('entity_id' as never, propertyId)
        .eq('entity_type' as never, 'property') as unknown as { count: number | null };

      const featuresRes = await supabase
        .from('property_features')
        .select('feature_code, status')
        .eq('property_id', propertyId);

      const listingRes = await supabase
        .from('listings')
        .select('id, status, sales_mandate_consent_id')
        .eq('property_id', propertyId)
        .maybeSingle();

      flags.property_exists = !!propertyRes.data;
      flags.main_unit_exists = !!unitRes.data;
      flags.folder_structure_exists = (storageCount ?? 0) > 0;
      flags.unit_visible_in_mod05 = !!unitRes.data;

      // Property Features
      const features = (featuresRes.data ?? []) as Array<{ feature_code: string; status: string }>;
      const verkaufsauftrag = features.find((f) => f.feature_code === 'verkaufsauftrag');
      const kaufy = features.find((f) => f.feature_code === 'kaufy_sichtbarkeit');
      
      flags.verkaufsauftrag_active = verkaufsauftrag?.status === 'active';
      flags.kaufy_sichtbarkeit_active = kaufy?.status === 'active';
      flags.features_inactive =
        (!verkaufsauftrag || verkaufsauftrag.status === 'inactive') &&
        (!kaufy || kaufy.status === 'inactive');

      // Listing
      const listing = listingRes.data;
      flags.listing_active = listing?.status === 'active';
      flags.listing_withdrawn = listing?.status === 'withdrawn';
      flags.sales_mandate_consent_linked = !!listing?.sales_mandate_consent_id;
      flags.contract_visible = !!listing?.sales_mandate_consent_id;
      flags.sales_desk_entry_visible = !!listing?.sales_mandate_consent_id && listing?.status === 'active';

      // Listing Publications (separate query)
      if (listing?.id) {
        const pubRes = await supabase
          .from('listing_publications')
          .select('channel, status')
          .eq('listing_id', listing.id);

        const pubs = pubRes.data ?? [];
        const partnerPub = pubs.find((p) => p.channel === 'partner_network');
        const kaufyPub = pubs.find((p) => p.channel === 'kaufy');

        flags.partner_network_active = partnerPub?.status === 'active';
        flags.kaufy_publication_active = kaufyPub?.status === 'active';
        flags.katalog_visible = partnerPub?.status === 'active';
        flags.suche_visible = listing?.status === 'active';
        flags.kaufy_website_visible = kaufyPub?.status === 'active';
        flags.publications_paused = pubs.every((p) => p.status === 'paused');
      } else {
        flags.partner_network_active = false;
        flags.kaufy_publication_active = false;
        flags.katalog_visible = false;
        flags.suche_visible = false;
        flags.kaufy_website_visible = false;
        flags.publications_paused = false;
      }

      return flags;
    },
    enabled: enabled,
    staleTime: 30_000, // 30s Cache
  });
}

export function useGoldenPath(
  moduleCode: string,
  options: UseGoldenPathOptions = {}
): UseGoldenPathResult {
  const { propertyId, tenantId, enabled = true } = options;
  const gp = getGoldenPath(moduleCode);
  const { data: flags = {}, isLoading } = usePropertyContext(propertyId, tenantId, enabled);

  const ctx: GoldenPathContext = useMemo(
    () => ({
      propertyId,
      tenantId,
      flags,
    }),
    [propertyId, tenantId, flags]
  );

  const evaluations = useMemo(() => {
    if (!gp) return [];
    return evaluateGoldenPath(gp, ctx);
  }, [gp, ctx]);

  const nextStepResult = useMemo(() => {
    if (!gp) return undefined;
    return nextStep(gp, ctx);
  }, [gp, ctx]);

  const checkRoute = useMemo(() => {
    return (routePattern: string) => {
      if (!gp) return { allowed: true as const };
      return canEnterRoute(gp, routePattern, ctx);
    };
  }, [gp, ctx]);

  const checkAction = useMemo(() => {
    return (actionId: string) => {
      if (!gp) return { allowed: true as const };
      return canRunAction(gp, actionId, ctx);
    };
  }, [gp, ctx]);

  return {
    evaluations,
    next: nextStepResult,
    checkRoute,
    checkAction,
    isLoading,
    flags,
  };
}
