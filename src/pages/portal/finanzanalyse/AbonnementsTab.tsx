/**
 * MOD-18 Finanzen — Tab 5: ABONNEMENTS
 * Widget CE Layout: WidgetGrid + WidgetCell (4-col, square)
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { CARD, TYPOGRAPHY, HEADER, RECORD_CARD, DEMO_WIDGET, getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';

import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { FormInput } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Receipt, X } from 'lucide-react';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
import { cn } from '@/lib/utils';

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
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const filteredSubs = useMemo(
    () => demoEnabled ? subs : subs.filter((s: any) => !isDemoId(s.id)),
    [subs, demoEnabled]
  );

  const monthlyCost = useMemo(() => {
    return filteredSubs.filter((s: any) => s.status === 'aktiv').reduce((sum: number, s: any) => {
      const amt = s.amount || 0;
      const freq = (s.frequency || '').toLowerCase();
      if (freq.includes('jaehr')) return sum + amt / 12;
      if (freq.includes('halb')) return sum + amt / 6;
      if (freq.includes('viertel')) return sum + amt / 3;
      return sum + amt;
    }, 0);
  }, [filteredSubs]);

  const createMutation = useMutation({
    mutationFn: async (form: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const { error } = await supabase.from('user_subscriptions').insert({
        tenant_id: activeTenantId, user_id: user.id,
        custom_name: form.custom_name || null, merchant: form.merchant || null,
        category: (form.category as any) || null, frequency: form.frequency || null,
        amount: Number(form.amount) || null, status: form.status || null,
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
        custom_name: rest.custom_name || null, merchant: rest.merchant || null,
        category: (rest.category as any) || null, frequency: rest.frequency || null,
        amount: Number(rest.amount) || null, status: rest.status || null,
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
      setSelectedId(null);
    },
  });

  if (isLoading) return <PageShell><Skeleton className="h-64" /></PageShell>;

  const selectCard = (id: string) => {
    if (selectedId === id) { setSelectedId(null); return; }
    const c = subs.find((x: any) => x.id === id);
    if (c) setForms(prev => ({ ...prev, [id]: { ...c } }));
    setSelectedId(id);
    setShowNew(false);
  };

  const updateField = (id: string, field: string, value: any) => {
    setForms(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const catLabel = (val: string) => CATEGORY_ENUM.find(c => c.value === val)?.label || val;

  const selectedSub = subs.find((s: any) => s.id === selectedId);
  const form = selectedId ? (forms[selectedId] || selectedSub) : null;

  const SubFields = ({ form: f, onUpdate }: { form: Record<string, any>; onUpdate: (field: string, v: any) => void }) => (
    <div>
      <p className={RECORD_CARD.SECTION_TITLE}>Abo-Details</p>
      <div className={RECORD_CARD.FIELD_GRID}>
        <FormInput label="Eigener Name" name="custom_name" value={f.custom_name || ''} onChange={e => onUpdate('custom_name', e.target.value)} />
        <FormInput label="Anbieter / Merchant" name="merchant" value={f.merchant || ''} onChange={e => onUpdate('merchant', e.target.value)} />
        <div>
          <Label className="text-xs">Kategorie</Label>
          <Select value={f.category || 'other'} onValueChange={v => onUpdate('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORY_ENUM.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FormInput label="Frequenz" name="frequency" value={f.frequency || ''} onChange={e => onUpdate('frequency', e.target.value)} />
        <FormInput label="Betrag (€)" name="amount" type="number" value={f.amount || ''} onChange={e => onUpdate('amount', e.target.value)} />
        <FormInput label="Status" name="status" value={f.status || ''} onChange={e => onUpdate('status', e.target.value)} />
        <div className="flex items-center gap-2 pt-5">
          <Switch checked={!!f.auto_renew} onCheckedChange={v => onUpdate('auto_renew', v)} />
          <Label className="text-xs">Auto-Verlängerung</Label>
        </div>
      </div>
    </div>
  );

  return (
    <PageShell>
      <ModulePageHeader
        title="Abonnements"
        description="Alle wiederkehrenden Zahlungen und Abonnements zentral verwalten"
        actions={
          <Button
            variant="glass"
            size="icon-round"
            onClick={() => { setShowNew(true); setSelectedId(null); }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

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
          <Badge variant="secondary">{filteredSubs.filter((s: any) => s.status === 'aktiv').length} aktive Abos</Badge>
        </CardContent>
      </Card>

      <WidgetGrid>
        {filteredSubs.map((s: any) => {
          const isSelected = selectedId === s.id;
          const isDemo = isDemoId(s.id);
          const glowVariant = isDemo ? 'emerald' : 'rose';
          return (
            <WidgetCell key={s.id}>
              <div
                className={cn(
                  CARD.BASE, CARD.INTERACTIVE,
                  'h-full flex flex-col justify-between p-5',
                  getActiveWidgetGlow(glowVariant),
                  isSelected && getSelectionRing(glowVariant),
                )}
                onClick={(e) => { e.stopPropagation(); selectCard(s.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); selectCard(s.id); }}}
                role="button"
                tabIndex={0}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isDemo && <Badge className={DEMO_WIDGET.BADGE + ' text-[10px]'}>DEMO</Badge>}
                    <Badge variant={s.status === 'aktiv' ? 'default' : 'secondary'} className="text-[10px]">
                      {s.status || 'aktiv'}
                    </Badge>
                  </div>
                  <div className={HEADER.WIDGET_ICON_BOX}>
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className={TYPOGRAPHY.CARD_TITLE}>{s.custom_name || s.merchant || 'Abonnement'}</h4>
                  <p className="text-xs text-muted-foreground">{catLabel(s.category || 'other')}</p>
                </div>
                <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Betrag</span>
                    <span className="font-semibold">{fmt(s.amount || 0)} / {s.frequency || 'monatlich'}</span>
                  </div>
                </div>
              </div>
            </WidgetCell>
          );
        })}

      </WidgetGrid>

      {/* Detail below grid */}
      {selectedId && form && (
        <Card className="glass-card p-6 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{form.custom_name || form.merchant || 'Abonnement'}</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-6">
            <SubFields form={form} onUpdate={(f, v) => updateField(selectedId, f, v)} />
          </div>
          <div className={RECORD_CARD.ACTIONS}>
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedId)}>Löschen</Button>
            <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>Speichern</Button>
          </div>
        </Card>
      )}

      {showNew && (
        <DesktopOnly>
          <Card className="glass-card p-6 mt-2">
            <div className="flex items-center justify-between mb-4">
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
          </Card>
        </DesktopOnly>
      )}
    </PageShell>
  );
}
