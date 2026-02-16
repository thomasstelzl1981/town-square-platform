/**
 * MOD-18 Finanzen — Tab 5: ABONNEMENTS
 * SSOT für alle Abonnements. RecordCard-Pattern + Seed Merchants.
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { RecordCard } from '@/components/shared/RecordCard';
import { RECORD_CARD } from '@/config/designManifest';
import { getContractWidgetGlow } from '@/config/widgetCategorySpec';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Receipt } from 'lucide-react';
import { DesktopOnly } from '@/components/shared/DesktopOnly';

const CATEGORY_ENUM = [
  { value: 'streaming_video', label: 'Streaming (Video)' },
  { value: 'streaming_music', label: 'Streaming (Musik)' },
  { value: 'cloud_storage', label: 'Cloud & Speicher' },
  { value: 'software_saas', label: 'Software / SaaS' },
  { value: 'news_media', label: 'Nachrichten & Medien' },
  { value: 'ecommerce_membership', label: 'E-Commerce Mitgliedschaft' },
  { value: 'telecom_mobile', label: 'Mobilfunk' },
  { value: 'internet', label: 'Internet' },
  { value: 'utilities_energy', label: 'Energie & Versorger' },
  { value: 'mobility', label: 'Mobilität' },
  { value: 'fitness', label: 'Fitness & Sport' },
  { value: 'other', label: 'Sonstiges' },
] as const;

const SEED_MERCHANTS = [
  'Amazon Prime', 'Netflix', 'Disney+', 'Spotify', 'Apple Music',
  'YouTube Premium', 'Microsoft 365', 'Adobe CC', 'Dropbox',
  'Google One', 'ZEIT', 'FAZ', 'Handelsblatt', 'Spiegel+',
];

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

export default function AbonnementsTab() {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, any>>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({
    custom_name: '', merchant: '', category: 'other', frequency: 'monatlich',
    amount: 0, status: 'aktiv', auto_renew: true,
  });

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['fin-subscriptions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  const monthlyCost = useMemo(() => {
    return subs.filter((s: any) => s.status === 'aktiv').reduce((sum: number, s: any) => {
      const amt = s.amount || 0;
      const freq = (s.frequency || '').toLowerCase();
      if (freq.includes('jaehr')) return sum + amt / 12;
      if (freq.includes('halb')) return sum + amt / 6;
      if (freq.includes('viertel')) return sum + amt / 3;
      return sum + amt;
    }, 0);
  }, [subs]);

  const createMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { error } = await supabase.from('user_subscriptions').insert({
        tenant_id: activeTenantId,
        user_id: user.id,
        custom_name: form.custom_name || null,
        merchant: form.merchant || null,
        category: (form.category as any) || null,
        frequency: form.frequency || null,
        amount: Number(form.amount) || null,
        status: form.status || null,
        auto_renew: form.auto_renew ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-subscriptions'] });
      toast.success('Abonnement angelegt');
      setShowNew(false);
      setNewForm({ custom_name: '', merchant: '', category: 'other', frequency: 'monatlich', amount: 0, status: 'aktiv', auto_renew: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      const { id, created_at, updated_at, tenant_id, user_id, ...rest } = form;
      const { error } = await supabase.from('user_subscriptions').update({
        custom_name: rest.custom_name || null,
        merchant: rest.merchant || null,
        category: (rest.category as any) || null,
        frequency: rest.frequency || null,
        amount: Number(rest.amount) || null,
        status: rest.status || null,
        auto_renew: rest.auto_renew ?? true,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-subscriptions'] });
      toast.success('Abonnement aktualisiert');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin-subscriptions'] });
      toast.success('Abonnement gelöscht');
      setOpenCardId(null);
    },
  });

  if (isLoading) return <PageShell><Skeleton className="h-64" /></PageShell>;

  const toggleCard = (id: string) => {
    if (openCardId === id) { setOpenCardId(null); return; }
    const c = subs.find((x: any) => x.id === id);
    if (c) setForms(prev => ({ ...prev, [id]: { ...c } }));
    setOpenCardId(id);
    setShowNew(false);
  };

  const updateField = (id: string, field: string, value: any) => {
    setForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const catLabel = (val: string) => CATEGORY_ENUM.find(c => c.value === val)?.label || val;

  const SubFields = ({ form, onUpdate }: { form: Record<string, any>; onUpdate: (f: string, v: any) => void }) => (
    <div>
      <p className={RECORD_CARD.SECTION_TITLE}>Abo-Details</p>
      <div className={RECORD_CARD.FIELD_GRID}>
        <FormInput label="Eigener Name" name="custom_name" value={form.custom_name || ''} onChange={e => onUpdate('custom_name', e.target.value)} />
        <FormInput label="Anbieter / Merchant" name="merchant" value={form.merchant || ''} onChange={e => onUpdate('merchant', e.target.value)} />
        <div>
          <Label className="text-xs">Kategorie</Label>
          <Select value={form.category || 'other'} onValueChange={v => onUpdate('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORY_ENUM.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FormInput label="Frequenz" name="frequency" value={form.frequency || ''} onChange={e => onUpdate('frequency', e.target.value)} />
        <FormInput label="Betrag (€)" name="amount" type="number" value={form.amount || ''} onChange={e => onUpdate('amount', e.target.value)} />
        <FormInput label="Status" name="status" value={form.status || ''} onChange={e => onUpdate('status', e.target.value)} />
        <div className="flex items-center gap-2 pt-5">
          <Switch checked={!!form.auto_renew} onCheckedChange={v => onUpdate('auto_renew', v)} />
          <Label className="text-xs">Auto-Verlängerung</Label>
        </div>
      </div>
    </div>
  );

  return (
    <PageShell>
      <ModulePageHeader title="Abonnements" description="Alle wiederkehrenden Zahlungen und Abonnements zentral verwalten" />

      <Card className="glass-card">
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monatliche Gesamtkosten</p>
              <p className="text-2xl font-bold">{fmt(monthlyCost)}</p>
            </div>
          </div>
          <Badge variant="secondary">{subs.filter((s: any) => s.status === 'aktiv').length} aktive Abos</Badge>
        </CardContent>
      </Card>

      <div className={RECORD_CARD.GRID}>
        {subs.map((s: any) => {
          const form = forms[s.id] || s;
          return (
            <RecordCard
              key={s.id}
              id={s.id}
              entityType="subscription"
              isOpen={openCardId === s.id}
              onToggle={() => toggleCard(s.id)}
              glowVariant={getContractWidgetGlow(s.id) ?? undefined}
              title={s.custom_name || s.merchant || 'Abonnement'}
              subtitle={catLabel(s.category || 'other')}
              badges={[
                { label: s.status || 'aktiv', variant: s.status === 'aktiv' ? 'default' : 'secondary' },
              ]}
              summary={[
                { label: 'Betrag', value: `${fmt(s.amount || 0)} / ${s.frequency || 'monatlich'}` },
              ]}
              tenantId={activeTenantId || undefined}
              onSave={() => updateMutation.mutate(form)}
              onDelete={() => deleteMutation.mutate(s.id)}
              saving={updateMutation.isPending}
            >
              <SubFields form={form} onUpdate={(f, v) => updateField(s.id, f, v)} />
            </RecordCard>
          );
        })}

        <DesktopOnly>
          {!showNew && (
            <div
              className={RECORD_CARD.CLOSED + ' border-dashed border-primary/30 flex items-center justify-center'}
              onClick={() => { setShowNew(true); setOpenCardId(null); }}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Abonnement hinzufügen</p>
              </div>
            </div>
          )}

          {showNew && (
          <div className={RECORD_CARD.OPEN}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Neues Abonnement</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Abbrechen</Button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Schnellauswahl</p>
              <div className="flex flex-wrap gap-1.5">
                {SEED_MERCHANTS.map(m => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                    onClick={() => setNewForm(prev => ({ ...prev, merchant: m, custom_name: m }))}
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <SubFields form={newForm} onUpdate={(f, v) => setNewForm(prev => ({ ...prev, [f]: v }))} />
            </div>
            <div className={RECORD_CARD.ACTIONS}>
              <Button size="sm" onClick={() => createMutation.mutate(newForm)}>Speichern</Button>
            </div>
          </div>
        )}
        </DesktopOnly>
      </div>
    </PageShell>
  );
}
