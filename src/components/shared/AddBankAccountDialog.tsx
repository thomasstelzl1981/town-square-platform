import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard } from 'lucide-react';

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BankAccountFormData {
  account_name: string;
  iban: string;
  bank_name: string;
  is_default: boolean;
  owner_type: string;
  owner_id: string;
}

const defaultFormData: BankAccountFormData = {
  account_name: '', iban: '', bank_name: '', is_default: false,
  owner_type: '', owner_id: '',
};

function validateIBAN(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
  return ibanRegex.test(cleanIban) && cleanIban.length >= 15 && cleanIban.length <= 34;
}

function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

const OWNER_TYPES = [
  { value: 'person', label: 'Person im Haushalt' },
  { value: 'property', label: 'Immobilie (Vermietung)' },
  { value: 'pv_plant', label: 'Photovoltaik-Anlage' },
];

export function AddBankAccountDialog({ open, onOpenChange }: AddBankAccountDialogProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const [formData, setFormData] = useState<BankAccountFormData>(defaultFormData);
  const [ibanError, setIbanError] = useState<string | null>(null);

  // Load owner options based on selected type
  const { data: ownerOptions = [] } = useQuery({
    queryKey: ['owner-options', activeTenantId, formData.owner_type],
    queryFn: async () => {
      if (!activeTenantId || !formData.owner_type) return [];
      if (formData.owner_type === 'person') {
        const { data } = await supabase.from('household_persons').select('id, first_name, last_name').eq('tenant_id', activeTenantId);
        return (data || []).map((p: any) => ({ id: p.id, label: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Person' }));
      }
      if (formData.owner_type === 'property') {
        const { data } = await supabase.from('properties').select('id, name').eq('tenant_id', activeTenantId);
        return (data || []).map((p: any) => ({ id: p.id, label: p.name || 'Immobilie' }));
      }
      if (formData.owner_type === 'pv_plant') {
        const { data } = await supabase.from('pv_plants').select('id, name').eq('tenant_id', activeTenantId);
        return (data || []).map((p: any) => ({ id: p.id, label: p.name || 'PV-Anlage' }));
      }
      return [];
    },
    enabled: !!activeTenantId && !!formData.owner_type,
  });

  const createAccount = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      const cleanIban = data.iban.replace(/\s/g, '').toUpperCase();

      if (data.is_default) {
        await supabase.from('msv_bank_accounts').update({ is_default: false }).eq('tenant_id', activeTenantId);
      }

      const { error } = await supabase.from('msv_bank_accounts').insert({
        tenant_id: activeTenantId,
        account_name: data.account_name,
        iban: cleanIban,
        bank_name: data.bank_name || null,
        is_default: data.is_default,
        status: 'pending',
        owner_type: data.owner_type || null,
        owner_id: data.owner_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bankkonto hinzugefügt');
      queryClient.invalidateQueries({ queryKey: ['msv-bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['msv_bank_accounts'] });
      setFormData(defaultFormData);
      setIbanError(null);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Fehler beim Hinzufügen: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name.trim()) { toast.error('Bitte geben Sie einen Kontonamen ein'); return; }
    if (!validateIBAN(formData.iban)) { setIbanError('Ungültiges IBAN-Format'); return; }
    setIbanError(null);
    createAccount.mutate(formData);
  };

  const handleIbanChange = (value: string) => {
    const formatted = formatIBAN(value);
    setFormData(prev => ({ ...prev, iban: formatted }));
    if (value.replace(/\s/g, '').length >= 15) {
      setIbanError(!validateIBAN(value) ? 'Ungültiges IBAN-Format' : null);
    } else {
      setIbanError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bankkonto hinzufügen
          </DialogTitle>
          <DialogDescription>
            Fügen Sie ein Konto hinzu und ordnen Sie es einem Inhaber zu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_name">Kontobezeichnung *</Label>
            <Input id="account_name" placeholder="z.B. Mietkonto Haupthaus"
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN *</Label>
            <Input id="iban" placeholder="DE89 3704 0044 0532 0130 00"
              value={formData.iban}
              onChange={(e) => handleIbanChange(e.target.value)}
              className={ibanError ? 'border-destructive' : ''} />
            {ibanError && <p className="text-xs text-destructive">{ibanError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank</Label>
            <Input id="bank_name" placeholder="z.B. Commerzbank"
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))} />
          </div>

          {/* Zuordnung */}
          <div className="space-y-2">
            <Label>Zuordnung</Label>
            <Select value={formData.owner_type} onValueChange={(v) => setFormData(prev => ({ ...prev, owner_type: v, owner_id: '' }))}>
              <SelectTrigger><SelectValue placeholder="Zuordnung wählen…" /></SelectTrigger>
              <SelectContent>
                {OWNER_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.owner_type && ownerOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Inhaber</Label>
              <Select value={formData.owner_id} onValueChange={(v) => setFormData(prev => ({ ...prev, owner_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Bitte wählen…" /></SelectTrigger>
                <SelectContent>
                  {ownerOptions.map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.owner_type && ownerOptions.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Keine {OWNER_TYPES.find(t => t.value === formData.owner_type)?.label || 'Einträge'} vorhanden. Bitte zuerst anlegen.
            </p>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="is_default" className="cursor-pointer">Als Standard setzen</Label>
              <p className="text-xs text-muted-foreground">Wird für neue Mietverhältnisse verwendet</p>
            </div>
            <Switch id="is_default" checked={formData.is_default}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={createAccount.isPending}>
              {createAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Konto hinzufügen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
