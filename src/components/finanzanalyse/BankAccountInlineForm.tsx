/**
 * BankAccountInlineForm — Inline create/edit form for bank accounts
 * Replaces the former AddBankAccountDialog (AES-compliant)
 */
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRecordCardDMS } from '@/hooks/useRecordCardDMS';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard } from 'lucide-react';

interface BankAccountInlineFormProps {
  onClose: () => void;
}

interface BankAccountFormData {
  account_name: string;
  iban: string;
  bank_name: string;
  is_default: boolean;
  owner_type: string;
  owner_id: string;
}

interface OwnerOption {
  id: string;
  label: string;
  type: 'person' | 'property' | 'pv_plant';
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

function encodeOwnerValue(type: string, id: string) {
  return `${type}::${id}`;
}

function decodeOwnerValue(val: string): { type: string; id: string } {
  const [type, id] = val.split('::');
  return { type: type || '', id: id || '' };
}

export function BankAccountInlineForm({ onClose }: BankAccountInlineFormProps) {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { createDMS } = useRecordCardDMS();
  const [formData, setFormData] = useState<BankAccountFormData>(defaultFormData);
  const [ibanError, setIbanError] = useState<string | null>(null);

  const { data: allOptions = [] } = useQuery({
    queryKey: ['all-owner-options', activeTenantId],
    queryFn: async (): Promise<OwnerOption[]> => {
      if (!activeTenantId) return [];
      const [personsRes, propsRes, pvRes] = await Promise.all([
        supabase.from('household_persons').select('id, first_name, last_name').eq('tenant_id', activeTenantId),
        supabase.from('landlord_contexts').select('id, name').eq('tenant_id', activeTenantId),
        supabase.from('pv_plants').select('id, name').eq('tenant_id', activeTenantId),
      ]);
      const persons: OwnerOption[] = (personsRes.data || []).map((p: any) => ({
        id: p.id, label: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Person', type: 'person',
      }));
      const properties: OwnerOption[] = (propsRes.data || []).map((p: any) => ({
        id: p.id, label: p.name || 'Vermietereinheit', type: 'property',
      }));
      const pvPlants: OwnerOption[] = (pvRes.data || []).map((p: any) => ({
        id: p.id, label: p.name || 'PV-Anlage', type: 'pv_plant',
      }));
      return [...persons, ...properties, ...pvPlants];
    },
    enabled: !!activeTenantId,
  });

  const personOptions = allOptions.filter(o => o.type === 'person');
  const propertyOptions = allOptions.filter(o => o.type === 'property');
  const pvOptions = allOptions.filter(o => o.type === 'pv_plant');

  const currentOwnerValue = formData.owner_type && formData.owner_id
    ? encodeOwnerValue(formData.owner_type, formData.owner_id)
    : '';

  const createAccount = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      if (!activeTenantId) throw new Error('Keine Organisation aktiv');
      const cleanIban = data.iban.replace(/\s/g, '').toUpperCase();

      if (data.is_default) {
        await supabase.from('bank_accounts').update({ is_default: false }).eq('tenant_id', activeTenantId);
      }

      const { data: newRow, error } = await supabase.from('bank_accounts').insert({
        tenant_id: activeTenantId,
        account_name: data.account_name,
        iban: cleanIban,
        bank_name: data.bank_name || null,
        is_default: data.is_default,
        status: 'pending',
        owner_type: data.owner_type || null,
        owner_id: data.owner_id || null,
      }).select('id').single();
      if (error) throw error;
      return { id: newRow.id, name: data.account_name, bank: data.bank_name };
    },
    onSuccess: (result) => {
      if (result && activeTenantId) {
        createDMS.mutate({
          entityType: 'bank_account',
          entityId: result.id,
          entityName: result.name || 'Bankkonto',
          tenantId: activeTenantId,
          keywords: [result.name, result.bank].filter(Boolean),
        });
      }
      toast.success('Bankkonto hinzugefügt');
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
      onClose();
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

  const handleOwnerChange = (encoded: string) => {
    const { type, id } = decodeOwnerValue(encoded);
    setFormData(prev => ({ ...prev, owner_type: type, owner_id: id }));
  };

  return (
    <Card className="glass-card mt-4">
      <CardContent className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Bankkonto hinzufügen</h3>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inline_account_name">Kontobezeichnung *</Label>
            <Input id="inline_account_name" placeholder="z.B. Mietkonto Haupthaus"
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inline_iban">IBAN *</Label>
            <Input id="inline_iban" placeholder="DE89 3704 0044 0532 0130 00"
              value={formData.iban}
              onChange={(e) => handleIbanChange(e.target.value)}
              className={ibanError ? 'border-destructive' : ''} />
            {ibanError && <p className="text-xs text-destructive">{ibanError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inline_bank_name">Bank</Label>
            <Input id="inline_bank_name" placeholder="z.B. Commerzbank"
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Zuordnung</Label>
            <Select value={currentOwnerValue} onValueChange={handleOwnerChange}>
              <SelectTrigger><SelectValue placeholder="Zuordnung wählen…" /></SelectTrigger>
              <SelectContent>
                {personOptions.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Personen</SelectLabel>
                    {personOptions.map(o => (
                      <SelectItem key={o.id} value={encodeOwnerValue('person', o.id)}>{o.label}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {propertyOptions.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Vermietereinheiten</SelectLabel>
                    {propertyOptions.map(o => (
                      <SelectItem key={o.id} value={encodeOwnerValue('property', o.id)}>{o.label}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {pvOptions.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>PV-Anlagen</SelectLabel>
                    {pvOptions.map(o => (
                      <SelectItem key={o.id} value={encodeOwnerValue('pv_plant', o.id)}>{o.label}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {allOptions.length === 0 && (
                  <SelectItem value="__empty__" disabled>Keine Einträge vorhanden</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="inline_is_default" className="cursor-pointer">Als Standard setzen</Label>
              <p className="text-xs text-muted-foreground">Wird für neue Mietverhältnisse verwendet</p>
            </div>
            <Switch id="inline_is_default" checked={formData.is_default}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={createAccount.isPending}>
              {createAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              💾 Speichern
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
