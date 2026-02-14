/**
 * FMSachversicherungenTab — MOD-11 Menu (3) SACHVERSICHERUNGEN
 * Zentrale SSOT für alle Versicherungen. Accordion-Widgets + CRUD.
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
import { useInsuranceContracts, useInsuranceContractMutations } from '@/hooks/useFinanzmanagerData';
import { Plus, Shield, Trash2 } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

const CATEGORIES = [
  { value: 'haftpflicht', label: 'Haftpflicht' },
  { value: 'hausrat', label: 'Hausrat' },
  { value: 'wohngebaeude', label: 'Wohngebäude' },
  { value: 'rechtsschutz', label: 'Rechtsschutz' },
  { value: 'kfz', label: 'KFZ' },
  { value: 'unfall', label: 'Unfall' },
  { value: 'berufsunfaehigkeit', label: 'Berufsunfähigkeit' },
  { value: 'sonstige', label: 'Sonstige' },
] as const;

const INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' },
  { value: 'jaehrlich', label: 'Jährlich' },
  { value: 'einmalig', label: 'Einmalig' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  aktiv: 'Aktiv', gekuendigt: 'Gekündigt', ruhend: 'Ruhend', auslaufend: 'Auslaufend',
};

function NewInsuranceForm({ onSubmit, onCancel }: { onSubmit: (v: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({ category: 'haftpflicht', payment_interval: 'monatlich', status: 'aktiv' });
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Neue Versicherung anlegen</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className={DESIGN.TYPOGRAPHY.LABEL}>Kategorie *</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Versicherer</Label><Input value={form.insurer || ''} onChange={e => set('insurer', e.target.value)} /></div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Policen-Nr.</Label><Input value={form.policy_no || ''} onChange={e => set('policy_no', e.target.value)} /></div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Versicherungsnehmer</Label><Input value={form.policyholder || ''} onChange={e => set('policyholder', e.target.value)} /></div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Beginn</Label><Input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Ablauf</Label><Input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} /></div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Beitrag (€)</Label><Input type="number" value={form.premium || ''} onChange={e => set('premium', e.target.value)} /></div>
          <div>
            <Label className={DESIGN.TYPOGRAPHY.LABEL}>Intervall</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.payment_interval} onChange={e => set('payment_interval', e.target.value)}>
              {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSubmit(form)}>Anlegen</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Abbrechen</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FMSachversicherungenTab() {
  const { data: contracts = [], isLoading } = useInsuranceContracts();
  const { create, remove } = useInsuranceContractMutations();
  const [showNew, setShowNew] = useState(false);

  const handleCreate = (values: any) => {
    create.mutate(values);
    setShowNew(false);
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="SACHVERSICHERUNGEN"
        actions={
          <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew}>
            <Plus className="h-4 w-4 mr-1" /> Versicherung
          </Button>
        }
      />

      {showNew && <NewInsuranceForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
      ) : contracts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-3 opacity-40" />
            Noch keine Versicherungen angelegt. Erstelle deine erste Versicherung.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {contracts.map((c: any) => {
            const catLabel = CATEGORIES.find(cat => cat.value === c.category)?.label || c.category;
            return (
              <AccordionItem key={c.id} value={c.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-sm">{c.insurer || 'Unbekannt'} — {catLabel}</span>
                      <div className="flex gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{catLabel}</Badge>
                        <Badge variant={c.status === 'aktiv' ? 'default' : 'secondary'} className="text-[10px]">
                          {STATUS_LABELS[c.status] || c.status}
                        </Badge>
                      </div>
                    </div>
                    {c.premium && <span className="text-sm font-mono">{c.premium} €</span>}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm pt-2">
                    <div><span className="text-muted-foreground">Policen-Nr.:</span> {c.policy_no || '—'}</div>
                    <div><span className="text-muted-foreground">VN:</span> {c.policyholder || '—'}</div>
                    <div><span className="text-muted-foreground">Beginn:</span> {c.start_date || '—'}</div>
                    <div><span className="text-muted-foreground">Ablauf:</span> {c.end_date || '—'}</div>
                    <div><span className="text-muted-foreground">Intervall:</span> {INTERVALS.find(i => i.value === c.payment_interval)?.label || c.payment_interval}</div>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove.mutate(c.id)}>
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
