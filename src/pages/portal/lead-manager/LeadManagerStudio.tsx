/**
 * Lead Manager — Studio Tab (MOD-10)
 * Brand-Switch + Template-Katalog + CTA Kampagne planen
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Plus, ArrowRight, BarChart3, FileText, CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';

const BRANDS = [
  { key: 'futureroom', label: 'FutureRoom', description: 'Finanzierungsberatung' },
  { key: 'kaufy', label: 'Kaufy', description: 'Immobilienvertrieb' },
  { key: 'lennox_friends', label: 'Lennox & Friends', description: 'Pet-Services' },
  { key: 'acquiary', label: 'Acquiary', description: 'Akquise-Management' },
];

export default function LeadManagerStudio() {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState('kaufy');

  return (
    <PageShell>
      <ModulePageHeader
        title="STUDIO"
        description="Brand wählen, Templates ansehen, Kampagne planen"
        actions={
          <Button onClick={() => navigate('/portal/lead-manager/studio/planen')} className="gap-2">
            <Plus className="h-4 w-4" /> Kampagne planen
          </Button>
        }
      />

      {/* Brand Switch */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        {BRANDS.map(b => (
          <Card
            key={b.key}
            className={`cursor-pointer transition-all ${selectedBrand === b.key ? 'border-primary bg-primary/5 shadow-sm' : 'glass-card hover:border-primary/30'}`}
            onClick={() => setSelectedBrand(b.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={selectedBrand === b.key ? 'default' : 'outline'}>{b.label}</Badge>
                {selectedBrand === b.key && <Sparkles className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">{b.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        <Card className="glass-card hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => navigate('/portal/lead-manager/kampagnen')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Meine Kampagnen</p>
              <p className="text-xs text-muted-foreground">Beauftragungen einsehen</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="glass-card hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => navigate('/portal/lead-manager/leads')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Meine Leads</p>
              <p className="text-xs text-muted-foreground">Leads einsehen & bearbeiten</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-muted/50">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm font-medium">So funktioniert der Lead Manager</p>
          <div className="space-y-2">
            {[
              'Wählen Sie die Marke, für die Sie werben möchten.',
              'Konfigurieren Sie Zielgruppe, Region und Budget für Ihre Kampagne.',
              'Wir schalten die Anzeigen über unseren zentralen Meta-Account.',
              'Generierte Leads erscheinen automatisch in Ihrem Lead Manager.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <div className="rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">{i + 1}</div>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
