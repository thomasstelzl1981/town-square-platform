import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';

interface RentalListingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: {
    id: string;
    property_id: string;
    unit_id: string | null;
    cold_rent: number | null;
    utilities_estimate: number | null;
    deposit_months?: number;
    available_from: string | null;
    minimum_term_months?: number;
    pets_allowed?: boolean;
    description?: string;
  } | null;
  onSuccess: () => void;
}

export function RentalListingWizard({ 
  open, 
  onOpenChange, 
  listing,
  onSuccess 
}: RentalListingWizardProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    cold_rent: '',
    utilities_estimate: '',
    deposit_months: '2',
    available_from: '',
    minimum_term_months: '',
    pets_allowed: false,
    description: ''
  });

  // Reset form when listing changes
  useEffect(() => {
    if (listing) {
      setFormData({
        property_id: listing.property_id || '',
        unit_id: listing.unit_id || '',
        cold_rent: listing.cold_rent?.toString() || '',
        utilities_estimate: listing.utilities_estimate?.toString() || '',
        deposit_months: listing.deposit_months?.toString() || '2',
        available_from: listing.available_from || '',
        minimum_term_months: listing.minimum_term_months?.toString() || '',
        pets_allowed: listing.pets_allowed || false,
        description: listing.description || ''
      });
    } else {
      setFormData({
        property_id: '',
        unit_id: '',
        cold_rent: '',
        utilities_estimate: '',
        deposit_months: '2',
        available_from: '',
        minimum_term_months: '',
        pets_allowed: false,
        description: ''
      });
    }
  }, [listing, open]);

  // Fetch properties for selection
  const { data: properties } = useQuery({
    queryKey: ['properties-for-rental'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, code, tenant_id')
        .order('address');
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Fetch units for selected property
  const { data: units } = useQuery({
    queryKey: ['units-for-property', formData.property_id],
    queryFn: async () => {
      if (!formData.property_id) return [];
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, area_sqm')
        .eq('property_id', formData.property_id)
        .order('unit_number');
      if (error) throw error;
      return data || [];
    },
    enabled: !!formData.property_id && open
  });

  const handleSubmit = async () => {
    if (!formData.property_id) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie ein Objekt aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get tenant_id from property
      const property = properties?.find(p => p.id === formData.property_id);
      if (!property) throw new Error('Property not found');

      const payload = {
        tenant_id: property.tenant_id,
        property_id: formData.property_id,
        unit_id: formData.unit_id || null,
        cold_rent: formData.cold_rent ? parseFloat(formData.cold_rent) : null,
        utilities_estimate: formData.utilities_estimate ? parseFloat(formData.utilities_estimate) : null,
        deposit_months: parseInt(formData.deposit_months) || 2,
        available_from: formData.available_from || null,
        minimum_term_months: formData.minimum_term_months ? parseInt(formData.minimum_term_months) : null,
        pets_allowed: formData.pets_allowed,
        description: formData.description || null,
        status: 'draft' as const
      };

      if (listing?.id) {
        // Update existing
        const { error } = await supabase
          .from('rental_listings')
          .update(payload)
          .eq('id', listing.id);
        if (error) throw error;
        toast({ title: 'Vermietungsexposé aktualisiert' });
      } else {
        // Create new
        const { error } = await supabase
          .from('rental_listings')
          .insert(payload);
        if (error) throw error;
        toast({ title: 'Vermietungsexposé erstellt' });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const warmMiete = (parseFloat(formData.cold_rent) || 0) + (parseFloat(formData.utilities_estimate) || 0);

  const handleGenerateDescription = async () => {
    if (!formData.property_id) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie zuerst ein Objekt aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsGeneratingDescription(true);
    try {
      // Fetch property data for AI
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('address, city, postal_code, property_type, year_built, total_area_sqm, heating_type, energy_source, renovation_year, description')
        .eq('id', formData.property_id)
        .single();
      
      if (propError) throw propError;
      if (!property) throw new Error('Property not found');
      
      const { data, error } = await supabase.functions.invoke('sot-expose-description', {
        body: { property }
      });
      
      if (error) throw error;
      
      if (data?.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        toast({ title: 'Beschreibung generiert' });
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast({
        title: 'Fehler bei KI-Generierung',
        description: error.message || 'Unbekannter Fehler',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {listing ? 'Vermietungsexposé bearbeiten' : 'Neues Vermietungsexposé'}
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie ein Exposé für die Vermietung auf Scout24 oder Kleinanzeigen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label>Objekt *</Label>
            <Select
              value={formData.property_id}
              onValueChange={(v) => setFormData({ ...formData, property_id: v, unit_id: '' })}
              disabled={!!listing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Objekt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {properties?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code ? `${p.code} - ` : ''}{p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Selection */}
          {units && units.length > 1 && (
            <div className="space-y-2">
              <Label>Einheit</Label>
              <Select
                value={formData.unit_id}
                onValueChange={(v) => setFormData({ ...formData, unit_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Einheit auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_number} ({u.area_sqm} m²)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rent */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kaltmiete (€)</Label>
              <Input
                type="number"
                placeholder="850"
                value={formData.cold_rent}
                onChange={(e) => setFormData({ ...formData, cold_rent: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nebenkosten (€)</Label>
              <Input
                type="number"
                placeholder="150"
                value={formData.utilities_estimate}
                onChange={(e) => setFormData({ ...formData, utilities_estimate: e.target.value })}
              />
            </div>
          </div>

          {warmMiete > 0 && (
            <div className="text-sm text-muted-foreground">
              Warmmiete: <span className="font-semibold text-foreground">{warmMiete.toLocaleString('de-DE')} €</span>
            </div>
          )}

          {/* Deposit & Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kaution (Monatsmieten)</Label>
              <Select
                value={formData.deposit_months}
                onValueChange={(v) => setFormData({ ...formData, deposit_months: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} Monatsmiete{n > 1 ? 'n' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verfügbar ab</Label>
              <Input
                type="date"
                value={formData.available_from}
                onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
              />
            </div>
          </div>

          {/* Pets */}
          <div className="flex items-center justify-between py-2">
            <Label>Haustiere erlaubt</Label>
            <Switch
              checked={formData.pets_allowed}
              onCheckedChange={(v) => setFormData({ ...formData, pets_allowed: v })}
            />
          </div>

          {/* Description with AI Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Beschreibung</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription || !formData.property_id}
              >
                {isGeneratingDescription ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Mit KI generieren
              </Button>
            </div>
            <Textarea
              placeholder="Beschreiben Sie das Mietobjekt..."
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Channel hint */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <p className="font-medium">Veröffentlichungskanäle:</p>
            <ul className="text-muted-foreground text-xs list-disc ml-4">
              <li>ImmobilienScout24 — direkte API-Anbindung</li>
              <li>Kleinanzeigen — manueller Export (CSV/XML)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {listing ? 'Speichern' : 'Erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
