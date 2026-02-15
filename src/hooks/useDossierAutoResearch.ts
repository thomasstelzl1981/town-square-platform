/**
 * useDossierAutoResearch — Triggers automatic Armstrong research on entity creation
 * 
 * Supported entity types: vehicle, insurance, pv_plant
 * Creates a dossier_research_jobs entry and calls the edge function.
 * Opens Armstrong stripe with proactive notification.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { toast } from '@/hooks/use-toast';

export type DossierEntityType = 'vehicle' | 'insurance' | 'pv_plant';

interface TriggerResearchParams {
  entityType: DossierEntityType;
  entityId: string;
  /** Human-readable description for search, e.g. "BMW 320d 2019" or "Allianz Hausratversicherung" */
  searchQuery: string;
}

/**
 * Builds a detailed search query based on entity type and metadata
 */
function buildSearchQuery(entityType: DossierEntityType, searchQuery: string): string {
  switch (entityType) {
    case 'vehicle':
      return `Fahrzeug: ${searchQuery}. Bitte alle technischen Daten, Wartungsintervalle, bekannte Probleme, Rückrufe, Versicherungsklassen und Verbrauchswerte recherchieren.`;
    case 'insurance':
      return `Versicherung: ${searchQuery}. Bitte Versicherungsbedingungen, Deckungsumfang, Ausschlüsse, Kündigungsfristen und wichtige Klauseln recherchieren.`;
    case 'pv_plant':
      return `Photovoltaikanlage: ${searchQuery}. Bitte technische Daten, Wartungshinweise, Garantiebedingungen, Degradation und Monitoring-Tipps recherchieren.`;
    default:
      return searchQuery;
  }
}

const ENTITY_LABELS: Record<DossierEntityType, string> = {
  vehicle: 'Fahrzeug',
  insurance: 'Versicherung',
  pv_plant: 'PV-Anlage',
};

export function useDossierAutoResearch() {
  const { activeTenantId, user } = useAuth();
  const { showArmstrong } = usePortalLayout();

  const triggerResearch = useCallback(async ({ entityType, entityId, searchQuery }: TriggerResearchParams) => {
    if (!activeTenantId || !user?.id) {
      console.warn('[DossierResearch] No tenant or user');
      return;
    }

    const fullQuery = buildSearchQuery(entityType, searchQuery);
    const label = ENTITY_LABELS[entityType];

    try {
      // 1. Create job entry in DB
      const { data: job, error: jobError } = await supabase
        .from('dossier_research_jobs')
        .insert({
          tenant_id: activeTenantId,
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          search_query: fullQuery,
          status: 'pending',
        })
        .select('id')
        .single();

      if (jobError || !job) {
        console.error('[DossierResearch] Job creation error:', jobError);
        return;
      }

      // 2. Open Armstrong stripe with proactive message
      showArmstrong({ expanded: true });
      
      toast({
        title: `${label}-Recherche gestartet`,
        description: `Armstrong recherchiert alles zu "${searchQuery}". Du kannst währenddessen Unterlagen per Drag & Drop im Stripe ablegen.`,
      });

      // 3. Call edge function (fire-and-forget, job status tracked via DB)
      supabase.functions.invoke('sot-dossier-auto-research', {
        body: {
          job_id: job.id,
          entity_type: entityType,
          entity_id: entityId,
          search_query: fullQuery,
          tenant_id: activeTenantId,
        },
      }).then(({ error }) => {
        if (error) {
          console.error('[DossierResearch] Edge function error:', error);
          toast({
            title: 'Recherche-Fehler',
            description: `Die Recherche für ${label} konnte nicht durchgeführt werden.`,
            variant: 'destructive',
          });
        }
      });

    } catch (err) {
      console.error('[DossierResearch] Unexpected error:', err);
    }
  }, [activeTenantId, user?.id, showArmstrong]);

  return { triggerResearch };
}
