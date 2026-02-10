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
import { Input } from '@/components/ui/input';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Wrench, Zap, Paintbrush, Home, Square, Flame, ClipboardList, Building2, Package } from 'lucide-react';
import { useCreateServiceCase, ServiceCaseCategory } from '@/hooks/useServiceCases';

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
// Category Config
// ============================================================================
const CATEGORIES: { id: ServiceCaseCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sanitaer', label: 'Sanitär', icon: Wrench },
  { id: 'elektro', label: 'Elektro', icon: Zap },
  { id: 'maler', label: 'Maler', icon: Paintbrush },
  { id: 'dach', label: 'Dach', icon: Home },
  { id: 'fenster', label: 'Fenster', icon: Square },
  { id: 'heizung', label: 'Heizung', icon: Flame },
  { id: 'gutachter', label: 'Gutachter', icon: ClipboardList },
  { id: 'hausverwaltung', label: 'Hausverwaltung', icon: Building2 },
  { id: 'sonstige', label: 'Sonstige', icon: Package },
];

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
  
  // Form state
  const [propertyId, setPropertyId] = useState<string>(preselectedPropertyId || '');
  const [unitId, setUnitId] = useState<string>('');
  const [isWholeProperty, setIsWholeProperty] = useState(false);
  const [category, setCategory] = useState<ServiceCaseCategory | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPropertyId(preselectedPropertyId || '');
      setUnitId('');
      setIsWholeProperty(false);
      setCategory('');
      setTitle('');
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
  const { data: units, isLoading: unitsLoading } = useQuery({
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
    if (!propertyId || !category || !title.trim()) return;
    
    const result = await createMutation.mutateAsync({
      property_id: propertyId,
      unit_id: isWholeProperty ? null : unitId || null,
      category,
      title: title.trim(),
      description: description.trim() || undefined,
    });
    
    onOpenChange(false);
    if (onSuccess && result?.id) {
      onSuccess(result.id);
    }
  };
  
  const isValid = propertyId && category && title.trim().length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Neuen Sanierungsvorgang anlegen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine Ausschreibung für Sanitär, Elektro, Maler oder andere Gewerke.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">Objekt (Pflicht)</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
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
          
          {/* Unit Selection */}
          {propertyId && (
            <div className="space-y-2">
              <Label>Einheit</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="whole-property" 
                    checked={isWholeProperty}
                    onCheckedChange={(checked) => {
                      setIsWholeProperty(checked === true);
                      if (checked) setUnitId('');
                    }}
                  />
                  <label 
                    htmlFor="whole-property" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Gesamtes Objekt / keine spezifische Einheit
                  </label>
                </div>
                
                {!isWholeProperty && (
                  <Select value={unitId} onValueChange={setUnitId} disabled={unitsLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Einheit auswählen (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unitsLoading ? (
                        <SelectItem value="_loading" disabled>Laden...</SelectItem>
                      ) : units?.length === 0 ? (
                        <SelectItem value="_empty" disabled>Keine Einheiten vorhanden</SelectItem>
                      ) : (
                        units?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.code || u.unit_number}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
          
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Kategorie (Pflicht)</Label>
            <RadioGroup 
              value={category} 
              onValueChange={(val) => setCategory(val as ServiceCaseCategory)}
              className="grid grid-cols-3 gap-2"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id}>
                    <RadioGroupItem
                      value={cat.id}
                      id={`cat-${cat.id}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`cat-${cat.id}`}
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Icon className="mb-1 h-5 w-5" />
                      <span className="text-xs">{cat.label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel (Pflicht)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Badsanierung komplett"
              maxLength={100}
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Kurzbeschreibung (optional)</Label>
              <DictationButton onTranscript={(text) => setDescription(prev => prev + (prev ? ' ' : '') + text)} />
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Vorhabens..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Max. 500 Zeichen — wird später durch KI erweitert.
            </p>
          </div>
          
          {/* Info Notice */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Dieses System ist für <strong>Wohnungs- und Haussanierungen (Innenbereiche)</strong> konzipiert. 
              Komplette Gebäudesanierungen (Fassade, Dachstuhl MFH) sind nicht vorgesehen.
            </p>
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
            {createMutation.isPending ? 'Wird angelegt...' : 'Weiter zu Leistungsumfang →'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
