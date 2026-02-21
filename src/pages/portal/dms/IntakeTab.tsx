/**
 * IntakeTab — Magic Intake Center main page.
 * 
 * Route: /portal/dms/intake
 * Golden Path compliant: vertical scroll page with blocks.
 */

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { IntakeHowItWorks } from '@/components/dms/IntakeHowItWorks';
import { IntakeEntityPicker, type IntakeSelection } from '@/components/dms/IntakeEntityPicker';
import { IntakeUploadZone } from '@/components/dms/IntakeUploadZone';
import { IntakeChecklistGrid } from '@/components/dms/IntakeChecklistGrid';
import { IntakeRecentActivity } from '@/components/dms/IntakeRecentActivity';

export function IntakeTab() {
  const [selection, setSelection] = useState<IntakeSelection | null>(null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight uppercase">Magic Intake Center</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Ihr digitaler Datenraum — Dokumente hochladen, KI analysieren lassen, automatisch befüllen.
        </p>
      </div>

      {/* Block 1: How it works */}
      <IntakeHowItWorks />

      {/* Block 2: Entity Picker + Upload */}
      <div className="space-y-4">
        <IntakeEntityPicker
          onSelectionComplete={setSelection}
          onReset={() => setSelection(null)}
        />
        <IntakeUploadZone selection={selection} />
      </div>

      {/* Block 3: Checklists */}
      <IntakeChecklistGrid />

      {/* Block 5: Recent Activity */}
      <IntakeRecentActivity />
    </div>
  );
}
