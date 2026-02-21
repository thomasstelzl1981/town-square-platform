/**
 * IntakeEntityPicker — 2-step category + entity selection for Magic Intake.
 * 
 * Step 1: Category grid (from parserManifest)
 * Step 2: Entity dropdown (from useIntakeEntityLoader) or "+ Neues Objekt"
 */

import { useState } from 'react';
import { Building2, Car, Sun, Shield, Heart, PawPrint, Landmark, User, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntakeEntityLoader } from '@/hooks/useIntakeEntityLoader';
import type { ParserMode } from '@/types/parser-engine';

interface CategoryConfig {
  mode: ParserMode;
  label: string;
  icon: LucideIcon;
  hasEntityPicker: boolean;
}

const CATEGORIES: CategoryConfig[] = [
  { mode: 'immobilie', label: 'Immobilie', icon: Building2, hasEntityPicker: true },
  { mode: 'fahrzeugschein', label: 'Fahrzeug', icon: Car, hasEntityPicker: true },
  { mode: 'pv_anlage', label: 'PV-Anlage', icon: Sun, hasEntityPicker: true },
  { mode: 'versicherung', label: 'Versicherung', icon: Shield, hasEntityPicker: true },
  { mode: 'vorsorge', label: 'Vorsorge', icon: Heart, hasEntityPicker: true },
  { mode: 'haustier', label: 'Haustier', icon: PawPrint, hasEntityPicker: true },
  { mode: 'finanzierung', label: 'Finanzierung', icon: Landmark, hasEntityPicker: true },
  { mode: 'person', label: 'Person', icon: User, hasEntityPicker: true },
  { mode: 'allgemein', label: 'Sonstiges', icon: FileText, hasEntityPicker: false },
];

const NEW_ENTITY_VALUE = '__NEW__';

export interface IntakeSelection {
  parseMode: ParserMode;
  entityId: string | null;
  isNewEntity: boolean;
  categoryLabel: string;
}

interface IntakeEntityPickerProps {
  onSelectionComplete: (selection: IntakeSelection) => void;
  onReset?: () => void;
}

export function IntakeEntityPicker({ onSelectionComplete, onReset }: IntakeEntityPickerProps) {
  const [selectedMode, setSelectedMode] = useState<ParserMode | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { entities, isLoading } = useIntakeEntityLoader(selectedMode);

  const selectedCategory = CATEGORIES.find((c) => c.mode === selectedMode);

  const handleCategoryClick = (cat: CategoryConfig) => {
    if (selectedMode === cat.mode) {
      // Deselect
      setSelectedMode(null);
      setSelectedEntityId(null);
      onReset?.();
      return;
    }
    setSelectedMode(cat.mode);
    setSelectedEntityId(null);

    // If no entity picker needed (Sonstiges), complete immediately
    if (!cat.hasEntityPicker) {
      onSelectionComplete({
        parseMode: cat.mode,
        entityId: null,
        isNewEntity: false,
        categoryLabel: cat.label,
      });
    }
  };

  const handleEntityChange = (value: string) => {
    const isNew = value === NEW_ENTITY_VALUE;
    setSelectedEntityId(isNew ? null : value);

    if (selectedCategory) {
      onSelectionComplete({
        parseMode: selectedCategory.mode,
        entityId: isNew ? null : value,
        isNewEntity: isNew,
        categoryLabel: selectedCategory.label,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Category Grid */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Um was geht es?</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedMode === cat.mode;
            return (
              <button
                key={cat.mode}
                onClick={() => handleCategoryClick(cat)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                <cat.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="truncate w-full text-center">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Entity Picker */}
      {selectedMode && selectedCategory?.hasEntityPicker && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Zu welchem Objekt gehört das Dokument?
          </p>
          <Select onValueChange={handleEntityChange} value={selectedEntityId || ''}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder={isLoading ? 'Lade…' : `${selectedCategory.label} auswählen…`} />
            </SelectTrigger>
            <SelectContent>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.label}
                </SelectItem>
              ))}
              {entities.length > 0 && <SelectSeparator />}
              <SelectItem value={NEW_ENTITY_VALUE}>
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  + Neues Objekt anlegen
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
