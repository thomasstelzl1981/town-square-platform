/**
 * usePdfTemplateExport — Runtime hook for PDF template exports via Registry SSOT
 * 
 * Resolves template metadata (pageLimit, scopes) from registry.
 * Manages loading/error state for the generation process.
 */
import { useState, useCallback } from 'react';
import { getTemplate, type PdfTemplateEntry } from '@/lib/pdf/templates/registry';
import { toast } from 'sonner';

export interface PdfExportState {
  isGenerating: boolean;
  error: string | null;
  template: PdfTemplateEntry | null;
}

export function usePdfTemplateExport(templateKey: string) {
  const [state, setState] = useState<PdfExportState>({
    isGenerating: false,
    error: null,
    template: getTemplate(templateKey) || null,
  });

  const generate = useCallback(async (generatorFn: () => Promise<void>) => {
    const tmpl = getTemplate(templateKey);
    if (!tmpl) {
      toast.error(`Template "${templateKey}" nicht in Registry gefunden.`);
      return;
    }
    if (tmpl.status !== 'active') {
      toast.error(`Template "${tmpl.label}" ist noch nicht verfügbar (Status: ${tmpl.status}).`);
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      await generatorFn();
      toast.success(`${tmpl.label} wurde erstellt.`);
    } catch (err: any) {
      const msg = err?.message || 'PDF-Generierung fehlgeschlagen';
      setState(prev => ({ ...prev, error: msg }));
      toast.error(`Fehler: ${msg}`);
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [templateKey]);

  return { ...state, generate };
}
