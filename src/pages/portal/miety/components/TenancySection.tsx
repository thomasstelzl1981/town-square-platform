/**
 * TenancySection — CRUD for tenancy details (ownership_type === 'miete')
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, User, X } from 'lucide-react';

interface TenancySectionProps {
  homeId: string;
}

export function TenancySection({ homeId }: TenancySectionProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: tenancy } = useQuery({
    queryKey: ['miety-tenancy', homeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('miety_tenancies')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    landlord_name: '', landlord_contact: '', base_rent: '', additional_costs: '',
    total_rent: '', deposit_amount: '', lease_start: '', lease_end: '', cancellation_period: '', notes: '',
  });

  const startEdit = () => {
    if (tenancy) {
      setForm({
        landlord_name: tenancy.landlord_name || '',
        landlord_contact: tenancy.landlord_contact || '',
        base_rent: tenancy.base_rent?.toString() || '',
        additional_costs: tenancy.additional_costs?.toString() || '',
        total_rent: tenancy.total_rent?.toString() || '',
        deposit_amount: tenancy.deposit_amount?.toString() || '',
        lease_start: tenancy.lease_start || '',
        lease_end: tenancy.lease_end || '',
        cancellation_period: tenancy.cancellation_period || '',
        notes: tenancy.notes || '',
      });
    }
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const payload = {
        home_id: homeId,
        tenant_id: activeTenantId,
        landlord_name: form.landlord_name || null,
        landlord_contact: form.landlord_contact || null,
        base_rent: form.base_rent ? parseFloat(form.base_rent) : null,
        additional_costs: form.additional_costs ? parseFloat(form.additional_costs) : null,
        total_rent: form.total_rent ? parseFloat(form.total_rent) : null,
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        lease_start: form.lease_start || null,
        lease_end: form.lease_end || null,
        cancellation_period: form.cancellation_period || null,
        notes: form.notes || null,
      };
      if (tenancy) {
        const { error } = await supabase.from('miety_tenancies').update(payload).eq('id', tenancy.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('miety_tenancies').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miety-tenancy', homeId] });
      toast.success('Mietverhältnis gespeichert');
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Vermieter</Label><Input value={form.landlord_name} onChange={e => setForm(f => ({ ...f, landlord_name: e.target.value }))} placeholder="Max Mustermann" /></div>
          <div><Label className="text-xs">Kontakt</Label><Input value={form.landlord_contact} onChange={e => setForm(f => ({ ...f, landlord_contact: e.target.value }))} placeholder="Tel. / E-Mail" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">Kaltmiete</Label><Input type="number" value={form.base_rent} onChange={e => setForm(f => ({ ...f, base_rent: e.target.value }))} /></div>
          <div><Label className="text-xs">Nebenkosten</Label><Input type="number" value={form.additional_costs} onChange={e => setForm(f => ({ ...f, additional_costs: e.target.value }))} /></div>
          <div><Label className="text-xs">Warmmiete</Label><Input type="number" value={form.total_rent} onChange={e => setForm(f => ({ ...f, total_rent: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">Kaution</Label><Input type="number" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))} /></div>
          <div><Label className="text-xs">Mietbeginn</Label><Input type="date" value={form.lease_start} onChange={e => setForm(f => ({ ...f, lease_start: e.target.value }))} /></div>
          <div><Label className="text-xs">Befristung</Label><Input type="date" value={form.lease_end} onChange={e => setForm(f => ({ ...f, lease_end: e.target.value }))} /></div>
        </div>
        <div><Label className="text-xs">Kündigungsfrist</Label><Input value={form.cancellation_period} onChange={e => setForm(f => ({ ...f, cancellation_period: e.target.value }))} placeholder="3 Monate" /></div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" />Abbrechen</Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Speichern</Button>
        </div>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Noch kein Mietverhältnis erfasst.</p>
        <Button variant="outline" size="sm" onClick={startEdit}>
          <Plus className="h-3.5 w-3.5 mr-1" />Mietverhältnis anlegen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div><p className="text-xs text-muted-foreground">Vermieter</p><p className="text-sm font-medium">{tenancy.landlord_name || '—'}</p></div>
        </div>
        {tenancy.landlord_contact && (
          <div><p className="text-xs text-muted-foreground">Kontakt</p><p className="text-sm">{tenancy.landlord_contact}</p></div>
        )}
        <div><p className="text-xs text-muted-foreground">Kaltmiete</p><p className="text-sm font-medium">{tenancy.base_rent ? `${Number(tenancy.base_rent).toLocaleString('de-DE')} €` : '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Nebenkosten</p><p className="text-sm">{tenancy.additional_costs ? `${Number(tenancy.additional_costs).toLocaleString('de-DE')} €` : '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Warmmiete</p><p className="text-sm font-medium">{tenancy.total_rent ? `${Number(tenancy.total_rent).toLocaleString('de-DE')} €` : '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Kaution</p><p className="text-sm">{tenancy.deposit_amount ? `${Number(tenancy.deposit_amount).toLocaleString('de-DE')} €` : '—'}</p></div>
        {tenancy.cancellation_period && (
          <div><p className="text-xs text-muted-foreground">Kündigungsfrist</p><p className="text-sm">{tenancy.cancellation_period}</p></div>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={startEdit}>
        <Pencil className="h-3.5 w-3.5 mr-1" />Bearbeiten
      </Button>
    </div>
  );
}
