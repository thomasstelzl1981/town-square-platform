/**
 * EntityLinker — Link properties and contacts to an Armstrong project
 * Displays linked entity badges with remove, and a combobox to add new ones.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Users, Plus, X, Link2 } from 'lucide-react';

interface EntityLinkerProps {
  linkedEntities: Record<string, string[]>;
  onEntitiesChange: (entities: Record<string, string[]>) => void;
}

interface EntityOption {
  id: string;
  label: string;
}

export function EntityLinker({ linkedEntities, onEntitiesChange }: EntityLinkerProps) {
  const { activeTenantId } = useAuth();
  const [addingType, setAddingType] = useState<'properties' | 'contacts' | null>(null);
  const [propertyOptions, setPropertyOptions] = useState<EntityOption[]>([]);
  const [contactOptions, setContactOptions] = useState<EntityOption[]>([]);

  // Load available entities when adding mode is activated
  useEffect(() => {
    if (!activeTenantId || !addingType) return;

    if (addingType === 'properties') {
      supabase
        .from('properties')
        .select('id, address, city, property_type')
        .eq('tenant_id', activeTenantId)
        .order('address')
        .limit(50)
        .then(({ data }) => {
          setPropertyOptions(
            (data || []).map(p => ({
              id: p.id,
              label: [p.address, p.city].filter(Boolean).join(', ') || p.property_type || p.id.slice(0, 8),
            }))
          );
        });
    }

    if (addingType === 'contacts') {
      supabase
        .from('contacts')
        .select('id, first_name, last_name, company')
        .eq('tenant_id', activeTenantId)
        .order('last_name')
        .limit(50)
        .then(({ data }) => {
          setContactOptions(
            (data || []).map(c => ({
              id: c.id,
              label: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.company || c.id.slice(0, 8),
            }))
          );
        });
    }
  }, [addingType, activeTenantId]);

  const handleAdd = (type: 'properties' | 'contacts', entityId: string) => {
    const current = linkedEntities[type] || [];
    if (current.includes(entityId)) return;
    onEntitiesChange({
      ...linkedEntities,
      [type]: [...current, entityId],
    });
    setAddingType(null);
  };

  const handleRemove = (type: string, entityId: string) => {
    const current = linkedEntities[type] || [];
    onEntitiesChange({
      ...linkedEntities,
      [type]: current.filter(id => id !== entityId),
    });
  };

  const allProperties = linkedEntities.properties || [];
  const allContacts = linkedEntities.contacts || [];
  const hasAny = allProperties.length > 0 || allContacts.length > 0;

  const availableProperties = propertyOptions.filter(p => !allProperties.includes(p.id));
  const availableContacts = contactOptions.filter(c => !allContacts.includes(c.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Link2 className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Verknüpfungen</span>
        </div>
        {!addingType && (
          <div className="flex gap-0.5">
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px]" onClick={() => setAddingType('properties')}>
              <Building2 className="h-3 w-3 mr-0.5" /> +
            </Button>
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px]" onClick={() => setAddingType('contacts')}>
              <Users className="h-3 w-3 mr-0.5" /> +
            </Button>
          </div>
        )}
      </div>

      {/* Add entity dropdown */}
      {addingType && (
        <div className="mb-2 flex items-center gap-1">
          <Select onValueChange={(v) => handleAdd(addingType, v)}>
            <SelectTrigger className="h-6 text-[10px] flex-1">
              <SelectValue placeholder={addingType === 'properties' ? 'Immobilie wählen...' : 'Kontakt wählen...'} />
            </SelectTrigger>
            <SelectContent>
              {(addingType === 'properties' ? availableProperties : availableContacts).map(opt => (
                <SelectItem key={opt.id} value={opt.id} className="text-xs">{opt.label}</SelectItem>
              ))}
              {(addingType === 'properties' ? availableProperties : availableContacts).length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">Keine verfügbar</div>
              )}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setAddingType(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Linked entities */}
      {!hasAny && !addingType && (
        <p className="text-[11px] text-muted-foreground px-2">Keine Verknüpfungen. Nutze die Buttons oben.</p>
      )}

      {allProperties.length > 0 && (
        <div className="space-y-0.5 mb-1">
          {allProperties.map(id => {
            const opt = propertyOptions.find(p => p.id === id);
            return (
              <div key={id} className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 text-[11px]">
                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{opt?.label || id.slice(0, 8)}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove('properties', id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {allContacts.length > 0 && (
        <div className="space-y-0.5">
          {allContacts.map(id => {
            const opt = contactOptions.find(c => c.id === id);
            return (
              <div key={id} className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 text-[11px]">
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{opt?.label || id.slice(0, 8)}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove('contacts', id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
