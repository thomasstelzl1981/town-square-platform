/**
 * IntakeTab — Magic Intake Center main page.
 * Route: /portal/dms/intake
 *
 * Layout:
 * 1. Process Stepper (IntakeHowItWorks)
 * 2. Entity Picker + Upload Zone (with inline cost hint)
 * 3. Document Checklist (Live Progress)
 * 4. Recent Activity
 * 5. Link to Intelligenz tab
 */

import { useState, useCallback } from 'react';
import { Upload as UploadIcon, Sparkles, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { IntakeHowItWorks } from '@/components/dms/IntakeHowItWorks';
import { IntakeEntityPicker, type IntakeSelection } from '@/components/dms/IntakeEntityPicker';
import { IntakeUploadZone } from '@/components/dms/IntakeUploadZone';
import { IntakeChecklistGrid } from '@/components/dms/IntakeChecklistGrid';
import { IntakeRecentActivity } from '@/components/dms/IntakeRecentActivity';
import { useNavigate } from 'react-router-dom';

export function IntakeTab() {
  const [selection, setSelection] = useState<IntakeSelection | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleUploadComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <PageShell>
      <ModulePageHeader
        title="Magic Intake"
        description="Dokumente hochladen — Armstrong erkennt und befüllt automatisch alle relevanten Felder"
      />

      <div className="space-y-8 max-w-4xl">
        {/* ── Block 1: Schrittleiste ── */}
        <IntakeHowItWorks />

        {/* ── Block 2: Entity-Picker + Upload ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UploadIcon className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dokument hochladen
            </h3>
            <span className="text-[10px] text-muted-foreground ml-auto">
              1 Credit / Dokument (0,25 €)
            </span>
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

        {/* ── Block 3: Dokument-Checkliste ── */}
        <IntakeChecklistGrid refreshKey={refreshKey} />

        {/* ── Block 4: Letzte Aktivität ── */}
        <IntakeRecentActivity />

        {/* ── Block 5: Link zur Intelligenz-Seite ── */}
        <button
          onClick={() => navigate('/portal/dms/intelligenz')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Automatisch alle Dokumente verarbeiten? Zum Intelligenz-Tab
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </PageShell>
  );
}
