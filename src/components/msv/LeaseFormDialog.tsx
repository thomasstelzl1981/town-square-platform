import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

interface LeaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: any;
}

export const LeaseFormDialog = ({ open, onOpenChange, unit }: LeaseFormDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    tenant_first_name: '',
    tenant_last_name: '',
    tenant_email: '',
    monthly_rent: '',
    start_date: new Date().toISOString().split('T')[0],
    deposit_amount: ''
  });

  const createLease = useMutation({
    mutationFn: async () => {
      // First create contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          tenant_id: unit?.tenant_id,
          first_name: formData.tenant_first_name,
          last_name: formData.tenant_last_name,
          email: formData.tenant_email,
          public_id: `K-${Date.now()}`
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Then create lease
      const { error: leaseError } = await supabase
        .from('leases')
        .insert({
          tenant_id: unit?.tenant_id,
          unit_id: unit?.id,
          tenant_contact_id: contact.id,
          monthly_rent: parseFloat(formData.monthly_rent),
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
          start_date: formData.start_date,
          status: 'active'
        });

      if (leaseError) throw leaseError;
    },
    onSuccess: () => {
      toast.success('Mietvertrag angelegt');
      queryClient.invalidateQueries({ queryKey: ['msv-units-list'] });
      onOpenChange(false);
      setFormData({
        tenant_first_name: '',
        tenant_last_name: '',
        tenant_email: '',
        monthly_rent: '',
        start_date: new Date().toISOString().split('T')[0],
        deposit_amount: ''
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Fehler beim Anlegen');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mietvertrag anlegen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {unit && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{unit.properties?.address}</p>
              <p className="text-muted-foreground">Einheit: {unit.unit_number}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Vorname</Label>
              <Input
                id="first_name"
                value={formData.tenant_first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, tenant_first_name: e.target.value }))}
                placeholder="Max"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nachname</Label>
              <Input
                id="last_name"
                value={formData.tenant_last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, tenant_last_name: e.target.value }))}
                placeholder="Mustermann"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.tenant_email}
              onChange={(e) => setFormData(prev => ({ ...prev, tenant_email: e.target.value }))}
              placeholder="max@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent">Monatsmiete (€)</Label>
              <Input
                id="rent"
                type="number"
                value={formData.monthly_rent}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_rent: e.target.value }))}
                placeholder="850"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Kaution (€)</Label>
              <Input
                id="deposit"
                type="number"
                value={formData.deposit_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                placeholder="2550"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start">Mietbeginn</Label>
            <Input
              id="start"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => createLease.mutate()}
            disabled={!formData.tenant_first_name || !formData.monthly_rent}
          >
            Mietvertrag anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
