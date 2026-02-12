/**
 * SanierungDetail — Continuous vertical Akte for a single renovation case
 * Replaces the old inline Collapsible with a full-page detail view.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, HardHat, Wrench, Zap, Paintbrush, Home, Square, Flame, Package, Building2, ClipboardList } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { SanierungStepper } from './SanierungStepper';
import { ServiceCaseStatusBadge } from '@/components/portal/immobilien/sanierung/ServiceCaseStatusBadge';
import { ScopeDefinitionPanel } from '@/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel';
import { ProviderSearchPanel, type SelectedProvider } from '@/components/portal/immobilien/sanierung/tender';
import { TenderDraftPanel } from '@/components/portal/immobilien/sanierung/tender';
import { OfferComparisonPanel } from '@/components/portal/immobilien/sanierung/offers';
import { useServiceCases, type ServiceCaseCategory } from '@/hooks/useServiceCases';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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
  const { data: cases, isLoading } = useServiceCases();
  const [selectedProviders, setSelectedProviders] = useState<SelectedProvider[]>([]);

  const serviceCase = cases?.find(c => c.id === caseId);

  if (isLoading) {
    return (
      <PageShell>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </PageShell>
    );
  }

  if (!serviceCase) {
    return (
      <PageShell>
        <Card><CardContent className="p-12 text-center">
          <HardHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Vorgang nicht gefunden</h3>
          <Button className="mt-4" onClick={() => navigate('/portal/immobilien/sanierung')}>Zurück</Button>
        </CardContent></Card>
      </PageShell>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[serviceCase.category] || Package;

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/immobilien/sanierung')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{serviceCase.title}</h1>
            <ServiceCaseStatusBadge status={serviceCase.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
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
                <span>{serviceCase.property.address}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <SanierungStepper currentStatus={serviceCase.status} />

      {/* Kurzbeschreibung — Bank table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Übersicht</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <TableRow label="Objekt" value={serviceCase.property?.address || '–'} />
            <TableRow label="Einheit" value={serviceCase.unit ? (serviceCase.unit.code || serviceCase.unit.unit_number) : '–'} />
            <TableRow label="Kategorie" value={CATEGORY_LABELS[serviceCase.category]} />
            <TableRow label="Budget" value={
              serviceCase.cost_estimate_min && serviceCase.cost_estimate_max
                ? `${formatCurrency(serviceCase.cost_estimate_min / 100)} – ${formatCurrency(serviceCase.cost_estimate_max / 100)}`
                : serviceCase.budget_estimate
                  ? formatCurrency(Number(serviceCase.budget_estimate))
                  : '–'
            } />
            <TableRow label="Erstellt" value={format(new Date(serviceCase.created_at), 'dd.MM.yyyy', { locale: de })} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 1: Leistungsumfang */}
      <SectionHeader number={1} title="Leistungsumfang" description="KI-Analyse, Positionen bearbeiten, Kostenschätzung" />
      <ScopeDefinitionPanel
        serviceCase={serviceCase}
        onBack={() => navigate('/portal/immobilien/sanierung')}
        onNext={() => {}}
      />

      <Separator />

      {/* Section 2: Dienstleister */}
      <SectionHeader number={2} title="Dienstleister finden" description="Handwerker in der Nähe suchen und auswählen" />
      <ProviderSearchPanel
        category={serviceCase.category}
        location={serviceCase.property?.city || serviceCase.property?.address || ''}
        selectedProviders={selectedProviders}
        onProvidersChange={setSelectedProviders}
      />

      <Separator />

      {/* Section 3: Ausschreibung */}
      <SectionHeader number={3} title="Ausschreibung versenden" description="Anfragen an ausgewählte Dienstleister senden" />
      <TenderDraftPanel
        serviceCase={serviceCase}
        selectedProviders={selectedProviders}
        onSendComplete={() => {}}
      />

      <Separator />

      {/* Section 4: Angebote & Vergabe */}
      <SectionHeader number={4} title="Angebote vergleichen & vergeben" description="Eingehende Angebote bewerten und Auftrag vergeben" />
      <OfferComparisonPanel serviceCase={serviceCase} />
    </PageShell>
  );
}

function SectionHeader({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 pt-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
        {number}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
