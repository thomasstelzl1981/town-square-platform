/**
 * MOD-18 Finanzen — Tab 6: Vorsorge & Testament
 * Person selection via WidgetGrid CI-Kacheln + Testament WidgetGrid
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CARD, TYPOGRAPHY, HEADER, DEMO_WIDGET } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { PatientenverfuegungInlineForm } from '@/components/legal/PatientenverfuegungInlineForm';
import { TestamentVorlageInline } from '@/components/legal/TestamentVorlageInline';
import { TESTAMENT_VORLAGEN } from '@/components/legal/testamentVorlagenTexte';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, ScrollText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';

const ROLE_LABELS: Record<string, string> = {
  hauptperson: 'Hauptperson',
  partner: 'Partner/in',
  kind: 'Kind',
  weitere: 'Weitere',
};

const ROLE_GRADIENTS: Record<string, string> = {
  hauptperson: 'from-primary to-primary/60',
  partner: 'from-rose-400 to-rose-500/60',
  kind: 'from-amber-400 to-amber-500/60',
  weitere: 'from-muted-foreground to-muted-foreground/60',
};

export default function VorsorgedokumenteTab() {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedVariante, setSelectedVariante] = useState(1);

  const { data: rawPersons } = useQuery({
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

  const persons = useMemo(
    () => demoEnabled ? rawPersons : rawPersons?.filter((p: any) => !isDemoId(p.id)),
    [rawPersons, demoEnabled]
  );
  const effectivePersonId = selectedPersonId || persons?.find(p => p.is_primary)?.id || persons?.[0]?.id || null;

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
    const parts = [selectedPerson.street, selectedPerson.house_number].filter(Boolean).join(' ');
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
        title="Testament & Vollmacht"
        description="Patientenverfügung, Vorsorgevollmacht und Testament — deine wichtigsten Vorsorgedokumente"
      />

      {/* SEKTION 1: Patientenverfügung */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={HEADER.WIDGET_ICON_BOX}>
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <h2 className={TYPOGRAPHY.SECTION_TITLE}>Patientenverfügung & Vorsorgevollmacht</h2>
        </div>

        {/* Person CI-Kacheln */}
        <WidgetGrid>
          {persons?.map(person => {
            const isSelected = person.id === effectivePersonId;
            const completed = isPvCompleted(person.id);
            const isDemo = isDemoId(person.id);
            const glowVariant = isDemo ? 'emerald' : 'rose';
            const gradient = ROLE_GRADIENTS[person.role] || ROLE_GRADIENTS.weitere;

            return (
              <WidgetCell key={person.id}>
                <div
                  className={cn(
                    CARD.BASE, CARD.INTERACTIVE,
                    'h-full flex flex-col items-center justify-center p-5 text-center',
                    getActiveWidgetGlow(glowVariant),
                    isSelected && getSelectionRing(glowVariant),
                  )}
                  onClick={(e) => { e.stopPropagation(); setSelectedPersonId(person.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSelectedPersonId(person.id); }}}
                  role="button"
                  tabIndex={0}
                >
                  {isDemo && (
                    <Badge className={DEMO_WIDGET.BADGE + ' absolute top-3 right-3 text-[10px]'}>DEMO</Badge>
                  )}
                  <div className={cn('h-14 w-14 rounded-full bg-gradient-to-br flex items-center justify-center mb-3', gradient)}>
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <h4 className={TYPOGRAPHY.CARD_TITLE}>
                    {person.first_name} {person.last_name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ROLE_LABELS[person.role] || person.role}
                  </p>
                  {completed && (
                    <Badge variant="secondary" className="mt-2 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Hinterlegt
                    </Badge>
                  )}
                </div>
              </WidgetCell>
            );
          })}
        </WidgetGrid>

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

      {/* SEKTION 2: Testament */}
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

        <WidgetGrid>
          {TESTAMENT_VORLAGEN.map(vorlage => {
            const isSelected = vorlage.id === selectedVariante;
            return (
              <WidgetCell key={vorlage.id}>
                <div
                  onClick={(e) => { e.stopPropagation(); setSelectedVariante(vorlage.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSelectedVariante(vorlage.id); }}}
                  className={cn(
                    CARD.BASE,
                    CARD.INTERACTIVE,
                    'h-full flex flex-col justify-between p-5',
                    isSelected ? getSelectionRing('primary') : 'ring-2 ring-border/30'
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
