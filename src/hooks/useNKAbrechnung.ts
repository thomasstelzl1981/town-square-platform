/**
 * useNKAbrechnung — React Hook fuer NK-Abrechnungs-Workflow
 * 
 * Orchestriert: Readiness-Check → Daten laden → Template-Merge → Berechnung → PDF-Export
 * 
 * NOTE: `(supabase as any)` casts are used for `nk_periods` and `nk_cost_items` tables
 * because they were added after the auto-generated Supabase types were created.
 * The types.ts file is read-only and cannot be manually updated.
 * These casts are safe as the tables exist in the DB with correct RLS policies.
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { checkReadiness } from '@/engines/nkAbrechnung/readinessCheck';
import { calculateSettlement } from '@/engines/nkAbrechnung/engine';
import { generateNKPdf } from '@/engines/nkAbrechnung/pdfExport';
import { mergeWithTemplate } from '@/engines/nkAbrechnung/hausgeldTemplate';
import { supabase } from '@/integrations/supabase/client';
import type { NKReadinessResult, NKSettlementMatrix } from '@/engines/nkAbrechnung/spec';

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

export interface RentPaymentRow {
  dueDate: string;
  paidDate: string | null;
  expectedAmount: number;
  amount: number;
  status: string;
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
  const [nkPeriodId, setNkPeriodId] = useState<string | null>(null);
  const [rentPayments, setRentPayments] = useState<RentPaymentRow[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Readiness Check + Daten laden bei Jahr-Aenderung
  useEffect(() => {
    if (!propertyId || !tenantId) return;

    setIsLoadingReadiness(true);
    setSettlement(null);

    checkReadiness(propertyId, tenantId, year)
      .then(setReadiness)
      .catch((err) => {
        console.error('Readiness check failed:', err);
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

      let dbItems: CostItemEditable[] = [];

      if (period?.id) {
        setNkPeriodId(period.id);
        const { data: items } = await (supabase as any)
          .from('nk_cost_items')
          .select('id, category_code, label_display, amount_total_house, amount_unit, key_type, is_apportionable, sort_order')
          .eq('nk_period_id', period.id)
          .eq('tenant_id', tenantId)
          .order('sort_order', { ascending: true });

        dbItems = (items || []).map((item: any) => ({
          id: item.id,
          categoryCode: item.category_code,
          labelDisplay: item.label_display,
          amountTotalHouse: Number(item.amount_total_house),
          amountUnit: Number(item.amount_unit) || 0,
          keyType: item.key_type,
          isApportionable: item.is_apportionable,
          sortOrder: item.sort_order,
        }));
      } else {
        setNkPeriodId(null);
      }

      // Merge mit Template — immer vollständiges Formular zeigen
      const merged = mergeWithTemplate(dbItems);
      setCostItems(merged);

      // Grundsteuer separat extrahieren
      const gs = dbItems.find(i => i.categoryCode === 'grundsteuer');
      if (gs) {
        setGrundsteuerTotal(gs.amountTotalHouse);
        setGrundsteuerAnteil(gs.amountUnit);
      } else {
        setGrundsteuerTotal(0);
        setGrundsteuerAnteil(0);
      }
    } catch (err: any) {
      console.error('Data loading failed:', err);
      // Bei Fehler trotzdem Template anzeigen
      const merged = mergeWithTemplate([]);
      setCostItems(merged);
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

  // Cost Items in DB speichern (mit Auto-Create für neue Perioden)
  const saveCostItems = useCallback(async () => {
    setIsSaving(true);
    try {
      let periodId = nkPeriodId;

      // Auto-Create: Wenn keine Periode existiert, neue anlegen
      if (!periodId) {
        const { data: newPeriod, error: periodError } = await (supabase as any)
          .from('nk_periods')
          .insert({
            property_id: propertyId,
            tenant_id: tenantId,
            period_start: `${year}-01-01`,
            period_end: `${year}-12-31`,
            status: 'draft',
          })
          .select('id')
          .single();

        if (periodError) throw periodError;
        periodId = newPeriod.id;
        setNkPeriodId(periodId);
      }

      // Bestehende DB-Items updaten, Template-Items neu anlegen
      for (const item of costItems) {
        if (item.id.startsWith('tmpl_')) {
          // Neues Item anlegen
          await (supabase as any)
            .from('nk_cost_items')
            .insert({
              nk_period_id: periodId,
              tenant_id: tenantId,
              category_code: item.categoryCode,
              label_display: item.labelDisplay,
              amount_total_house: item.amountTotalHouse,
              amount_unit: item.amountUnit,
              key_type: item.keyType,
              is_apportionable: item.isApportionable,
              sort_order: item.sortOrder,
            });
        } else {
          // Bestehendes Item updaten
          await (supabase as any)
            .from('nk_cost_items')
            .update({
              amount_total_house: item.amountTotalHouse,
              amount_unit: item.amountUnit,
            })
            .eq('id', item.id);
        }
      }

      toast({ title: 'Gespeichert', description: 'Kostenpositionen wurden aktualisiert.' });
      // Daten neu laden um DB-IDs zu erhalten
      await loadData();
    } catch (err: any) {
      toast({ title: 'Fehler beim Speichern', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [costItems, nkPeriodId, propertyId, tenantId, year, loadData]);

  // Grundsteuer speichern
  const saveGrundsteuer = useCallback(async () => {
    setIsSaving(true);
    try {
      let periodId = nkPeriodId;

      if (!periodId) {
        const { data: newPeriod, error: periodError } = await (supabase as any)
          .from('nk_periods')
          .insert({
            property_id: propertyId,
            tenant_id: tenantId,
            period_start: `${year}-01-01`,
            period_end: `${year}-12-31`,
            status: 'draft',
          })
          .select('id')
          .single();

        if (periodError) throw periodError;
        periodId = newPeriod.id;
        setNkPeriodId(periodId);
      }

      const gs = costItems.find(i => i.categoryCode === 'grundsteuer');
      if (gs && !gs.id.startsWith('tmpl_')) {
        await (supabase as any)
          .from('nk_cost_items')
          .update({
            amount_total_house: grundsteuerTotal,
            amount_unit: grundsteuerAnteil,
          })
          .eq('id', gs.id);
      } else {
        await (supabase as any)
          .from('nk_cost_items')
          .insert({
            nk_period_id: periodId,
            tenant_id: tenantId,
            category_code: 'grundsteuer',
            label_display: 'Grundsteuer',
            amount_total_house: grundsteuerTotal,
            amount_unit: grundsteuerAnteil,
            key_type: 'mea',
            is_apportionable: true,
            sort_order: 0,
          });
      }

      toast({ title: 'Gespeichert', description: 'Grundsteuer wurde aktualisiert.' });
    } catch (err: any) {
      toast({ title: 'Fehler beim Speichern', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [costItems, grundsteuerTotal, grundsteuerAnteil, nkPeriodId, propertyId, tenantId, year]);

  // Berechnung starten
  const calculate = useCallback(async () => {
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
  }, [propertyId, unitId, tenantId, year]);

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

  // Kontenauslesung: tatsächliche Zahlungseingänge laden
  const fetchRentPayments = useCallback(async () => {
    if (!leaseInfo?.id) return;
    setIsLoadingPayments(true);
    try {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const { data, error } = await supabase
        .from('rent_payments')
        .select('due_date, paid_date, expected_amount, amount, status')
        .eq('lease_id', leaseInfo.id)
        .gte('due_date', yearStart)
        .lte('due_date', yearEnd)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setRentPayments(
        (data || []).map((r: any) => ({
          dueDate: r.due_date,
          paidDate: r.paid_date,
          expectedAmount: Number(r.expected_amount) || 0,
          amount: Number(r.amount) || 0,
          status: r.status || 'open',
        }))
      );
    } catch (err: any) {
      console.error('fetchRentPayments failed:', err);
      toast({ title: 'Fehler', description: 'Zahlungsdaten konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setIsLoadingPayments(false);
    }
  }, [leaseInfo?.id, year]);

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
    rentPayments,
    isLoadingPayments,
    fetchRentPayments,
    calculate,
    exportPdf,
    updateCostItem,
    saveCostItems,
    saveGrundsteuer,
    setGrundsteuerTotal,
    setGrundsteuerAnteil,
  };
}
