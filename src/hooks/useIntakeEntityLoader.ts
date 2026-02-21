/**
 * useIntakeEntityLoader — Loads entities per category for the Magic Intake Center.
 * 
 * Maps parseMode → DB table → display labels for the entity picker dropdown.
 * Uses parserManifest as SSOT for table mapping.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ParserMode } from '@/types/parser-engine';

export interface IntakeEntity {
  id: string;
  label: string;
}

interface EntityLoaderConfig {
  table: string;
  selectFields: string;
  buildLabel: (row: Record<string, unknown>) => string;
}

const ENTITY_LOADER_CONFIG: Partial<Record<ParserMode, EntityLoaderConfig>> = {
  immobilie: {
    table: 'units',
    selectFields: 'id, unit_number, floor, area_sqm, rooms',
    buildLabel: (r) => {
      const parts = [r.unit_number, r.area_sqm ? `${r.area_sqm} m²` : null, r.rooms ? `${r.rooms} Zi.` : null].filter(Boolean);
      return parts.join(' — ') || 'Immobilie';
    },
  },
  fahrzeugschein: {
    table: 'cars_vehicles',
    selectFields: 'id, brand, model, license_plate',
    buildLabel: (r) => {
      const parts = [r.brand, r.model, r.license_plate ? `(${r.license_plate})` : null].filter(Boolean);
      return parts.join(' ') || 'Fahrzeug';
    },
  },
  pv_anlage: {
    table: 'pv_plants',
    selectFields: 'id, name, capacity_kwp',
    buildLabel: (r) => {
      const parts = [r.name, r.capacity_kwp ? `(${r.capacity_kwp} kWp)` : null].filter(Boolean);
      return parts.join(' ') || 'PV-Anlage';
    },
  },
  versicherung: {
    table: 'insurance_contracts',
    selectFields: 'id, provider_name, category',
    buildLabel: (r) => {
      const parts = [r.provider_name, r.category].filter(Boolean);
      return parts.join(' — ') || 'Versicherung';
    },
  },
  vorsorge: {
    table: 'vorsorge_contracts',
    selectFields: 'id, provider_name, contract_type',
    buildLabel: (r) => {
      const parts = [r.provider_name, r.contract_type].filter(Boolean);
      return parts.join(' — ') || 'Vorsorge';
    },
  },
  haustier: {
    table: 'pets',
    selectFields: 'id, name, species',
    buildLabel: (r) => {
      const parts = [r.name, r.species ? `(${r.species})` : null].filter(Boolean);
      return parts.join(' ') || 'Haustier';
    },
  },
  person: {
    table: 'household_persons',
    selectFields: 'id, first_name, last_name',
    buildLabel: (r) => {
      const parts = [r.first_name, r.last_name].filter(Boolean);
      return parts.join(' ') || 'Person';
    },
  },
  finanzierung: {
    table: 'finance_requests',
    selectFields: 'id, bank_name, loan_amount',
    buildLabel: (r) => {
      const parts = [
        r.bank_name,
        r.loan_amount ? `${Number(r.loan_amount).toLocaleString('de-DE')} €` : null,
      ].filter(Boolean);
      return parts.join(' — ') || 'Finanzierung';
    },
  },
};

export function useIntakeEntityLoader(parseMode: ParserMode | null) {
  const { activeTenantId } = useAuth();
  const [entities, setEntities] = useState<IntakeEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!parseMode || !activeTenantId) {
      setEntities([]);
      return;
    }

    const config = ENTITY_LOADER_CONFIG[parseMode];
    if (!config) {
      setEntities([]);
      return;
    }

    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(config.table)
        .select(config.selectFields)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error(`[IntakeEntityLoader] Error loading ${config.table}:`, error);
        setEntities([]);
        return;
      }

      const mapped: IntakeEntity[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        label: config.buildLabel(row),
      }));

      setEntities(mapped);
    } catch (err) {
      console.error('[IntakeEntityLoader] Unexpected error:', err);
      setEntities([]);
    } finally {
      setIsLoading(false);
    }
  }, [parseMode, activeTenantId]);

  useEffect(() => {
    load();
  }, [load]);

  return { entities, isLoading, reload: load };
}
