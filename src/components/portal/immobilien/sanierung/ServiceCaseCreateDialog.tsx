import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DictationButton } from '@/components/shared/DictationButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { useCreateServiceCase } from '@/hooks/useServiceCases';

// ============================================================================
// Types
// ============================================================================
interface ServiceCaseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (caseId: string) => void;
  preselectedPropertyId?: string;
}

interface PropertyOption {
  id: string;
  address: string;
  city: string;
  code: string | null;
}

interface UnitOption {
  id: string;
  unit_number: string;
  code: string | null;
}

// ============================================================================
// Component
// ============================================================================
export function ServiceCaseCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedPropertyId,
}: ServiceCaseCreateDialogProps) {
  const { activeTenantId } = useAuth();
  const createMutation = useCreateServiceCase();
  
  // Form state — simplified: no category, no title
  const [propertyId, setPropertyId] = useState<string>(preselectedPropertyId || '');
  const [unitId, setUnitId] = useState<string>('__whole__');
  const [description, setDescription] = useState('');
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPropertyId(preselectedPropertyId || '');
      setUnitId('__whole__');
      setDescription('');
    }
  }, [open, preselectedPropertyId]);
  
  // Fetch properties
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties_for_sanierung', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, code')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('address');
      if (error) throw error;
      return data as PropertyOption[];
    },
    enabled: !!activeTenantId && open,
  });
  
  // Fetch units for selected property
  const { data: units } = useQuery({
    queryKey: ['units_for_sanierung', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, code')
        .eq('property_id', propertyId)
        .order('unit_number');
      if (error) throw error;
      return data as UnitOption[];
    },
    enabled: !!propertyId && open,
  });
  
  const handleSubmit = async () => {
    if (!propertyId || !description.trim()) return;
    
    // Generate title from description (first ~60 chars)
    const autoTitle = description.trim().length > 60
      ? description.trim().substring(0, 57) + '...'
      : description.trim();
    
    const result = await createMutation.mutateAsync({
      property_id: propertyId,
      unit_id: unitId === '__whole__' ? null : unitId || null,
      category: 'sonstige' as const,
      title: autoTitle,
      description: description.trim(),
    });
    
    onOpenChange(false);
    if (onSuccess && result?.id) {
      onSuccess(result.id);
    }
  };
  
  const isValid = propertyId && description.trim().length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sanierung starten</DialogTitle>
          <DialogDescription>
            Beschreiben Sie Ihr Vorhaben — die KI erstellt daraus ein strukturiertes Leistungsverzeichnis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Property Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="property">Objekt</Label>
            <Select value={propertyId} onValueChange={(val) => {
              setPropertyId(val);
              setUnitId('__whole__');
            }}>
              <SelectTrigger id="property">
                <SelectValue placeholder="Objekt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {propertiesLoading ? (
                  <SelectItem value="_loading" disabled>Laden...</SelectItem>
                ) : properties?.length === 0 ? (
                  <SelectItem value="_empty" disabled>Keine Objekte vorhanden</SelectItem>
                ) : (
                  properties?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `${p.code} — ` : ''}{p.address}, {p.city}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Unit Selection — simplified dropdown */}
          {propertyId && (
            <div className="space-y-1.5">
              <Label>Einheit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__whole__">Gesamtes Objekt</SelectItem>
                  {units?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.code || u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Description — main field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Was soll gemacht werden?</Label>
              <DictationButton onTranscript={(text) => setDescription(prev => prev + (prev ? ' ' : '') + text)} />
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie, was saniert werden soll. z.B.: Komplettes Bad erneuern, neue Fliesen, Dusche statt Badewanne, neue Armaturen. Böden im Flur und Wohnzimmer erneuern (Vinyl). Malerarbeiten alle Räume."
              rows={5}
              className="resize-none"
            />
          </div>
          
          {/* AI Hint */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span>Die KI erstellt aus Ihrer Beschreibung ein strukturiertes Leistungsverzeichnis mit Kostenschätzung.</span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? 'Wird angelegt...' : 'Weiter →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
