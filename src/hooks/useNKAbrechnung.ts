/**
 * useNKAbrechnung — React Hook fuer NK-Abrechnungs-Workflow
 * 
 * Orchestriert: Readiness-Check → Daten laden → Berechnung → PDF-Export
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { checkReadiness } from '@/engines/nkAbrechnung/readinessCheck';
import { calculateSettlement } from '@/engines/nkAbrechnung/engine';
import { generateNKPdf } from '@/engines/nkAbrechnung/pdfExport';
import { supabase } from '@/integrations/supabase/client';
import type { NKReadinessResult, NKSettlementMatrix, NKCostCategory, AllocationKeyType } from '@/engines/nkAbrechnung/spec';

export interface LeaseInfo {
  id: string;
  rentColdEur: number;
  nkAdvanceEur: number;
  heatingAdvanceEur: number;
  startDate: string;
  endDate: string | null;
  tenantName: string;
  tenantContactId: string | null;
}

export interface CostItemEditable {
  id: string;
  categoryCode: string;
  labelDisplay: string;
  amountTotalHouse: number;
  amountUnit: number;
  keyType: string;
  isApportionable: boolean;
  sortOrder: number;
}

export function useNKAbrechnung(
  propertyId: string,
  tenantId: string,
  unitId: string,
  year: number
) {
  const { toast } = useToast();
  const [readiness, setReadiness] = useState<NKReadinessResult | null>(null);
  const [settlement, setSettlement] = useState<NKSettlementMatrix | null>(null);
  const [leaseInfo, setLeaseInfo] = useState<LeaseInfo | null>(null);
  const [costItems, setCostItems] = useState<CostItemEditable[]>([]);
  const [grundsteuerTotal, setGrundsteuerTotal] = useState<number>(0);
  const [grundsteuerAnteil, setGrundsteuerAnteil] = useState<number>(0);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Readiness Check + Daten laden bei Jahr-Aenderung
  useEffect(() => {
    if (!propertyId || !tenantId) return;

    setIsLoadingReadiness(true);
    setSettlement(null);

    checkReadiness(propertyId, tenantId, year)
      .then(setReadiness)
      .catch((err) => {
        console.error('Readiness check failed:', err);
        toast({
          title: 'Fehler bei Dokumentenprüfung',
          description: err.message,
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoadingReadiness(false));

    // Lease + Cost Items laden
    loadData();
  }, [propertyId, tenantId, unitId, year]);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Lease laden
      const { data: lease } = await supabase
        .from('leases')
        .select('id, rent_cold_eur, nk_advance_eur, heating_advance_eur, start_date, end_date, tenant_contact_id')
        .eq('unit_id', unitId)
        .eq('tenant_id', tenantId)
        .limit(1)
        .single();

      if (lease) {
        let tenantName = 'Mieter';
        if (lease.tenant_contact_id) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('first_name, last_name')
            .eq('id', lease.tenant_contact_id)
            .single();
          if (contact) {
            tenantName = `${contact.last_name || ''}, ${contact.first_name || ''}`.trim();
          }
        }

        setLeaseInfo({
          id: lease.id,
          rentColdEur: Number(lease.rent_cold_eur) || 0,
          nkAdvanceEur: Number(lease.nk_advance_eur) || 0,
          heatingAdvanceEur: Number(lease.heating_advance_eur) || 0,
          startDate: lease.start_date,
          endDate: lease.end_date,
          tenantName,
          tenantContactId: lease.tenant_contact_id,
        });
      }

      // NK Period + Cost Items laden
      const periodStart = `${year}-01-01`;
      const periodEnd = `${year}-12-31`;

      const { data: period } = await (supabase as any)
        .from('nk_periods')
        .select('id')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .gte('period_end', periodStart)
        .lte('period_start', periodEnd)
        .maybeSingle();

      if (period?.id) {
        const { data: items } = await (supabase as any)
          .from('nk_cost_items')
          .select('id, category_code, label_display, amount_total_house, amount_unit, key_type, is_apportionable, sort_order')
          .eq('nk_period_id', period.id)
          .eq('tenant_id', tenantId)
          .order('sort_order', { ascending: true });

        const mapped: CostItemEditable[] = (items || []).map((item: any) => ({
          id: item.id,
          categoryCode: item.category_code,
          labelDisplay: item.label_display,
          amountTotalHouse: Number(item.amount_total_house),
          amountUnit: Number(item.amount_unit) || 0,
          keyType: item.key_type,
          isApportionable: item.is_apportionable,
          sortOrder: item.sort_order,
        }));

        setCostItems(mapped);

        // Grundsteuer separat extrahieren
        const gs = mapped.find(i => i.categoryCode === 'grundsteuer');
        if (gs) {
          setGrundsteuerTotal(gs.amountTotalHouse);
          setGrundsteuerAnteil(gs.amountUnit);
        }
      }
    } catch (err: any) {
      console.error('Data loading failed:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [propertyId, tenantId, unitId, year]);

  // Cost Item Wert aendern (lokal)
  const updateCostItem = useCallback((id: string, field: 'amountTotalHouse' | 'amountUnit', value: number) => {
    setCostItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  // Cost Items in DB speichern
  const saveCostItems = useCallback(async () => {
    setIsSaving(true);
    try {
      for (const item of costItems) {
        await (supabase as any)
          .from('nk_cost_items')
          .update({
            amount_total_house: item.amountTotalHouse,
            amount_unit: item.amountUnit,
          })
          .eq('id', item.id);
      }
      toast({ title: 'Gespeichert', description: 'Kostenpositionen wurden aktualisiert.' });
    } catch (err: any) {
      toast({ title: 'Fehler beim Speichern', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [costItems]);

  // Grundsteuer speichern
  const saveGrundsteuer = useCallback(async () => {
    setIsSaving(true);
    try {
      const gs = costItems.find(i => i.categoryCode === 'grundsteuer');
      if (gs) {
        await (supabase as any)
          .from('nk_cost_items')
          .update({
            amount_total_house: grundsteuerTotal,
            amount_unit: grundsteuerAnteil,
          })
          .eq('id', gs.id);
        
        // Lokalen State auch updaten
        setCostItems(prev => prev.map(item =>
          item.categoryCode === 'grundsteuer'
            ? { ...item, amountTotalHouse: grundsteuerTotal, amountUnit: grundsteuerAnteil }
            : item
        ));
        toast({ title: 'Gespeichert', description: 'Grundsteuer wurde aktualisiert.' });
      }
    } catch (err: any) {
      toast({ title: 'Fehler beim Speichern', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [costItems, grundsteuerTotal, grundsteuerAnteil]);

  // Berechnung starten
  const calculate = useCallback(async () => {
    if (!readiness?.canCalculate) return;

    setIsCalculating(true);
    try {
      const result = await calculateSettlement({
        propertyId,
        unitId,
        tenantId,
        year,
      });

      setSettlement(result);
      toast({
        title: 'Berechnung abgeschlossen',
        description: `Saldo: ${result.summary.balance >= 0 ? 'Nachzahlung' : 'Guthaben'} ${Math.abs(result.summary.balance).toFixed(2)} €`,
      });
    } catch (err: any) {
      console.error('Calculation failed:', err);
      toast({
        title: 'Fehler bei Berechnung',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  }, [readiness, propertyId, unitId, tenantId, year]);

  // PDF Export
  const exportPdf = useCallback(() => {
    if (!settlement) return;

    try {
      const doc = generateNKPdf(settlement);
      doc.save(`NK-Abrechnung_${year}_${settlement.header.tenantName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast({
        title: 'PDF erstellt',
        description: 'Die Nebenkostenabrechnung wurde als PDF heruntergeladen.',
      });
    } catch (err: any) {
      console.error('PDF export failed:', err);
      toast({
        title: 'Fehler beim PDF-Export',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [settlement, year]);

  return {
    readiness,
    settlement,
    leaseInfo,
    costItems,
    grundsteuerTotal,
    grundsteuerAnteil,
    isLoadingReadiness,
    isLoadingData,
    isCalculating,
    isSaving,
    calculate,
    exportPdf,
    updateCostItem,
    saveCostItems,
    saveGrundsteuer,
    setGrundsteuerTotal,
    setGrundsteuerAnteil,
  };
}
