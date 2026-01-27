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
import { Switch } from '@/components/ui/switch';
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
}

const defaultFormData: BankAccountFormData = {
  account_name: '',
  iban: '',
  bank_name: '',
  is_default: false,
};

// Simple IBAN validation (basic format check)
function validateIBAN(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  // German IBAN: DE + 2 check digits + 8 digit bank code + 10 digit account number = 22 chars
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
  return ibanRegex.test(cleanIban) && cleanIban.length >= 15 && cleanIban.length <= 34;
}

// Format IBAN with spaces for display
function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

export function AddBankAccountDialog({ open, onOpenChange }: AddBankAccountDialogProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const [formData, setFormData] = useState<BankAccountFormData>(defaultFormData);
  const [ibanError, setIbanError] = useState<string | null>(null);

  const createAccount = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      
      const cleanIban = data.iban.replace(/\s/g, '').toUpperCase();
      
      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from('msv_bank_accounts')
          .update({ is_default: false })
          .eq('tenant_id', activeTenantId);
      }
      
      const { error } = await supabase.from('msv_bank_accounts').insert({
        tenant_id: activeTenantId,
        account_name: data.account_name,
        iban: cleanIban,
        bank_name: data.bank_name || null,
        is_default: data.is_default,
        status: 'pending', // Will be 'connected' after FinAPI integration
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bankkonto hinzugefügt');
      queryClient.invalidateQueries({ queryKey: ['msv-bank-accounts'] });
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
    
    if (!formData.account_name.trim()) {
      toast.error('Bitte geben Sie einen Kontonamen ein');
      return;
    }
    
    if (!validateIBAN(formData.iban)) {
      setIbanError('Ungültiges IBAN-Format');
      return;
    }
    
    setIbanError(null);
    createAccount.mutate(formData);
  };

  const handleIbanChange = (value: string) => {
    const formatted = formatIBAN(value);
    setFormData(prev => ({ ...prev, iban: formatted }));
    
    if (value.replace(/\s/g, '').length >= 15) {
      if (!validateIBAN(value)) {
        setIbanError('Ungültiges IBAN-Format');
      } else {
        setIbanError(null);
      }
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
            Fügen Sie ein Mietkonto für die automatische Zahlungserkennung hinzu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_name">Kontobezeichnung *</Label>
            <Input
              id="account_name"
              placeholder="z.B. Mietkonto Haupthaus"
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN *</Label>
            <Input
              id="iban"
              placeholder="DE89 3704 0044 0532 0130 00"
              value={formData.iban}
              onChange={(e) => handleIbanChange(e.target.value)}
              className={ibanError ? 'border-destructive' : ''}
            />
            {ibanError && (
              <p className="text-xs text-destructive">{ibanError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank</Label>
            <Input
              id="bank_name"
              placeholder="z.B. Commerzbank"
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="is_default" className="cursor-pointer">Als Standard setzen</Label>
              <p className="text-xs text-muted-foreground">
                Wird für neue Mietverhältnisse verwendet
              </p>
            </div>
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Hinweis zur FinAPI-Integration</p>
            <p>
              Nach dem Hinzufügen können Sie das Konto über FinAPI verbinden, 
              um automatische Transaktionserkennung zu aktivieren.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
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
