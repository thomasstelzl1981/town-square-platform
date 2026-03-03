/**
 * Pet Desk — Vorgänge Tab: PLC-Cases Monitoring + Stuck-Detection
 * Reads from pet_service_cases (SSOT) instead of legacy pet_z1_booking_requests
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, ArrowRight, CheckCircle, UserCheck, Clock, AlertCircle, CalendarDays, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLC_PHASE_LABELS, type PLCPhase } from '@/engines/plc/spec';
import { computePLCState } from '@/engines/plc/engine';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: 'Neu', color: 'bg-blue-100 text-blue-700', icon: Clock },
  qualified: { label: 'Qualifiziert', color: 'bg-amber-100 text-amber-700', icon: UserCheck },
  assigned: { label: 'Zugewiesen', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

const PHASE_BADGE_COLORS: Record<string, string> = {
  provider_selected: 'bg-yellow-100 text-yellow-700',
  provider_confirmed: 'bg-green-100 text-green-700',
  provider_declined: 'bg-red-100 text-red-700',
  checked_in: 'bg-emerald-100 text-emerald-700',
  checked_out: 'bg-blue-100 text-blue-700',
  settlement: 'bg-orange-100 text-orange-700',
  closed_completed: 'bg-gray-100 text-gray-600',
  closed_cancelled: 'bg-red-100 text-red-700',
};

export default function PetDeskVorgaenge() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'new' | 'qualified' | 'assigned'>('all');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['pet-z1-vorgaenge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_z1_customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['pet-providers-list'],
    queryFn: async () => {
      const { data } = await (supabase.from('pet_providers') as any).select('id, company_name').eq('is_active', true);
      return (data || []) as { id: string; company_name: string }[];
    },
  });

  // ── PLC Service Cases (SSOT) ──
  const { data: serviceCases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['pet-desk-service-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_service_cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((row: any) => {
        const plcCase = {
          id: row.id,
          customer_user_id: row.customer_user_id,
          customer_email: row.customer_email,
          customer_name: row.customer_name,
          provider_id: row.provider_id,
          service_type: row.service_type,
          pet_id: row.pet_id,
          current_phase: row.current_phase as PLCPhase,
          phase_entered_at: row.phase_entered_at,
          total_price_cents: row.total_price_cents,
          deposit_cents: row.deposit_cents,
          deposit_paid_at: row.deposit_paid_at,
          stripe_payment_intent_id: row.stripe_payment_intent_id,
          stripe_checkout_session_id: row.stripe_checkout_session_id,
          scheduled_start: row.scheduled_start,
          scheduled_end: row.scheduled_end,
          provider_notes: row.provider_notes,
          customer_notes: row.customer_notes,
          tenant_id: row.tenant_id,
          created_at: row.created_at,
          closed_at: row.closed_at,
        };
        return { ...plcCase, computed: computePLCState(plcCase) };
      });
    },
  });

  const stuckCases = serviceCases.filter((c: any) => c.computed.isStuck);
  const openCases = serviceCases.filter((c: any) => !['closed_completed', 'closed_cancelled'].includes(c.current_phase));

  // Qualify lead
  const qualifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_z1_customers').update({ status: 'qualified' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-z1-vorgaenge'] });
      toast.success('Lead qualifiziert');
    },
  });

  // Assign lead
  const assignMutation = useMutation({
    mutationFn: async ({ customerId, providerId }: { customerId: string; providerId: string }) => {
      const { data: z1Customer, error: z1Err } = await supabase.from('pet_z1_customers').select('*').eq('id', customerId).single();
      if (z1Err || !z1Customer) throw new Error('Z1-Kunde nicht gefunden');

      const { error: pcErr } = await supabase.from('pet_customers').insert({
        tenant_id: z1Customer.tenant_id,
        provider_id: providerId,
        z1_customer_id: customerId,
        first_name: z1Customer.first_name,
        last_name: z1Customer.last_name,
        email: z1Customer.email,
        phone: z1Customer.phone,
        address: z1Customer.address,
        city: z1Customer.city,
        postal_code: z1Customer.postal_code,
        notes: z1Customer.notes,
        source: 'lead',
        origin_zone: 'Z3',
        status: 'active',
      });
      if (pcErr) throw pcErr;

      const { data: z1Pets } = await (supabase.from('pet_z1_pets' as any) as any).select('*').eq('z1_customer_id', customerId);

      if (z1Pets && z1Pets.length > 0) {
        const { data: newCustomer } = await supabase.from('pet_customers').select('id').eq('z1_customer_id', customerId).single();
        if (newCustomer) {
          for (const z1Pet of z1Pets) {
            await supabase.from('pets').insert({
              tenant_id: z1Pet.tenant_id,
              customer_id: newCustomer.id,
              name: z1Pet.name,
              species: z1Pet.species,
              breed: z1Pet.breed,
              gender: z1Pet.gender,
              birth_date: z1Pet.birth_date,
              weight_kg: z1Pet.weight_kg,
              chip_number: z1Pet.chip_number,
              neutered: z1Pet.neutered,
              notes: z1Pet.notes,
            });
          }
        }
      }

      const { error: updateErr } = await supabase.from('pet_z1_customers').update({
        status: 'assigned',
        assigned_provider_id: providerId,
        assigned_at: new Date().toISOString(),
      }).eq('id', customerId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-z1-vorgaenge'] });
      toast.success('Lead erfolgreich zugewiesen');
    },
    onError: (err: any) => toast.error('Fehler bei Zuweisung: ' + err.message),
  });

  const filtered = filter === 'all' ? customers : customers.filter(c => c.status === filter);
  const counts = {
    all: customers.length,
    new: customers.filter(c => c.status === 'new').length,
    qualified: customers.filter(c => c.status === 'qualified').length,
    assigned: customers.filter(c => c.status === 'assigned').length,
  };

  return (
    <div className="space-y-6">
      {/* Zone Flow */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-teal-100 text-teal-700 font-medium">Z3 Lead</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">Z1 Qualifizierung</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">Z2 Provider</span>
      </div>

      {/* SLA Stuck Alert */}
      {stuckCases.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">{stuckCases.length} Case(s) mit SLA-Überschreitung</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'new', 'qualified', 'assigned'] as const).map(key => (
          <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(key)} className="text-xs">
            {key === 'all' ? 'Alle' : statusConfig[key]?.label || key}
            <Badge variant="secondary" className="ml-1.5 text-[10px]">{counts[key]}</Badge>
          </Button>
        ))}
      </div>

      {/* Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />Vorgänge
            {filtered.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{filtered.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">Keine Vorgänge in dieser Kategorie</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(customer => {
                const status = statusConfig[customer.status] || statusConfig.new;
                return (
                  <div key={customer.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        {customer.first_name?.[0]}{customer.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{customer.first_name} {customer.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email} · {customer.source} · {new Date(customer.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                      {customer.status === 'new' && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => qualifyMutation.mutate(customer.id)} disabled={qualifyMutation.isPending}>Qualifizieren</Button>
                      )}
                      {customer.status === 'qualified' && providers.length > 0 && (
                        <Button size="sm" className="text-xs" onClick={() => assignMutation.mutate({ customerId: customer.id, providerId: providers[0].id })} disabled={assignMutation.isPending}>
                          Zuweisen → {providers[0].company_name}
                        </Button>
                      )}
                      {customer.status === 'assigned' && (
                        <span className="text-xs text-muted-foreground">{customer.assigned_at ? new Date(customer.assigned_at).toLocaleDateString('de-DE') : ''}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ SERVICE CASES — PLC Monitoring ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            Service Cases (PLC)
            {openCases.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{openCases.length} offen</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {casesLoading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : serviceCases.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-muted-foreground text-sm">Keine Service Cases vorhanden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {serviceCases.map((c: any) => (
                <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{c.customer_name || c.customer_email || 'Unbekannt'}</p>
                      <Badge className={`text-[10px] ${PHASE_BADGE_COLORS[c.current_phase] || 'bg-gray-100 text-gray-600'}`}>
                        {PLC_PHASE_LABELS[c.current_phase as PLCPhase]}
                      </Badge>
                      {c.computed.isStuck && (
                        <Badge variant="destructive" className="text-[10px]">
                          <AlertTriangle className="h-3 w-3 mr-0.5" /> SLA
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.service_type}
                      {c.scheduled_start && ` · ${format(parseISO(c.scheduled_start), 'dd.MM.yyyy', { locale: de })}`}
                      {c.total_price_cents > 0 && ` · ${(c.total_price_cents / 100).toFixed(2)} €`}
                    </p>
                    <Progress value={c.computed.progressPercent} className="h-1 mt-1.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{c.computed.progressPercent}%</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
