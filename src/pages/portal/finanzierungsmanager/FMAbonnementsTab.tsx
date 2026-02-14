/**
 * FMAbonnementsTab — MOD-11 Menu (5) ABONNEMENTS
 * SSOT für Nutzer-Abonnements + Erkennung über Scan
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useUserSubscriptions, useUserSubscriptionMutations } from '@/hooks/useFinanzmanagerData';
import { Plus, Repeat, Trash2 } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

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
] as const;

const SEED_MERCHANTS = [
  'Amazon Prime', 'Netflix', 'Disney+', 'Spotify', 'Apple Music',
  'YouTube Premium', 'Microsoft 365', 'Adobe CC', 'Google One', 'Dropbox',
  'Zeit Online', 'FAZ+', 'Handelsblatt', 'Spiegel+', 'SZ Plus',
  'Canva Pro',
];

function NewSubscriptionForm({ onSubmit, onCancel }: { onSubmit: (v: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({ category: 'other', frequency: 'monatlich', status: 'aktiv', auto_renew: true });
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Neues Abonnement</h3>

        {/* Merchant Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {SEED_MERCHANTS.map(m => (
            <Button key={m} size="sm" variant="outline" className="text-xs h-7"
              onClick={() => set('merchant', m)}>
              {m}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Name</Label><Input value={form.custom_name || ''} onChange={e => set('custom_name', e.target.value)} placeholder="z.B. Netflix Premium" /></div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Anbieter/Merchant</Label><Input value={form.merchant || ''} onChange={e => set('merchant', e.target.value)} /></div>
          <div>
            <Label className={DESIGN.TYPOGRAPHY.LABEL}>Kategorie</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.category} onChange={e => set('category', e.target.value)}>
              {SUB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <Label className={DESIGN.TYPOGRAPHY.LABEL}>Frequenz</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
              <option value="monatlich">Monatlich</option>
              <option value="jaehrlich">Jährlich</option>
              <option value="quartalsweise">Quartalsweise</option>
            </select>
          </div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Betrag (€)</Label><Input type="number" value={form.amount || ''} onChange={e => set('amount', e.target.value)} /></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSubmit(form)}>Anlegen</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Abbrechen</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FMAbonnementsTab() {
  const { data: subs = [], isLoading } = useUserSubscriptions();
  const { create, remove } = useUserSubscriptionMutations();
  const [showNew, setShowNew] = useState(false);

  const handleCreate = (values: any) => {
    create.mutate(values);
    setShowNew(false);
  };

  // Group by category
  const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const totalMonthly = subs.reduce((sum: number, s: any) => {
    const amt = Number(s.amount) || 0;
    if (s.frequency === 'jaehrlich') return sum + amt / 12;
    return sum + amt;
  }, 0);

  return (
    <PageShell>
      <ModulePageHeader
        title="ABONNEMENTS"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">~{eurFormat.format(totalMonthly)}/Monat</span>
            <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew}>
              <Plus className="h-4 w-4 mr-1" /> Abonnement
            </Button>
          </div>
        }
      />

      {showNew && <NewSubscriptionForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
      ) : subs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Repeat className="h-8 w-8 mx-auto mb-3 opacity-40" />
            Noch keine Abonnements. Erstelle dein erstes Abo oder nutze den Scan in der Übersicht.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {subs.map((s: any) => {
            const catLabel = SUB_CATEGORIES.find(c => c.value === s.category)?.label || s.category;
            return (
              <AccordionItem key={s.id} value={s.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <Repeat className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-sm">{s.custom_name || s.merchant || 'Unbekannt'}</span>
                      <div className="flex gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{catLabel}</Badge>
                        <Badge variant={s.status === 'aktiv' ? 'default' : 'secondary'} className="text-[10px]">{s.status}</Badge>
                        {s.auto_renew && <Badge variant="outline" className="text-[10px]">Auto-Renew</Badge>}
                      </div>
                    </div>
                    {s.amount && <span className="text-sm font-mono">{eurFormat.format(Number(s.amount))}/{s.frequency === 'jaehrlich' ? 'Jahr' : 'Monat'}</span>}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                    <div><span className="text-muted-foreground">Merchant:</span> {s.merchant || '—'}</div>
                    <div><span className="text-muted-foreground">Frequenz:</span> {s.frequency}</div>
                    {s.last_payment_date && <div><span className="text-muted-foreground">Letzte Zahlung:</span> {s.last_payment_date}</div>}
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove.mutate(s.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Löschen
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </PageShell>
  );
}
