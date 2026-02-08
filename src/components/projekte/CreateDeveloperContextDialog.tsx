/**
 * Dialog for creating a new Developer Context (Verkäufer-Gesellschaft)
 * MOD-13 PROJEKTE
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useDeveloperContexts } from '@/hooks/useDeveloperContexts';
import { Building2, Loader2 } from 'lucide-react';
import type { ContextType } from '@/types/projekte';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LEGAL_FORMS = [
  { value: 'GmbH', label: 'GmbH' },
  { value: 'GmbH & Co. KG', label: 'GmbH & Co. KG' },
  { value: 'KG', label: 'KG' },
  { value: 'AG', label: 'AG' },
  { value: 'UG', label: 'UG (haftungsbeschränkt)' },
  { value: 'Einzelunternehmen', label: 'Einzelunternehmen' },
  { value: 'GbR', label: 'GbR' },
];

export function CreateDeveloperContextDialog({ open, onOpenChange, onSuccess }: Props) {
  const { createContext, contexts } = useDeveloperContexts();
  const [formData, setFormData] = useState({
    name: '',
    context_type: 'company' as ContextType,
    legal_form: '',
    hrb_number: '',
    ust_id: '',
    managing_director: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    is_default: contexts.length === 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createContext.mutateAsync(formData);
      onOpenChange(false);
      setFormData({
        name: '',
        context_type: 'company',
        legal_form: '',
        hrb_number: '',
        ust_id: '',
        managing_director: '',
        street: '',
        house_number: '',
        postal_code: '',
        city: '',
        is_default: false,
      });
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Neue Verkäufer-Gesellschaft
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Firmenname *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Musterbau GmbH"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="context_type">Typ</Label>
                <Select
                  value={formData.context_type}
                  onValueChange={(v) => setFormData({ ...formData, context_type: v as ContextType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Unternehmen</SelectItem>
                    <SelectItem value="private">Privatperson</SelectItem>
                    <SelectItem value="fund">Fonds/Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="legal_form">Rechtsform</Label>
                <Select
                  value={formData.legal_form}
                  onValueChange={(v) => setFormData({ ...formData, legal_form: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_FORMS.map((lf) => (
                      <SelectItem key={lf.value} value={lf.value}>
                        {lf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hrb_number">HRB-Nummer</Label>
                <Input
                  id="hrb_number"
                  value={formData.hrb_number}
                  onChange={(e) => setFormData({ ...formData, hrb_number: e.target.value })}
                  placeholder="z.B. HRB 12345"
                />
              </div>
              <div>
                <Label htmlFor="ust_id">USt-ID</Label>
                <Input
                  id="ust_id"
                  value={formData.ust_id}
                  onChange={(e) => setFormData({ ...formData, ust_id: e.target.value })}
                  placeholder="z.B. DE123456789"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="managing_director">Geschäftsführer</Label>
              <Input
                id="managing_director"
                value={formData.managing_director}
                onChange={(e) => setFormData({ ...formData, managing_director: e.target.value })}
                placeholder="Name des Geschäftsführers"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Adresse</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="street">Straße</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="house_number">Nr.</Label>
                <Input
                  id="house_number"
                  value={formData.house_number}
                  onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="postal_code">PLZ</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Default checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: !!checked })}
            />
            <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
              Als Standard-Kontext setzen
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createContext.isPending || !formData.name}>
              {createContext.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
