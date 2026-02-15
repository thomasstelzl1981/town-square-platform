/**
 * FMAbonnementsTab — MOD-11 Menu (5) ABONNEMENTS
 * RecordCard-Pattern: Geschlossen = quadratisches Widget, Offen = volle Breite
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { FormInput } from '@/components/shared';
import { useUserSubscriptions, useUserSubscriptionMutations } from '@/hooks/useFinanzmanagerData';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Repeat } from 'lucide-react';
import { DESIGN, RECORD_CARD } from '@/config/designManifest';
import { cn } from '@/lib/utils';

const SUB_CATEGORIES = [
  { value: 'streaming_video', label: 'Streaming (Video)' },
  { value: 'streaming_music', label: 'Streaming (Musik)' },
  { value: 'cloud_storage', label: 'Cloud Storage' },
  { value: 'software_saas', label: 'Software/SaaS' },
  { value: 'news_media', label: 'News & Medien' },
  { value: 'ecommerce_membership', label: 'E-Commerce' },
  { value: 'telecom_mobile', label: 'Mobilfunk' },
  { value: 'internet', label: 'Internet' },
  { value: 'utilities_energy', label: 'Energie' },
  { value: 'mobility', label: 'Mobilität' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'other', label: 'Sonstiges' },
];

const SEED_MERCHANTS = [
  'Amazon Prime', 'Netflix', 'Disney+', 'Spotify', 'Apple Music',
  'YouTube Premium', 'Microsoft 365', 'Adobe CC', 'Google One', 'Dropbox',
  'Zeit Online', 'FAZ+', 'Handelsblatt', 'Spiegel+', 'SZ Plus', 'Canva Pro',
];

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

function AboRecordCard({ sub, onUpdate, onDelete }: {
  sub: any;
  onUpdate: (values: any) => void;
  onDelete: (id: string) => void;
}) {
  const { activeTenantId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(sub);

  const set = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));

  const catLabel = SUB_CATEGORIES.find(c => c.value === sub.category)?.label || sub.category || '';
  const freqLabel = sub.frequency === 'jaehrlich' ? 'Jahr' : 'Monat';

  return (
    <RecordCard
      id={sub.id}
      entityType="subscription"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      title={sub.custom_name || sub.merchant || 'Unbekannt'}
      subtitle={catLabel}
      summary={[
        ...(sub.amount ? [{ label: 'Betrag', value: `${eurFormat.format(Number(sub.amount))}/${freqLabel}` }] : []),
        ...(sub.merchant ? [{ label: 'Anbieter', value: sub.merchant }] : []),
        ...(sub.frequency ? [{ label: 'Frequenz', value: sub.frequency }] : []),
      ]}
      badges={[
        ...(catLabel ? [{ label: catLabel, variant: 'outline' as const }] : []),
        { label: sub.status || 'aktiv', variant: sub.status === 'aktiv' ? 'default' as const : 'secondary' as const },
        ...(sub.auto_renew ? [{ label: 'Auto-Renew', variant: 'outline' as const }] : []),
      ]}
      tenantId={activeTenantId || undefined}
      onSave={() => onUpdate(form)}
      onDelete={() => onDelete(sub.id)}
      saving={false}
    >
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Abo-Details</p>
        <div className={RECORD_CARD.FIELD_GRID}>
          <FormInput label="Name" name="custom_name" value={form.custom_name || ''} onChange={e => set('custom_name', e.target.value)} placeholder="z.B. Netflix Premium" />
          <FormInput label="Anbieter/Merchant" name="merchant" value={form.merchant || ''} onChange={e => set('merchant', e.target.value)} />
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Kategorie</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.category || 'other'} onChange={e => set('category', e.target.value)}>
              {SUB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Frequenz</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.frequency || 'monatlich'} onChange={e => set('frequency', e.target.value)}>
              <option value="monatlich">Monatlich</option>
              <option value="jaehrlich">Jährlich</option>
              <option value="quartalsweise">Quartalsweise</option>
            </select>
          </div>
          <FormInput label="Betrag (€)" name="amount" type="number" value={form.amount || ''} onChange={e => set('amount', e.target.value)} />
          <div>
            <label className={DESIGN.TYPOGRAPHY.LABEL}>Status</label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.status || 'aktiv'} onChange={e => set('status', e.target.value)}>
              <option value="aktiv">Aktiv</option>
              <option value="gekuendigt">Gekündigt</option>
              <option value="pausiert">Pausiert</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={form.auto_renew ?? true} onCheckedChange={v => set('auto_renew', v)} />
            <label className="text-sm">Auto-Renew</label>
          </div>
        </div>
      </div>

      {/* Notizen */}
      <div>
        <p className={RECORD_CARD.SECTION_TITLE}>Notizen</p>
        <textarea
          className="w-full min-h-[60px] rounded-md border px-3 py-2 text-sm bg-background resize-y"
          value={form.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Notizen zum Abonnement..."
        />
      </div>
    </RecordCard>
  );
}

