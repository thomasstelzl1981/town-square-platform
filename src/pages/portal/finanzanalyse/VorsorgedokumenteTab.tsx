/**
 * MOD-18 Finanzen — Tab 6: Vorsorge & Testament
 * Sektions-Layout: Personen-Widgets (PV) + 4 Vorlagen-Widgets (Testament)
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CARD, TYPOGRAPHY, HEADER } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { PatientenverfuegungInlineForm } from '@/components/legal/PatientenverfuegungInlineForm';
import { TestamentVorlageInline } from '@/components/legal/TestamentVorlageInline';
import { TESTAMENT_VORLAGEN } from '@/components/legal/testamentVorlagenTexte';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, User, FileText, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VorsorgedokumenteTab() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedVariante, setSelectedVariante] = useState(1);

  // Fetch household persons
  const { data: persons } = useQuery({
    queryKey: ['household_persons', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('household_persons')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_order');
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Auto-select primary person
  const effectivePersonId = selectedPersonId || persons?.find(p => p.is_primary)?.id || persons?.[0]?.id || null;

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

  const selectedPerson = useMemo(
    () => persons?.find(p => p.id === effectivePersonId),
    [persons, effectivePersonId]
  );

  const personAddress = useMemo(() => {
    if (!selectedPerson) return '';
    const parts = [
      selectedPerson.street,
      selectedPerson.house_number,
    ].filter(Boolean).join(' ');
    const cityParts = [selectedPerson.zip, selectedPerson.city].filter(Boolean).join(' ');
    return [parts, cityParts].filter(Boolean).join(', ');
  }, [selectedPerson]);

  const selectedVorlage = TESTAMENT_VORLAGEN.find(v => v.id === selectedVariante)!;

  const handleCompleted = () => {
    queryClient.invalidateQueries({ queryKey: ['legal-documents', activeTenantId] });
  };

  const isPvCompleted = (personId: string) =>
    legalDocs?.some(d => d.document_type === 'patientenverfuegung' && d.user_id === personId && d.is_completed);

  const testamentCompleted = legalDocs?.some(d => d.document_type === 'testament' && d.is_completed);

  return (
    <PageShell>
      <ModulePageHeader
        title="Vorsorge & Testament"
        description="Patientenverfügung, Vorsorgevollmacht und Testament — Ihre wichtigsten Vorsorgedokumente"
      />

      {/* ═══════════════════════════════════════════ */}
      {/* SEKTION 1: Patientenverfügung & Vorsorgevollmacht */}
      {/* ═══════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={HEADER.WIDGET_ICON_BOX}>
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <h2 className={TYPOGRAPHY.SECTION_TITLE}>Patientenverfügung & Vorsorgevollmacht</h2>
        </div>

        {/* Personen-Widgets */}
        <WidgetGrid>
          {persons?.map(person => {
            const isSelected = person.id === effectivePersonId;
            const completed = isPvCompleted(person.id);
            return (
              <WidgetCell key={person.id}>
                <div
                  onClick={() => setSelectedPersonId(person.id)}
                  className={cn(
                    CARD.BASE,
                    CARD.INTERACTIVE,
                    'h-full flex flex-col justify-between p-5 ring-2',
                    isSelected
                      ? 'ring-primary'
                      : completed
                        ? 'ring-emerald-500/50 dark:ring-emerald-400/50'
                        : 'ring-border/30'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={HEADER.WIDGET_ICON_BOX}>
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      {completed && (
                        <Badge className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Hinterlegt
                        </Badge>
                      )}
                    </div>
                    <h3 className={TYPOGRAPHY.CARD_TITLE}>
                      {person.first_name} {person.last_name}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">{person.role}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-2">
                    {isSelected ? 'Ausgewählt — Formular unten' : 'Klicken zum Auswählen'}
                  </p>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>

        {/* Inline-Formular (immer offen) */}
        {effectivePersonId && selectedPerson && activeTenantId && (
          <PatientenverfuegungInlineForm
            personId={effectivePersonId}
            personName={`${selectedPerson.first_name} ${selectedPerson.last_name}`}
            personBirthDate={selectedPerson.birth_date}
            personAddress={personAddress}
            tenantId={activeTenantId}
            onCompleted={handleCompleted}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SEKTION 2: Testament */}
      {/* ═══════════════════════════════════════════ */}
      <div className="space-y-4 mt-12">
        <div className="flex items-center gap-3">
          <div className={HEADER.WIDGET_ICON_BOX}>
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className={TYPOGRAPHY.SECTION_TITLE}>Testament</h2>
            {testamentCompleted && (
              <Badge className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Scan hinterlegt
              </Badge>
            )}
          </div>
        </div>

        {/* 4 Vorlagen-Widgets */}
        <WidgetGrid>
          {TESTAMENT_VORLAGEN.map(vorlage => {
            const isSelected = vorlage.id === selectedVariante;
            return (
              <WidgetCell key={vorlage.id}>
                <div
                  onClick={() => setSelectedVariante(vorlage.id)}
                  className={cn(
                    CARD.BASE,
                    CARD.INTERACTIVE,
                    'h-full flex flex-col justify-between p-5 ring-2',
                    isSelected ? 'ring-primary' : 'ring-border/30'
                  )}
                >
                  <div className="space-y-2">
                    <div className={HEADER.WIDGET_ICON_BOX}>
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className={TYPOGRAPHY.CARD_TITLE}>
                      Vorlage {vorlage.id}/4
                    </h3>
                    <p className="text-sm font-medium">{vorlage.title}</p>
                    <p className="text-xs text-muted-foreground">{vorlage.subtitle}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-2">
                    {isSelected ? 'Ausgewählt — Text unten' : 'Klicken zum Anzeigen'}
                  </p>
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>

        {/* Inline-Vorlagentext (immer offen) */}
        {activeTenantId && (
          <TestamentVorlageInline
            vorlage={selectedVorlage}
            tenantId={activeTenantId}
            onCompleted={handleCompleted}
          />
        )}
      </div>
    </PageShell>
  );
}
