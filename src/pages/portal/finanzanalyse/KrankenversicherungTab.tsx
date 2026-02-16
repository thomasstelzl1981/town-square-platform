/**
 * MOD-18 Finanzen — Tab: Krankenversicherung (KV)
 * 
 * Zeigt PKV/GKV-Status aller Haushaltsmitglieder als RecordCard-Widgets.
 * Daten kommen aus der demoData Engine (clientseitig).
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { RecordCard } from '@/components/shared/RecordCard';
import { RECORD_CARD } from '@/config/designManifest';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { getDemoKVContracts } from '@/engines/demoData';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { Shield } from 'lucide-react';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

export default function KrankenversicherungTab() {
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-18');
  const kvContracts = getDemoKVContracts();
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  if (!demoEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
        <p>Keine Krankenversicherungsdaten vorhanden. Aktivieren Sie die Demo-Daten für eine Vorschau.</p>
      </div>
    );
  }

  const toggleCard = (id: string) => {
    setOpenCardId(prev => prev === id ? null : id);
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Krankenversicherung"
        description="PKV & GKV Übersicht für alle Haushaltsmitglieder"
      />

      <div className={RECORD_CARD.GRID}>
        {kvContracts.map((kv) => (
          <RecordCard
            key={kv.personId}
            id={kv.personId}
            entityType="insurance"
            isOpen={openCardId === kv.personId}
            onToggle={() => toggleCard(kv.personId)}
            glowVariant="primary"
            title={kv.personName}
            subtitle={kv.type}
            badges={[
              { label: 'DEMO', variant: 'outline' as const },
              { label: kv.type, variant: 'secondary' as const },
            ]}
            summary={[
              { label: 'Versicherer', value: kv.provider },
              { label: 'Beitrag', value: fmt(kv.monthlyPremium) },
            ]}
          >
            {/* Open State: KV Details read-only */}
            <div>
              <p className={RECORD_CARD.SECTION_TITLE}>Vertragsdetails</p>
              <div className={RECORD_CARD.FIELD_GRID}>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Versicherer</p>
                  <p className="text-sm font-medium">{kv.provider}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Typ</p>
                  <p className="text-sm font-medium">{kv.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Monatsbeitrag</p>
                  <p className="text-sm font-medium">{fmt(kv.monthlyPremium)}</p>
                </div>
                {kv.employerContribution && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">AG-Anteil</p>
                    <p className="text-sm font-medium">{fmt(kv.employerContribution)}</p>
                  </div>
                )}
              </div>
            </div>

            {Object.keys(kv.details).length > 0 && (
              <div>
                <p className={RECORD_CARD.SECTION_TITLE}>Zusatzdetails</p>
                <div className={RECORD_CARD.FIELD_GRID}>
                  {Object.entries(kv.details).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-medium">
                        {typeof value === 'boolean' ? (value ? '✓ Ja' : '✗ Nein') : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </RecordCard>
        ))}
      </div>
    </PageShell>
  );
}
