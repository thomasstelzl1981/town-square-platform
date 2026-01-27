import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Building2, User } from 'lucide-react';

interface CreateContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContextFormData {
  name: string;
  context_type: 'PRIVATE' | 'BUSINESS';
  tax_regime: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  hrb_number: string;
  ust_id: string;
  legal_form: string;
}

const defaultFormData: ContextFormData = {
  name: '',
  context_type: 'BUSINESS',
  tax_regime: 'FIBU',
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
  hrb_number: '',
  ust_id: '',
  legal_form: 'GmbH',
};

export function CreateContextDialog({ open, onOpenChange }: CreateContextDialogProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const [formData, setFormData] = useState<ContextFormData>(defaultFormData);

  const createContext = useMutation({
    mutationFn: async (data: ContextFormData) => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      
      const { error } = await supabase.from('landlord_contexts').insert({
        tenant_id: activeTenantId,
        name: data.name,
        context_type: data.context_type,
        tax_regime: data.tax_regime,
        street: data.street || null,
        house_number: data.house_number || null,
        postal_code: data.postal_code || null,
        city: data.city || null,
        hrb_number: data.context_type === 'BUSINESS' ? data.hrb_number || null : null,
        ust_id: data.context_type === 'BUSINESS' ? data.ust_id || null : null,
        legal_form: data.context_type === 'BUSINESS' ? data.legal_form || null : null,
        is_default: false,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontext erfolgreich angelegt');
      queryClient.invalidateQueries({ queryKey: ['landlord-contexts'] });
      queryClient.invalidateQueries({ queryKey: ['sender-contexts'] });
      setFormData(defaultFormData);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Fehler beim Anlegen: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }
    createContext.mutate(formData);
  };

  const updateField = <K extends keyof ContextFormData>(field: K, value: ContextFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neuen Kontext anlegen</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Vermieter-Kontext für die steuerliche oder organisatorische Trennung.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="z.B. Muster Immobilien GmbH"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          {/* Typ */}
          <div className="space-y-3">
            <Label>Typ</Label>
            <RadioGroup
              value={formData.context_type}
              onValueChange={(v) => updateField('context_type', v as 'PRIVATE' | 'BUSINESS')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PRIVATE" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer font-normal">
                  <User className="h-4 w-4" />
                  Privat
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BUSINESS" id="business" />
                <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Building2 className="h-4 w-4" />
                  Geschäftlich
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Steuerregime */}
          <div className="space-y-2">
            <Label>Steuerregime</Label>
            <Select
              value={formData.tax_regime}
              onValueChange={(v) => updateField('tax_regime', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EÜR">EÜR (Einnahmen-Überschuss-Rechnung)</SelectItem>
                <SelectItem value="FIBU">FIBU (Finanzbuchhaltung)</SelectItem>
                <SelectItem value="VERMÖGENSVERWALTUNG">Vermögensverwaltung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Adresse für Briefkopf */}
          <div className="space-y-2">
            <Label>Adresse (für Briefkopf)</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Straße"
                value={formData.street}
                onChange={(e) => updateField('street', e.target.value)}
                className="col-span-3"
              />
              <Input
                placeholder="Nr."
                value={formData.house_number}
                onChange={(e) => updateField('house_number', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="PLZ"
                value={formData.postal_code}
                onChange={(e) => updateField('postal_code', e.target.value)}
              />
              <Input
                placeholder="Ort"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Business-spezifische Felder */}
          {formData.context_type === 'BUSINESS' && (
            <div className="space-y-4 pt-2 border-t">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Geschäftliche Angaben
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legal_form">Rechtsform</Label>
                  <Select
                    value={formData.legal_form}
                    onValueChange={(v) => updateField('legal_form', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GmbH">GmbH</SelectItem>
                      <SelectItem value="UG">UG (haftungsbeschränkt)</SelectItem>
                      <SelectItem value="GmbH & Co. KG">GmbH & Co. KG</SelectItem>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="OHG">OHG</SelectItem>
                      <SelectItem value="AG">AG</SelectItem>
                      <SelectItem value="e.K.">e.K.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hrb">HRB-Nummer</Label>
                  <Input
                    id="hrb"
                    placeholder="z.B. HRB 12345 B"
                    value={formData.hrb_number}
                    onChange={(e) => updateField('hrb_number', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ust">USt-IdNr.</Label>
                <Input
                  id="ust"
                  placeholder="z.B. DE123456789"
                  value={formData.ust_id}
                  onChange={(e) => updateField('ust_id', e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createContext.isPending}>
              {createContext.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kontext anlegen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
