/**
 * FMVorsorgeTab — MOD-11 Menu (4) VORSORGEVERTRÄGE
 * SSOT für Vorsorgeverträge + DRV-Referenz aus Personen
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
import { useVorsorgeContracts, useVorsorgeContractMutations } from '@/hooks/useFinanzmanagerData';
import { Plus, HeartPulse, Trash2 } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

const INTERVALS = [
  { value: 'monatlich', label: 'Monatlich' },
  { value: 'vierteljaehrlich', label: 'Vierteljährlich' },
  { value: 'halbjaehrlich', label: 'Halbjährlich' },
  { value: 'jaehrlich', label: 'Jährlich' },
  { value: 'einmalig', label: 'Einmalig' },
];

function NewVorsorgeForm({ onSubmit, onCancel }: { onSubmit: (v: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({ payment_interval: 'monatlich', status: 'aktiv' });
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Neuer Vorsorgevertrag</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Anbieter</Label><Input value={form.provider || ''} onChange={e => set('provider', e.target.value)} /></div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Vertragsnummer</Label><Input value={form.contract_no || ''} onChange={e => set('contract_no', e.target.value)} /></div>
          <div>
            <Label className={DESIGN.TYPOGRAPHY.LABEL}>Vertragsart</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={form.contract_type || ''} onChange={e => set('contract_type', e.target.value)}>
              <option value="">— wählen —</option>
              <option value="bav">bAV</option>
              <option value="riester">Riester</option>
              <option value="ruerup">Rürup</option>
              <option value="versorgungswerk">Versorgungswerk</option>
              <option value="privat">Privat</option>
              <option value="sonstige">Sonstige</option>
            </select>
          </div>
          <div><Label className={DESIGN.TYPOGRAPHY.LABEL}>Beginn</Label><Input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></div>
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

export default function FMVorsorgeTab() {
  const { data: contracts = [], isLoading } = useVorsorgeContracts();
  const { create, remove } = useVorsorgeContractMutations();
  const [showNew, setShowNew] = useState(false);

  const handleCreate = (values: any) => {
    create.mutate(values);
    setShowNew(false);
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Vorsorgeverträge"
        actions={
          <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew}>
            <Plus className="h-4 w-4 mr-1" /> Vorsorgevertrag
          </Button>
        }
      />

      {showNew && <NewVorsorgeForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} />}

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
      ) : contracts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <HeartPulse className="h-8 w-8 mx-auto mb-3 opacity-40" />
            Noch keine Vorsorgeverträge. Erstelle deinen ersten Vertrag.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {contracts.map((c: any) => (
            <AccordionItem key={c.id} value={c.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <HeartPulse className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-sm">{c.provider || 'Unbekannt'}</span>
                    <div className="flex gap-2 mt-0.5">
                      {c.contract_type && <Badge variant="outline" className="text-[10px]">{c.contract_type}</Badge>}
                      <Badge variant={c.status === 'aktiv' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge>
                    </div>
                  </div>
                  {c.premium && <span className="text-sm font-mono">{c.premium} €</span>}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                  <div><span className="text-muted-foreground">Vertragsnr.:</span> {c.contract_no || '—'}</div>
                  <div><span className="text-muted-foreground">Beginn:</span> {c.start_date || '—'}</div>
                  <div><span className="text-muted-foreground">Intervall:</span> {INTERVALS.find(i => i.value === c.payment_interval)?.label || c.payment_interval}</div>
                </div>
                <div className="flex gap-2 pt-3">
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove.mutate(c.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Löschen
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </PageShell>
  );
}
