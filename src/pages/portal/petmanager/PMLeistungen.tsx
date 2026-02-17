/**
 * PMLeistungen — Provider Services CRUD + Verfügbarkeit
 */
import { useState } from 'react';
import { Settings, Plus, Trash2, Edit2, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RECORD_CARD } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import {
  useMyProvider, useProviderServices, useCreateService, useUpdateService, useDeleteService,
  useProviderAvailability, useSaveAvailability,
  type PetService, type ProviderAvailability,
} from '@/hooks/usePetBookings';

const CATEGORY_LABELS: Record<string, string> = {
  grooming: 'Pflege', boarding: 'Pension', walking: 'Gassi', training: 'Training',
  veterinary: 'Tierarzt', sitting: 'Betreuung', daycare: 'Tagesbetreuung',
  transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Festpreis', hourly: 'Pro Stunde', daily: 'Pro Tag', per_session: 'Pro Sitzung', on_request: 'Auf Anfrage',
};

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const EMPTY_SERVICE = { title: '', description: '', category: 'other', duration_minutes: 60, price_cents: 0, price_type: 'fixed', species_allowed: [] as string[], is_active: true };

export default function PMLeistungen() {
  const { data: provider } = useMyProvider();
  const { data: services = [] } = useProviderServices(provider?.id);
  const { data: availability = [] } = useProviderAvailability(provider?.id);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const saveAvailability = useSaveAvailability();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_SERVICE);
  const [availSlots, setAvailSlots] = useState<Omit<ProviderAvailability, 'id' | 'provider_id' | 'tenant_id'>[]>([]);
  const [availInited, setAvailInited] = useState(false);

  // Sync availability on first load
  if (availability.length > 0 && !availInited) {
    setAvailSlots(availability.map(({ day_of_week, start_time, end_time, max_bookings, is_active }) => ({ day_of_week, start_time, end_time, max_bookings, is_active })));
    setAvailInited(true);
  }

  if (!provider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Leistungen & Verfügbarkeit</h1>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Kein Provider-Profil gefunden. Bitte wenden Sie sich an den Administrator.</p>
        </div>
      </div>
    );
  }

  const openCreate = () => { setEditId(null); setForm(EMPTY_SERVICE); setDialogOpen(true); };
  const openEdit = (s: PetService) => { setEditId(s.id); setForm({ title: s.title, description: s.description || '', category: s.category, duration_minutes: s.duration_minutes, price_cents: s.price_cents, price_type: s.price_type, species_allowed: s.species_allowed, is_active: s.is_active }); setDialogOpen(true); };

  const handleSaveService = async () => {
    if (!form.title.trim()) return;
    if (editId) {
      await updateService.mutateAsync({ id: editId, ...form });
    } else {
      await createService.mutateAsync({ ...form, provider_id: provider.id });
    }
    setDialogOpen(false);
  };

  const addAvailSlot = () => setAvailSlots(prev => [...prev, { day_of_week: 1, start_time: '09:00', end_time: '17:00', max_bookings: 1, is_active: true }]);
  const removeAvailSlot = (i: number) => setAvailSlots(prev => prev.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: string, value: any) => setAvailSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSaveAvail = () => { if (provider) saveAvailability.mutate({ providerId: provider.id, slots: availSlots }); };

  return (
    <PageShell>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Leistungen & Verfügbarkeit</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-4 w-4" /> Service</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Service bearbeiten' : 'Neuer Service'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Titel *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kategorie</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preismodell</Label>
                  <Select value={form.price_type} onValueChange={v => setForm(f => ({ ...f, price_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PRICE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dauer (Min.)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} /></div>
                <div><Label>Preis (€)</Label><Input type="number" step="0.01" value={(form.price_cents / 100).toFixed(2)} onChange={e => setForm(f => ({ ...f, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) }))} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Aktiv</Label>
              </div>
              <Button onClick={handleSaveService} disabled={createService.isPending || updateService.isPending} className="w-full">Speichern</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Meine Services ({services.length})</CardTitle></CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Services. Erstellen Sie Ihren ersten Service.</p>
          ) : (
            <div className="space-y-2">
              {services.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[s.category] || s.category} · {s.duration_minutes} Min. · {s.price_type === 'on_request' ? 'Auf Anfrage' : `${(s.price_cents / 100).toFixed(2)} €`}
                    </p>
                  </div>
                  <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-[10px]">{s.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteService.mutate(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Verfügbarkeit</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addAvailSlot}><Plus className="h-3.5 w-3.5 mr-1" /> Slot</Button>
              <Button size="sm" onClick={handleSaveAvail} disabled={saveAvailability.isPending}><Save className="h-3.5 w-3.5 mr-1" /> Speichern</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {availSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Keine Verfügbarkeit definiert.</p>
          ) : (
            <div className="space-y-2">
              {availSlots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20">
                  <Select value={String(slot.day_of_week)} onValueChange={v => updateSlot(i, 'day_of_week', parseInt(v))}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>{DAY_LABELS.map((d, idx) => <SelectItem key={idx} value={String(idx)}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="time" value={slot.start_time} onChange={e => updateSlot(i, 'start_time', e.target.value)} className="w-28" />
                  <span className="text-xs text-muted-foreground">–</span>
                  <Input type="time" value={slot.end_time} onChange={e => updateSlot(i, 'end_time', e.target.value)} className="w-28" />
                  <Input type="number" min={1} value={slot.max_bookings} onChange={e => updateSlot(i, 'max_bookings', parseInt(e.target.value) || 1)} className="w-16" title="Max Buchungen" />
                  <Button variant="ghost" size="icon" onClick={() => removeAvailSlot(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageShell>
  );
}