export default function FMAbonnementsTab() {
  const { data: subs = [], isLoading } = useUserSubscriptions();
  const { create, update, remove } = useUserSubscriptionMutations();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, any>>({ category: 'other', frequency: 'monatlich', status: 'aktiv', auto_renew: true });

  const totalMonthly = subs.reduce((sum: number, s: any) => {
    const amt = Number(s.amount) || 0;
    if (s.frequency === 'jaehrlich') return sum + amt / 12;
    return sum + amt;
  }, 0);

  const handleCreate = () => {
    create.mutate(newForm);
    setShowNew(false);
    setNewForm({ category: 'other', frequency: 'monatlich', status: 'aktiv', auto_renew: true });
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="ABONNEMENTS"
        description={subs.length > 0 ? `Monatliche Kosten: ~${eurFormat.format(totalMonthly)}` : undefined}
      />

      {isLoading ? (
        <div className={RECORD_CARD.GRID}>
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      ) : (
        <div className={RECORD_CARD.GRID}>
          {subs.map((s: any) => (
            <AboRecordCard
              key={s.id}
              sub={s}
              onUpdate={(values) => update.mutate(values)}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}

          {/* New Subscription Form */}
          {showNew ? (
            <div className={cn(RECORD_CARD.OPEN)}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Repeat className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Neues Abonnement</h2>
                </div>
              </div>

              {/* Seed Merchant Chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {SEED_MERCHANTS.map(m => (
                  <Button key={m} size="sm" variant="outline" className="text-xs h-7"
                    onClick={() => setNewForm(prev => ({ ...prev, merchant: m, custom_name: m }))}>
                    {m}
                  </Button>
                ))}
              </div>

              <div className={RECORD_CARD.FIELD_GRID}>
                <FormInput label="Name" name="custom_name" value={newForm.custom_name || ''} onChange={e => setNewForm(prev => ({ ...prev, custom_name: e.target.value }))} placeholder="z.B. Netflix Premium" />
                <FormInput label="Anbieter/Merchant" name="merchant" value={newForm.merchant || ''} onChange={e => setNewForm(prev => ({ ...prev, merchant: e.target.value }))} />
                <div>
                  <label className={DESIGN.TYPOGRAPHY.LABEL}>Kategorie</label>
                  <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={newForm.category || 'other'} onChange={e => setNewForm(prev => ({ ...prev, category: e.target.value }))}>
                    {SUB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <FormInput label="Betrag (€)" name="amount" type="number" value={newForm.amount || ''} onChange={e => setNewForm(prev => ({ ...prev, amount: e.target.value }))} />
                <div>
                  <label className={DESIGN.TYPOGRAPHY.LABEL}>Frequenz</label>
                  <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={newForm.frequency || 'monatlich'} onChange={e => setNewForm(prev => ({ ...prev, frequency: e.target.value }))}>
                    <option value="monatlich">Monatlich</option>
                    <option value="jaehrlich">Jährlich</option>
                    <option value="quartalsweise">Quartalsweise</option>
                  </select>
                </div>
              </div>
              <div className={RECORD_CARD.ACTIONS}>
                <Button size="sm" variant="outline" onClick={() => { setShowNew(false); setNewForm({ category: 'other', frequency: 'monatlich', status: 'aktiv', auto_renew: true }); }}>Abbrechen</Button>
                <Button size="sm" onClick={handleCreate}>Anlegen</Button>
              </div>
            </div>
          ) : (
            /* CTA Widget */
            <div
              className={cn(RECORD_CARD.CLOSED, 'border-dashed border-2 border-primary/20')}
              onClick={() => setShowNew(true)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setShowNew(true)}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Abonnement hinzufügen</span>
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
