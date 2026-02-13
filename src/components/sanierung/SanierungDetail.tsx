/**
 * SanierungDetail — Continuous vertical Akte for a single renovation case
 * CI-konform: SectionCard, FORM_GRID, SPACING.SECTION
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { X, HardHat, Wrench, Zap, Paintbrush, Home, Square, Flame, Package, Building2, ClipboardList, Search, Mail, BarChart3, Save } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { SectionCard } from '@/components/shared/SectionCard';
import { SanierungStepper } from './SanierungStepper';
import { ServiceCaseStatusBadge } from '@/components/portal/immobilien/sanierung/ServiceCaseStatusBadge';
import { ScopeDefinitionPanel } from '@/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel';
import { ProviderSearchPanel, type SelectedProvider } from '@/components/portal/immobilien/sanierung/tender';
import { TenderDraftPanel } from '@/components/portal/immobilien/sanierung/tender';
import { OfferComparisonPanel } from '@/components/portal/immobilien/sanierung/offers';
import { useServiceCases, type ServiceCaseCategory } from '@/hooks/useServiceCases';
import { DESIGN } from '@/config/designManifest';

const CATEGORY_ICONS: Record<ServiceCaseCategory, React.ComponentType<{ className?: string }>> = {
  sanitaer: Wrench, elektro: Zap, maler: Paintbrush, dach: Home,
  fenster: Square, heizung: Flame, gutachter: ClipboardList,
  hausverwaltung: Building2, sonstige: Package,
};

const CATEGORY_LABELS: Record<ServiceCaseCategory, string> = {
  sanitaer: 'Sanitär', elektro: 'Elektro', maler: 'Maler', dach: 'Dach',
  fenster: 'Fenster', heizung: 'Heizung', gutachter: 'Gutachter',
  hausverwaltung: 'HV', sonstige: 'Sonstige',
};

export function SanierungDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  return (
    <SanierungDetailInner
      caseId={caseId!}
      onClose={() => navigate('/portal/immobilien/sanierung')}
      wrapInShell
    />
  );
}

/** Inline variant — rendered inside the SanierungTab below the widgets */
export function SanierungDetailInline({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  return <SanierungDetailInner caseId={caseId} onClose={onClose} wrapInShell={false} />;
}

function SanierungDetailInner({ caseId, onClose, wrapInShell }: { caseId: string; onClose: () => void; wrapInShell: boolean }) {
  const { data: cases, isLoading } = useServiceCases();
  const [selectedProviders, setSelectedProviders] = useState<SelectedProvider[]>([]);

  const serviceCase = cases?.find(c => c.id === caseId);

  if (isLoading) {
    const content = (
      <div className={DESIGN.SPACING.SECTION}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
    return wrapInShell ? <PageShell>{content}</PageShell> : <div className="pt-6">{content}</div>;
  }

  if (!serviceCase) {
    const content = (
      <div className={DESIGN.CARD.CONTENT + ' text-center py-12'}>
        <HardHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Vorgang nicht gefunden</h3>
        <Button className="mt-4" onClick={onClose}>Schließen</Button>
      </div>
    );
    return wrapInShell ? <PageShell>{content}</PageShell> : <div className="pt-6">{content}</div>;
  }

  const CategoryIcon = CATEGORY_ICONS[serviceCase.category] || Package;

  const detail = (
    <div className={DESIGN.SPACING.SECTION}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold tracking-tight">{serviceCase.title}</h2>
            <ServiceCaseStatusBadge status={serviceCase.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              {serviceCase.tender_id || serviceCase.public_id}
            </Badge>
            <span>•</span>
            <Badge variant="secondary" className="text-xs">
              <CategoryIcon className="h-3 w-3 mr-1" />
              {CATEGORY_LABELS[serviceCase.category]}
            </Badge>
            {serviceCase.property?.address && (
              <>
                <span>•</span>
                <span>{serviceCase.property.address}, {serviceCase.property.city}</span>
              </>
            )}
            {serviceCase.unit && (
              <>
                <span>•</span>
                <span>{serviceCase.unit.code || serviceCase.unit.unit_number}</span>
              </>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Stepper ── */}
      <SanierungStepper currentStatus={serviceCase.status} />

      {/* ── Section 1: Leistungsumfang ── */}
      <SectionCard title="Leistungsumfang" description="Beschreibung, KI-Analyse und Kostenschätzung" icon={ClipboardList}>
        <ScopeDefinitionPanel serviceCase={serviceCase} />
      </SectionCard>

      {/* ── Section 2: Dienstleister & Ausschreibung ── */}
      <SectionCard title="Dienstleister & Ausschreibung" description="Handwerker suchen und Anfrage versenden" icon={Search}>
        <div className={DESIGN.FORM_GRID.FULL}>
          <ProviderSearchPanel
            category={serviceCase.category}
            location={serviceCase.property?.city || serviceCase.property?.address || ''}
            selectedProviders={selectedProviders}
            onProvidersChange={setSelectedProviders}
          />
          <TenderDraftPanel
            serviceCase={serviceCase}
            selectedProviders={selectedProviders}
            onSendComplete={() => {}}
          />
        </div>
      </SectionCard>

      {/* ── Section 3: Angebote & Vergabe ── */}
      <SectionCard title="Angebote & Vergabe" description="Eingehende Angebote bewerten und Auftrag vergeben" icon={BarChart3}>
        <OfferComparisonPanel serviceCase={serviceCase} />
      </SectionCard>
    </div>
  );

  return wrapInShell ? <PageShell>{detail}</PageShell> : <div className="pt-6">{detail}</div>;
}
