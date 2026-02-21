/**
 * IntakeTab — Magic Intake Center main page.
 * 
 * Route: /portal/dms/intake
 * Golden Path compliant: vertical scroll page with blocks.
 * 
 * Layout:
 * 1. Hero Section (Value Proposition + Process Flow)
 * 2. Datenraum-Auslese (StorageExtractionCard) — Autopilot
 * 3. Credit-Info (IntakePricingInfo) — Cost Transparency
 * 4. Manual Upload (EntityPicker + UploadZone)
 * 5. Document Checklist (Live Progress)
 * 6. Recent Activity
 */

import { useState, useCallback } from 'react';
import { Sparkles, Upload as UploadIcon } from 'lucide-react';
import { IntakeHowItWorks } from '@/components/dms/IntakeHowItWorks';
import { IntakeEntityPicker, type IntakeSelection } from '@/components/dms/IntakeEntityPicker';
import { IntakeUploadZone } from '@/components/dms/IntakeUploadZone';
import { IntakeChecklistGrid } from '@/components/dms/IntakeChecklistGrid';
import { IntakeRecentActivity } from '@/components/dms/IntakeRecentActivity';
import { IntakePricingInfo } from '@/components/dms/IntakePricingInfo';
import { StorageExtractionCard } from '@/components/dms/StorageExtractionCard';
import { useAuth } from '@/contexts/AuthContext';

export function IntakeTab() {
  const { activeTenantId } = useAuth();
  const [selection, setSelection] = useState<IntakeSelection | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* ── Block 1: Hero Section ── */}
      <IntakeHowItWorks />

      {/* ── Block 2: Datenraum-Auslese (Autopilot) ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Automatische Datenraum-Auslese
          </h3>
        </div>
        <StorageExtractionCard tenantId={activeTenantId} />
      </section>

      {/* ── Block 3: Credit/Kosten-Info ── */}
      <IntakePricingInfo />

      {/* ── Block 4: Manueller Upload ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UploadIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Einzelne Dokumente hochladen
          </h3>
        </div>
        <IntakeEntityPicker
          onSelectionComplete={setSelection}
          onReset={() => setSelection(null)}
        />
        <IntakeUploadZone
          selection={selection}
          onUploadComplete={handleUploadComplete}
        />
      </section>

      {/* ── Block 5: Dokument-Checkliste (Live-Fortschritt) ── */}
      <IntakeChecklistGrid refreshKey={refreshKey} />

      {/* ── Block 6: Letzte Aktivität ── */}
      <IntakeRecentActivity />
    </div>
  );
}
