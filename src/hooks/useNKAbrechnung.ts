/**
 * useNKAbrechnung — React Hook fuer NK-Abrechnungs-Workflow
 * 
 * Orchestriert: Readiness-Check → Berechnung → PDF-Export
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { checkReadiness } from '@/engines/nkAbrechnung/readinessCheck';
import { calculateSettlement } from '@/engines/nkAbrechnung/engine';
import { generateNKPdf } from '@/engines/nkAbrechnung/pdfExport';
import type { NKReadinessResult, NKSettlementMatrix } from '@/engines/nkAbrechnung/spec';

export function useNKAbrechnung(
  propertyId: string,
  tenantId: string,
  unitId: string,
  year: number
) {
  const { toast } = useToast();
  const [readiness, setReadiness] = useState<NKReadinessResult | null>(null);
  const [settlement, setSettlement] = useState<NKSettlementMatrix | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Readiness Check bei Jahr-Aenderung
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
  }, [propertyId, tenantId, year]);

  // Berechnung starten
  const calculate = useCallback(async () => {
    if (!readiness?.canCalculate) return;

    setIsCalculating(true);
    try {
      // Fuer MVP: Wir verwenden den ersten Lease
      // TODO: Multi-Lease-Support
      const result = await calculateSettlement({
        propertyId,
        unitId,
        leaseId: '', // Engine laedt Lease ueber property_id
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
    isLoadingReadiness,
    isCalculating,
    calculate,
    exportPdf,
  };
}
