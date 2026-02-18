/**
 * Lead Manager — Leads Tab (MOD-10)
 * Lead-Liste mit Status-Management, Notizen, Filter
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Inbox, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Neu' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'qualified', label: 'Qualifiziert' },
  { value: 'converted', label: 'Konvertiert' },
  { value: 'lost', label: 'Verloren' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-700',
  contacted: 'bg-amber-500/10 text-amber-700',
  qualified: 'bg-green-500/10 text-green-700',
  converted: 'bg-emerald-500/10 text-emerald-700',
  lost: 'bg-red-500/10 text-red-700',
};

const BRAND_LABELS: Record<string, string> = {
  futureroom: 'FutureRoom', kaufy: 'Kaufy', lennox_friends: 'Lennox & Friends', acquiary: 'Acquiary',
};

export default function LeadManagerLeads() {
  const { user, activeTenantId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ['lead-manager-leads', activeTenantId, user?.id, statusFilter, brandFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return [];
      let query = supabase
        .from('social_leads')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('lead_status', statusFilter);
      if (brandFilter !== 'all') query = query.eq('brand_context', brandFilter);
      const { data } = await query;
      return data || [];
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('social_leads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-manager-leads'] });
      toast.success('Lead aktualisiert');
    },
  });

  const selectedLead = leads?.find(l => l.id === selectedLeadId);

  return (
    <PageShell>
      <ModulePageHeader title="MEINE LEADS" description="Leads aus Kampagnen bearbeiten und verwalten" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Brands</SelectItem>
            {Object.entries(BRAND_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : leads && leads.length > 0 ? (
        <div className="space-y-2">
          {leads.map(lead => {
            const leadData = lead.lead_data as any;
            const isSelected = selectedLeadId === lead.id;
            return (
              <div key={lead.id}>
                <Card
                  className={`cursor-pointer transition-all ${isSelected ? 'border-primary' : 'hover:border-primary/30'}`}
                  onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{leadData?.name || leadData?.email || 'Lead'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString('de-DE')} · {BRAND_LABELS[lead.brand_context || ''] || '—'}</p>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[lead.lead_status] || ''}>{STATUS_OPTIONS.find(s => s.value === lead.lead_status)?.label || lead.lead_status}</Badge>
                  </CardContent>
                </Card>

                {/* Inline Detail */}
                {isSelected && selectedLead && (
                  <Card className="mt-1 border-primary/20">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Lead-Details</p>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLeadId(null)}><X className="h-4 w-4" /></Button>
                      </div>
                      {/* Contact data */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {leadData?.name && <div><span className="text-muted-foreground text-xs">Name</span><p>{leadData.name}</p></div>}
                        {leadData?.email && <div><span className="text-muted-foreground text-xs">E-Mail</span><p>{leadData.email}</p></div>}
                        {leadData?.phone && <div><span className="text-muted-foreground text-xs">Telefon</span><p>{leadData.phone}</p></div>}
                      </div>
                      {/* Status */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Status</label>
                        <Select value={selectedLead.lead_status} onValueChange={v => updateMutation.mutate({ id: selectedLead.id, updates: { lead_status: v } })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Notizen</label>
                        <Textarea
                          value={selectedLead.notes || ''}
                          placeholder="Notizen zum Lead..."
                          onBlur={e => {
                            if (e.target.value !== (selectedLead.notes || '')) {
                              updateMutation.mutate({ id: selectedLead.id, updates: { notes: e.target.value } });
                            }
                          }}
                          defaultValue={selectedLead.notes || ''}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <EmptyState
              icon={Inbox}
              title="Noch keine Leads"
              description="Starte eine Kampagne, um automatisch Leads zu generieren."
              action={{ label: 'Kampagne planen', onClick: () => navigate('/portal/lead-manager/studio/planen') }}
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
