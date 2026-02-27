/**
 * useArmstrongProactiveDispatcher — Dispatch proactive hints from module pages
 * 
 * Provides helper functions for modules to fire proactive Armstrong hints
 * based on data quality, missing fields, or upload events.
 * 
 * Usage in module pages:
 *   const { dispatchHint } = useArmstrongProactiveDispatcher('MOD-04');
 *   dispatchHint('Ich sehe, dass noch 5 Felder fehlen. Soll ich helfen?');
 */
import { useCallback, useRef } from 'react';

export function useArmstrongProactiveDispatcher(module: string) {
  // Debounce to avoid duplicate hints within 10 seconds
  const lastDispatchRef = useRef<number>(0);

  const dispatchHint = useCallback((hint: string) => {
    const now = Date.now();
    if (now - lastDispatchRef.current < 10_000) return;
    lastDispatchRef.current = now;

    window.dispatchEvent(new CustomEvent('armstrong:proactive', {
      detail: { module, hint },
    }));
  }, [module]);

  /** Property data quality check — dispatches hint if many fields are empty */
  const checkPropertyCompleteness = useCallback((filledFields: number, totalFields: number) => {
    const ratio = filledFields / totalFields;
    if (ratio < 0.5) {
      const missing = totalFields - filledFields;
      dispatchHint(`Ich sehe, dass noch **${missing} von ${totalFields} Feldern** fehlen. Soll ich aus deinen Dokumenten automatisch befüllen?`);
    }
  }, [dispatchHint]);

  /** Document upload event — dispatches hint to offer analysis */
  const onDocumentUploaded = useCallback((fileName: string, mimeType?: string) => {
    const isPdf = mimeType?.includes('pdf') || fileName.endsWith('.pdf');
    const isExcel = mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv');
    
    if (isPdf) {
      dispatchHint(`📄 Dokument „${fileName}" erkannt — soll ich es analysieren und Kerndaten extrahieren?`);
    } else if (isExcel) {
      dispatchHint(`📊 Tabelle „${fileName}" erkannt — soll ich die Daten importieren?`);
    } else {
      dispatchHint(`Datei „${fileName}" hochgeladen — soll ich sie verarbeiten?`);
    }
  }, [dispatchHint]);

  /** Finance readiness check — dispatches hint if Selbstauskunft is incomplete */
  const checkFinanceReadiness = useCallback((completionScore: number) => {
    if (completionScore < 50) {
      dispatchHint(`Die Selbstauskunft ist erst zu **${completionScore}%** befüllt. Soll ich aus deinen Dokumenten automatisch ergänzen?`);
    }
  }, [dispatchHint]);

  /** Lease/contract upload — dispatches hint for extraction */
  const onContractUploaded = useCallback((contractType: string, fileName: string) => {
    dispatchHint(`📋 ${contractType} „${fileName}" erkannt — soll ich Kerndaten (Laufzeit, Miethöhe, Kündigungsfrist) extrahieren?`);
  }, [dispatchHint]);

  return {
    dispatchHint,
    checkPropertyCompleteness,
    onDocumentUploaded,
    checkFinanceReadiness,
    onContractUploaded,
  };
}
