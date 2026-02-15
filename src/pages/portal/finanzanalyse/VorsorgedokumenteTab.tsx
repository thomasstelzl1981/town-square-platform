/**
 * MOD-18 Finanzen — Tab 6: Vorsorge & Testament
 * Zwei quadratische Widgets: Patientenverfügung + Berliner Testament
 * Status: Smaragdgrün = hinterlegt, Rot = fehlt
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CARD, TYPOGRAPHY } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { LegalDocumentDialog } from '@/components/legal/LegalDocumentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VorsorgedokumenteTab() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState<'patientenverfuegung' | 'testament' | null>(null);

  // Fetch legal documents status
  const { data: legalDocs } = useQuery({
    queryKey: ['legal-documents', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const pvCompleted = legalDocs?.some(d => d.document_type === 'patientenverfuegung' && d.is_completed);
  const testamentCompleted = legalDocs?.some(d => d.document_type === 'testament' && d.is_completed);

  const pvFormData = legalDocs?.find(d => d.document_type === 'patientenverfuegung')?.form_data;

  const handleCompleted = () => {
    queryClient.invalidateQueries({ queryKey: ['legal-documents', activeTenantId] });
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Vorsorge & Testament"
        description="Patientenverfügung, Vorsorgevollmacht und Testament — Ihre wichtigsten Vorsorgedokumente"
      />

      <WidgetGrid>
        {/* Widget 1: Patientenverfügung + Vorsorgevollmacht */}
        <WidgetCell>
          <div
            onClick={() => setDialogOpen('patientenverfuegung')}
            className={cn(
              CARD.BASE,
              CARD.INTERACTIVE,
              'h-full flex flex-col justify-between p-5 ring-2',
              pvCompleted
                ? 'ring-emerald-500 dark:ring-emerald-400'
                : 'ring-red-500 dark:ring-red-400'
            )}
          >
            <div className="space-y-3">
              {pvCompleted && (
                <div className="flex justify-end">
                  <Badge className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Hinterlegt
                  </Badge>
                </div>
              )}

              <div>
                <h3 className={TYPOGRAPHY.CARD_TITLE}>
                  Patientenverfügung & Vorsorgevollmacht
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Eine Patientenverfügung legt fest, welche medizinischen Maßnahmen 
                Sie wünschen oder ablehnen, wenn Sie sich nicht mehr äußern können. 
                Die Vorsorgevollmacht bestimmt, wer in Ihrem Namen Entscheidungen 
                trifft — von Gesundheitsfragen bis zur Vermögensverwaltung.
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground/70 mt-2">
              Klicken zum Erstellen und Ausdrucken →
            </p>
          </div>
        </WidgetCell>

        {/* Widget 2: Testament */}
        <WidgetCell>
          <div
            onClick={() => setDialogOpen('testament')}
            className={cn(
              CARD.BASE,
              CARD.INTERACTIVE,
              'h-full flex flex-col justify-between p-5 ring-2',
              testamentCompleted
                ? 'ring-emerald-500 dark:ring-emerald-400'
                : 'ring-red-500 dark:ring-red-400'
            )}
          >
            <div className="space-y-3">
              {testamentCompleted && (
                <div className="flex justify-end">
                  <Badge className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Hinterlegt
                  </Badge>
                </div>
              )}

              <div>
                <h3 className={TYPOGRAPHY.CARD_TITLE}>
                  Testament
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Ein Testament ist entscheidend, um Streitigkeiten innerhalb der 
                Familie zu vermeiden. Die PDF-Schreibvorlage enthält vier Varianten: 
                Alleinerbe, Mehrere Erben, Vor-/Nacherbschaft und Berliner Testament. 
                <strong className="text-foreground/80"> Wichtig:</strong> Ein Testament ist nur als 
                vollständig handschriftliches Original mit eigenhändiger Unterschrift wirksam — 
                kein Ausdruck, keine digitale Signatur.
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground/70 mt-2">
              Klicken für Schreibvorlage (PDF) →
            </p>
          </div>
        </WidgetCell>
      </WidgetGrid>

      {/* Dialog: Patientenverfügung */}
      {dialogOpen === 'patientenverfuegung' && activeTenantId && (
        <LegalDocumentDialog
          open={true}
          onOpenChange={open => { if (!open) setDialogOpen(null); }}
          documentType="patientenverfuegung"
          tenantId={activeTenantId}
          existingFormData={pvFormData as any}
          onCompleted={handleCompleted}
        />
      )}

      {/* Dialog: Testament — Platzhalter bis Text geliefert wird */}
      {dialogOpen === 'testament' && activeTenantId && (
        <LegalDocumentDialog
          open={true}
          onOpenChange={open => { if (!open) setDialogOpen(null); }}
          documentType="testament"
          tenantId={activeTenantId}
          existingFormData={null}
          onCompleted={handleCompleted}
        />
      )}
    </PageShell>
  );
}
