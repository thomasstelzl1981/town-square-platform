/**
 * ArmstrongChipBar — Module-specific quick action chips
 * 
 * Displays 2-4 clickable chips above the chat input that trigger
 * Armstrong actions directly, bypassing intent classification.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

export interface ChipDefinition {
  label: string;
  action_code: string;
}

interface ArmstrongChipBarProps {
  moduleCode: string;
  onChipClick: (actionCode: string, label: string) => void;
  disabled?: boolean;
  className?: string;
}

const MODULE_CHIPS: Record<string, ChipDefinition[]> = {
  'MOD-04': [
    { label: 'Immobilie aus Dokument', action_code: 'ARM.MOD04.MAGIC_INTAKE_PROPERTY' },
    { label: 'KPIs berechnen', action_code: 'ARM.MOD04.CALCULATE_KPI' },
    { label: 'Daten prüfen', action_code: 'ARM.MOD04.DATA_QUALITY_CHECK' },
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
  'MOD-18': [
    { label: 'Finanzdaten aus Dok.', action_code: 'ARM.MOD18.MAGIC_INTAKE_FINANCE' },
  ],
  'MOD-17': [
    { label: 'Fahrzeug aus Dokument', action_code: 'ARM.MOD17.MAGIC_INTAKE_VEHICLE' },
  ],
  'MOD-19': [
    { label: 'PV-Anlage aus Dok.', action_code: 'ARM.MOD19.MAGIC_INTAKE_PLANT' },
  ],
  'MOD-20': [
    { label: 'Vertrag aus Dokument', action_code: 'ARM.MOD20.MAGIC_INTAKE_CONTRACT' },
  ],
};

export const ArmstrongChipBar = React.memo<ArmstrongChipBarProps>(
  ({ moduleCode, onChipClick, disabled = false, className }) => {
    const chips = MODULE_CHIPS[moduleCode];

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
