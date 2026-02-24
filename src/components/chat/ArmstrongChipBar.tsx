/**
 * ArmstrongChipBar — Module-specific and website-specific quick action chips
 * 
 * Displays 2-4 clickable chips above the chat input that trigger
 * Armstrong actions directly, bypassing intent classification.
 * 
 * MOD-13: Dynamic chips based on Magic Intake step (upload/review/created)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { useIntakeListener, type IntakeStep } from '@/hooks/useIntakeContext';

export interface ChipDefinition {
  label: string;
  action_code: string;
}

interface ArmstrongChipBarProps {
  moduleCode: string;
  onChipClick: (actionCode: string, label: string) => void;
  disabled?: boolean;
  className?: string;
  website?: string | null;
  maxChips?: number;
}

// Website-specific chip sets (Zone 3 Lead Capture)
const WEBSITE_CHIPS: Record<string, ChipDefinition[]> = {
  'kaufy': [
    { label: 'Immobilie finden', action_code: 'ARM.Z3.KAUFY.TO_REGISTER' },
    { label: 'Exposé anfordern', action_code: 'ARM.Z3.KAUFY.REQUEST_EXPOSE' },
    { label: 'Kontakt aufnehmen', action_code: 'ARM.Z3.KAUFY.CAPTURE_LEAD' },
  ],
  'futureroom': [
    { label: 'Finanzierbarkeit prüfen', action_code: 'ARM.Z3.FR.QUICK_CHECK' },
    { label: 'Finanzierungsablauf', action_code: 'ARM.Z3.FR.EXPLAIN_PROCESS' },
    { label: 'Selbstauskunft starten', action_code: 'ARM.Z3.FR.START_SELBSTAUSKUNFT' },
    { label: 'Checkliste Unterlagen', action_code: 'ARM.Z3.FR.DOCS_CHECKLIST' },
  ],
  'sot': [
    { label: 'Welche Module passen?', action_code: 'ARM.Z3.SOT.RECOMMEND_MODULES' },
    { label: 'Demo buchen', action_code: 'ARM.Z3.SOT.BOOK_DEMO' },
    { label: 'Wie funktioniert SoT?', action_code: 'ARM.Z3.SOT.HOW_IT_WORKS' },
    { label: 'Jetzt registrieren', action_code: 'ARM.Z3.SOT.TO_REGISTER' },
  ],
};

// Module-specific chip sets (Zone 2 Portal)
const MODULE_CHIPS: Record<string, ChipDefinition[]> = {
  'MOD-00': [
    { label: 'Aufgabe erstellen', action_code: 'ARM.MOD00.CREATE_TASK' },
    { label: 'Notiz erstellen', action_code: 'ARM.MOD00.CREATE_NOTE' },
    { label: 'Erinnerung', action_code: 'ARM.MOD00.CREATE_REMINDER' },
  ],
  'MOD-01': [
    { label: 'Profil prüfen', action_code: 'ARM.MOD01.CHECK_COMPLETENESS' },
    { label: 'Modul erklären', action_code: 'ARM.MOD01.EXPLAIN_MODULE' },
  ],
  'MOD-03': [
    { label: 'Dokument suchen', action_code: 'ARM.MOD03.SEARCH_DOC' },
    { label: 'Upload erklären', action_code: 'ARM.MOD03.EXPLAIN_UPLOAD' },
  ],
  'MOD-04': [
    { label: 'Immobilie aus Dokument', action_code: 'ARM.MOD04.MAGIC_INTAKE_PROPERTY' },
    { label: 'KPIs berechnen', action_code: 'ARM.MOD04.CALCULATE_KPI' },
    { label: 'Daten prüfen', action_code: 'ARM.MOD04.DATA_QUALITY_CHECK' },
  ],
  'MOD-06': [
    { label: 'Inserat aus Exposé', action_code: 'ARM.MOD06.MAGIC_INTAKE_LISTING' },
  ],
  'MOD-07': [
    { label: 'Selbstauskunft erklären', action_code: 'ARM.MOD07.EXPLAIN_SELBSTAUSKUNFT' },
    { label: 'Dok-Checkliste', action_code: 'ARM.MOD07.DOC_CHECKLIST' },
    { label: 'Bereitschaft prüfen', action_code: 'ARM.MOD07.VALIDATE_READINESS' },
  ],
  'MOD-08': [
    { label: 'Simulation', action_code: 'ARM.MOD08.RUN_SIMULATION' },
    { label: 'Suchmandat aus Dok.', action_code: 'ARM.MOD08.MAGIC_INTAKE_MANDATE' },
    { label: 'Favorit analysieren', action_code: 'ARM.MOD08.ANALYZE_FAVORITE' },
  ],
  'MOD-09': [
    { label: 'Partner aus Dokument', action_code: 'ARM.MOD09.MAGIC_INTAKE_PARTNER' },
  ],
  'MOD-10': [
    { label: 'Modul erklären', action_code: 'ARM.GLOBAL.HOW_IT_WORKS' },
  ],
  'MOD-11': [
    { label: 'Fall aus Dokument', action_code: 'ARM.MOD11.MAGIC_INTAKE_CASE' },
    { label: 'Selbstauskunft befüllen', action_code: 'ARM.MOD07.MAGIC_INTAKE_SELBSTAUSKUNFT' },
  ],
  'MOD-12': [
    { label: 'Mandat aus Dokument', action_code: 'ARM.MOD12.MAGIC_INTAKE_MANDATE' },
  ],
  'MOD-13': [
    { label: 'Projekt aus Dokument', action_code: 'ARM.MOD13.CREATE_DEV_PROJECT' },
    { label: 'Modul erklären', action_code: 'ARM.MOD13.EXPLAIN_MODULE' },
  ],
  'MOD-14': [
    { label: 'Rechercheauftrag', action_code: 'ARM.MOD14.CREATE_RESEARCH_ORDER' },
  ],
  'MOD-15': [
    { label: 'Kurs empfehlen', action_code: 'ARM.MOD15.RECOMMEND_COURSE' },
    { label: 'Modul erklären', action_code: 'ARM.MOD15.EXPLAIN_MODULE' },
  ],
  'MOD-17': [
    { label: 'Fahrzeug aus Dokument', action_code: 'ARM.MOD17.MAGIC_INTAKE_VEHICLE' },
  ],
  'MOD-18': [
    { label: 'Finanzdaten aus Dok.', action_code: 'ARM.MOD18.MAGIC_INTAKE_FINANCE' },
  ],
  'MOD-19': [
    { label: 'PV-Anlage aus Dok.', action_code: 'ARM.MOD19.MAGIC_INTAKE_PLANT' },
  ],
  'MOD-20': [
    { label: 'NK prüfen', action_code: 'ARM.MOD20.CHECK_NK' },
    { label: 'Vertrag aus Dokument', action_code: 'ARM.MOD20.MAGIC_INTAKE_CONTRACT' },
  ],
  'MOD-22': [
    { label: 'Pipeline anzeigen', action_code: 'ARM.MOD22.VIEW_PIPELINE' },
    { label: 'Modul erklären', action_code: 'ARM.MOD22.EXPLAIN_MODULE' },
  ],
};

// ── Dynamic MOD-13 chips by intake step ──────────────────────────────────────
const MOD13_INTAKE_CHIPS: Record<string, ChipDefinition[]> = {
  'upload': [
    { label: 'Welche Dateien?', action_code: 'ARM.MOD13.EXPLAIN_UPLOAD_FORMATS' },
    { label: 'Beispiel-Exposé', action_code: 'ARM.MOD13.SHOW_EXAMPLE' },
  ],
  'analyzing': [
    { label: 'Wie lange dauert das?', action_code: 'ARM.MOD13.EXPLAIN_ANALYSIS_TIME' },
  ],
  'review': [
    { label: 'Einheiten prüfen', action_code: 'ARM.MOD13.REVIEW_UNITS' },
    { label: 'Begriffe erklären', action_code: 'ARM.MOD13.EXPLAIN_TERMS' },
    { label: 'Daten plausibel?', action_code: 'ARM.MOD13.VALIDATE_DATA' },
  ],
  'created': [
    { label: 'Immobilienakten erstellen', action_code: 'ARM.MOD13.CREATE_PROPERTY_FILES' },
    { label: 'Vertrieb starten', action_code: 'ARM.MOD13.START_DISTRIBUTION' },
  ],
};

export const ArmstrongChipBar = React.memo<ArmstrongChipBarProps>(
  ({ moduleCode, onChipClick, disabled = false, className, website, maxChips }) => {
    const intakeState = useIntakeListener();

    // Resolve chip set: website > MOD-13 intake-dynamic > module default
    let allChips: ChipDefinition[] | undefined;

    if (website) {
      allChips = WEBSITE_CHIPS[website];
    } else if (moduleCode === 'MOD-13' && intakeState.step) {
      allChips = MOD13_INTAKE_CHIPS[intakeState.step];
    } else {
      allChips = MODULE_CHIPS[moduleCode];
    }

    const chips = maxChips ? allChips?.slice(0, maxChips) : allChips;

    if (!chips || chips.length === 0) return null;

    return (
      <div className={cn('flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-none', className)}>
        <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
        {chips.map((chip) => (
          <button
            key={chip.action_code}
            onClick={() => onChipClick(chip.action_code, chip.label)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium',
              'bg-primary/8 text-primary border border-primary/15',
              'hover:bg-primary/15 hover:border-primary/25',
              'active:scale-[0.97] transition-all duration-150',
              'whitespace-nowrap shrink-0',
              'disabled:opacity-40 disabled:pointer-events-none'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    );
  }
);
ArmstrongChipBar.displayName = 'ArmstrongChipBar';
