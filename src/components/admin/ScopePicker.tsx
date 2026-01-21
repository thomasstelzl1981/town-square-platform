import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Definierte Scopes basierend auf ADR-019
const AVAILABLE_SCOPES = [
  // Listings
  { value: 'view_listings', label: 'Listings anzeigen', category: 'Immobilien' },
  { value: 'manage_listings', label: 'Listings verwalten', category: 'Immobilien' },
  { value: 'create_listings', label: 'Listings erstellen', category: 'Immobilien' },
  
  // Contacts
  { value: 'view_contacts', label: 'Kontakte anzeigen', category: 'Kontakte' },
  { value: 'manage_contacts', label: 'Kontakte verwalten', category: 'Kontakte' },
  { value: 'create_contacts', label: 'Kontakte erstellen', category: 'Kontakte' },
  
  // Reservations
  { value: 'view_reservations', label: 'Reservierungen anzeigen', category: 'Vertrieb' },
  { value: 'create_reservations', label: 'Reservierungen erstellen', category: 'Vertrieb' },
  { value: 'manage_reservations', label: 'Reservierungen verwalten', category: 'Vertrieb' },
  
  // Finance
  { value: 'view_finance_packages', label: 'Finanzpakete anzeigen', category: 'Finanzierung' },
  { value: 'create_finance_packages', label: 'Finanzpakete erstellen', category: 'Finanzierung' },
  { value: 'manage_finance_packages', label: 'Finanzpakete verwalten', category: 'Finanzierung' },
  
  // Documents
  { value: 'view_documents', label: 'Dokumente anzeigen', category: 'Dokumente' },
  { value: 'create_documents', label: 'Dokumente hochladen', category: 'Dokumente' },
  { value: 'manage_documents', label: 'Dokumente verwalten', category: 'Dokumente' },
  
  // Leases
  { value: 'view_leases', label: 'Mietverträge anzeigen', category: 'Vermietung' },
  { value: 'create_leases', label: 'Mietverträge erstellen', category: 'Vermietung' },
  { value: 'manage_leases', label: 'Mietverträge verwalten', category: 'Vermietung' },
  
  // Commissions
  { value: 'view_commissions', label: 'Provisionen anzeigen', category: 'Finanzen' },
  { value: 'manage_commissions', label: 'Provisionen verwalten', category: 'Finanzen' },
];

// Kategorien gruppieren
const SCOPE_CATEGORIES = [...new Set(AVAILABLE_SCOPES.map(s => s.category))];

interface ScopePickerProps {
  value: string[];
  onChange: (scopes: string[]) => void;
  disabled?: boolean;
}

export function ScopePicker({ value, onChange, disabled = false }: ScopePickerProps) {
  const toggleScope = (scope: string) => {
    if (value.includes(scope)) {
      onChange(value.filter(s => s !== scope));
    } else {
      onChange([...value, scope]);
    }
  };

  const toggleCategory = (category: string) => {
    const categoryScopes = AVAILABLE_SCOPES
      .filter(s => s.category === category)
      .map(s => s.value);
    
    const allSelected = categoryScopes.every(s => value.includes(s));
    
    if (allSelected) {
      onChange(value.filter(s => !categoryScopes.includes(s)));
    } else {
      const newScopes = [...new Set([...value, ...categoryScopes])];
      onChange(newScopes);
    }
  };

  const selectAll = () => {
    onChange(AVAILABLE_SCOPES.map(s => s.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {value.length} von {AVAILABLE_SCOPES.length} Berechtigungen ausgewählt
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            Alle
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            Keine
          </button>
        </div>
      </div>

      <ScrollArea className="h-[300px] border rounded-md p-4">
        <div className="space-y-6">
          {SCOPE_CATEGORIES.map(category => {
            const categoryScopes = AVAILABLE_SCOPES.filter(s => s.category === category);
            const selectedCount = categoryScopes.filter(s => value.includes(s.value)).length;
            const allSelected = selectedCount === categoryScopes.length;
            const someSelected = selectedCount > 0 && selectedCount < categoryScopes.length;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={allSelected}
                    onCheckedChange={() => toggleCategory(category)}
                    disabled={disabled}
                    className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                  <Label 
                    htmlFor={`category-${category}`}
                    className="font-semibold cursor-pointer"
                  >
                    {category}
                  </Label>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {selectedCount}/{categoryScopes.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-2 ml-6">
                  {categoryScopes.map(scope => (
                    <div key={scope.value} className="flex items-center gap-2">
                      <Checkbox
                        id={scope.value}
                        checked={value.includes(scope.value)}
                        onCheckedChange={() => toggleScope(scope.value)}
                        disabled={disabled}
                      />
                      <Label 
                        htmlFor={scope.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {scope.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 5).map(scope => (
            <Badge key={scope} variant="secondary" className="text-xs">
              {AVAILABLE_SCOPES.find(s => s.value === scope)?.label || scope}
            </Badge>
          ))}
          {value.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 5} weitere
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export { AVAILABLE_SCOPES };
