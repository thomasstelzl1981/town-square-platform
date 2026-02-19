/**
 * LoanSection — CRUD list of loans for a home (ownership_type === 'eigentum')
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Landmark, X } from 'lucide-react';
import { useLegalConsent } from '@/hooks/useLegalConsent';

interface LoanSectionProps {
  homeId: string;
}

export function LoanSection({ homeId }: LoanSectionProps) {
  const { activeTenantId } = useAuth();
  const consentGuard = useLegalConsent();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bank_name: '', loan_amount: '', interest_rate: '', monthly_rate: '',
    start_date: '', end_date: '', remaining_balance: '', loan_type: 'annuitaet', notes: '',
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['miety-loans', homeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('miety_loans')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const insertMutation = useMutation({
    mutationFn: async () => {
      if (!consentGuard.requireConsent()) throw new Error('Consent required');
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { error } = await supabase.from('miety_loans').insert({
        home_id: homeId,
        tenant_id: activeTenantId,
        bank_name: form.bank_name || null,
        loan_amount: form.loan_amount ? parseFloat(form.loan_amount) : null,
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
        monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        remaining_balance: form.remaining_balance ? parseFloat(form.remaining_balance) : null,
        loan_type: form.loan_type,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miety-loans', homeId] });
      toast.success('Darlehen gespeichert');
      setShowForm(false);
      setForm({ bank_name: '', loan_amount: '', interest_rate: '', monthly_rate: '', start_date: '', end_date: '', remaining_balance: '', loan_type: 'annuitaet', notes: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!consentGuard.requireConsent()) throw new Error('Consent required');
      const { error } = await supabase.from('miety_loans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miety-loans', homeId] });
      toast.success('Darlehen gelöscht');
    },
  });

  return (
    <div className="space-y-3">
      {loans.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">Noch keine Darlehen erfasst.</p>
      )}

      {loans.map((loan: any) => (
        <Card key={loan.id} className="glass-card">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{loan.bank_name || 'Unbenannt'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {loan.loan_amount && <span>Summe: {Number(loan.loan_amount).toLocaleString('de-DE')} €</span>}
                  {loan.monthly_rate && <span>Rate: {Number(loan.monthly_rate).toLocaleString('de-DE')} €/mtl.</span>}
                  {loan.interest_rate && <span>Zins: {loan.interest_rate}%</span>}
                  {loan.remaining_balance && <span>Rest: {Number(loan.remaining_balance).toLocaleString('de-DE')} €</span>}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(loan.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Bank</Label><Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="Sparkasse" /></div>
              <div><Label className="text-xs">Typ</Label>
                <Select value={form.loan_type} onValueChange={v => setForm(f => ({ ...f, loan_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annuitaet">Annuitätendarlehen</SelectItem>
                    <SelectItem value="tilgung">Tilgungsdarlehen</SelectItem>
                    <SelectItem value="endfaellig">Endfälliges Darlehen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label className="text-xs">Darlehenssumme</Label><Input type="number" value={form.loan_amount} onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))} /></div>
              <div><Label className="text-xs">Zinssatz (%)</Label><Input type="number" step="0.01" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} /></div>
              <div><Label className="text-xs">Monatsrate</Label><Input type="number" value={form.monthly_rate} onChange={e => setForm(f => ({ ...f, monthly_rate: e.target.value }))} /></div>
              <div><Label className="text-xs">Restschuld</Label><Input type="number" value={form.remaining_balance} onChange={e => setForm(f => ({ ...f, remaining_balance: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Beginn</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label className="text-xs">Zinsbindung bis</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}><X className="h-3.5 w-3.5 mr-1" />Abbrechen</Button>
              <Button size="sm" onClick={() => insertMutation.mutate()} disabled={insertMutation.isPending}>Speichern</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Darlehen hinzufügen
        </Button>
      )}
    </div>
  );
}
