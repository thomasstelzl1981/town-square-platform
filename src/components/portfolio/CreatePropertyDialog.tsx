import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const PROPERTY_TYPES = ['ETW', 'MFH', 'DHH', 'RH', 'EFH', 'Gewerbe', 'Grundstück'];

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePropertyDialog({ open, onOpenChange }: CreatePropertyDialogProps) {
  const navigate = useNavigate();
  const { activeOrganization } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    address: '',
    property_type: 'ETW',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeOrganization) {
      toast.error('Keine Organisation ausgewählt');
      return;
    }

    if (!formData.city || !formData.address) {
      toast.error('Ort und Adresse sind Pflichtfelder');
      return;
    }

    setSaving(true);

    try {
      // Minimal INSERT - triggers handle Unit + Storage folders
      const { data, error } = await supabase
        .from('properties')
        .insert({
          tenant_id: activeOrganization.id,
          city: formData.city,
          address: formData.address,
          property_type: formData.property_type,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Auto-create inbox sort container for this property
      try {
        const addressParts = [formData.address, formData.city].filter(Boolean);
        const keywords = addressParts.flatMap(p => p.split(/[\s,]+/).filter(w => w.length > 2));

        const { data: container } = await supabase
          .from('inbox_sort_containers')
          .insert({
            tenant_id: activeOrganization.id,
            name: `${formData.address}, ${formData.city}`,
            is_enabled: true,
            property_id: data.id,
          } as any)
          .select('id')
          .single();

        if (container?.id && keywords.length > 0) {
          await supabase.from('inbox_sort_rules').insert({
            container_id: container.id,
            field: 'subject',
            operator: 'contains',
            keywords_json: keywords,
          } as any);
        }
      } catch (sortErr) {
        // Non-critical — don't block property creation
        console.warn('Auto-Sortierkachel konnte nicht erstellt werden:', sortErr);
      }

      toast.success('Immobilie angelegt – Akte wird geöffnet');
      onOpenChange(false);
      
      // Reset form
      setFormData({ city: '', address: '', property_type: 'ETW' });
      
      // Navigate to the new property's dossier
      navigate(`/portal/immobilien/${data.id}`);
    } catch (err: unknown) {
      console.error('Create property error:', err);
      toast.error(err instanceof Error ? err.message : String(err) || 'Fehler beim Anlegen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Neue Immobilie anlegen
          </DialogTitle>
          <DialogDescription>
            Geben Sie die Basisdaten ein. Alle weiteren Details können Sie in der Immobilienakte ergänzen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ort *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="z.B. Berlin"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="z.B. Musterstraße 42"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="property_type">Objektart *</Label>
            <Select
              value={formData.property_type}
              onValueChange={(v) => handleChange('property_type', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird angelegt...
                </>
              ) : (
                'Anlegen & zur Akte'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
