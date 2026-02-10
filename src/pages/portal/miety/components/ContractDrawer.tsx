/**
 * ContractDrawer — Inline Drawer for creating/editing contracts
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const CATEGORIES = [
  { value: 'strom', label: 'Strom' },
  { value: 'gas', label: 'Gas' },
  { value: 'wasser', label: 'Wasser' },
  { value: 'internet', label: 'Internet' },
  { value: 'hausrat', label: 'Hausratversicherung' },
  { value: 'haftpflicht', label: 'Haftpflichtversicherung' },
  { value: 'miete', label: 'Mietvertrag' },
  { value: 'sonstige', label: 'Sonstige' },
];

interface ContractDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeId: string;
}

export function ContractDrawer({ open, onOpenChange, homeId }: ContractDrawerProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('sonstige');
  const [providerName, setProviderName] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [monthlyCost, setMonthlyCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cancellationDate, setCancellationDate] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { error } = await supabase.from('miety_contracts').insert({
        home_id: homeId,
        tenant_id: activeTenantId,
        category,
        provider_name: providerName || null,
        contract_number: contractNumber || null,
        monthly_cost: monthlyCost ? parseFloat(monthlyCost) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        cancellation_date: cancellationDate || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miety-contracts', homeId] });
      toast.success('Vertrag angelegt');
      resetForm();
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  function resetForm() {
    setCategory('sonstige');
    setProviderName('');
    setContractNumber('');
    setMonthlyCost('');
    setStartDate('');
    setEndDate('');
    setCancellationDate('');
    setNotes('');
  }

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Vertrag anlegen"
      description="Neuen Vertrag für Ihr Zuhause erfassen"
      footer={
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? 'Speichern...' : 'Vertrag speichern'}
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Kategorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Anbieter</Label>
          <Input value={providerName} onChange={e => setProviderName(e.target.value)} placeholder="z.B. Stadtwerke München" />
        </div>
        <div>
          <Label>Vertragsnummer</Label>
          <Input value={contractNumber} onChange={e => setContractNumber(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <Label>Monatliche Kosten (€)</Label>
          <Input type="number" value={monthlyCost} onChange={e => setMonthlyCost(e.target.value)} placeholder="z.B. 85.00" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Vertragsbeginn</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Vertragsende</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Kündigungsfrist</Label>
          <Input type="date" value={cancellationDate} onChange={e => setCancellationDate(e.target.value)} />
        </div>
        <div>
          <Label>Notizen</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optionale Notizen..." rows={3} />
        </div>
      </div>
    </DetailDrawer>
  );
}
