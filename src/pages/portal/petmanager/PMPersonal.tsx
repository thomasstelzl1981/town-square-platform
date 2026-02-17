/**
 * PMPersonal — Mitarbeiterverwaltung (eigene Seite)
 * Extracted from PMServices: Staff Widgets + CRUD Dialog
 */
import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Save, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMyProvider } from '@/hooks/usePetBookings';
import { useProviderStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, type PetStaff } from '@/hooks/usePetStaff';
import { PageShell } from '@/components/shared/PageShell';

const ROLE_OPTIONS = ['Hundefriseur', 'Gassigeher', 'Betreuer', 'Trainer', 'Tierarzthelfer'];
const SERVICE_OPTIONS = ['Gassi', 'Tagesstätte', 'Hundesalon', 'Training', 'Tierarzt'];

const EMPTY_STAFF = { name: '', role: 'Betreuer', email: '', phone: '', is_active: true, services: [] as string[], sort_order: 0 };

export default function PMPersonal() {
  const { data: provider } = useMyProvider();
  const { data: staff = [] } = useProviderStaff(provider?.id);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const activeStaff = staff.filter(s => s.is_active);
  const inactiveStaff = staff.filter(s => !s.is_active);

  const openCreate = () => { setEditId(null); setForm(EMPTY_STAFF); setSelectedServices([]); setDialogOpen(true); };
  const openEdit = (s: PetStaff) => {
    setEditId(s.id);
    setForm({ name: s.name, role: s.role, email: s.email || '', phone: s.phone || '', is_active: s.is_active, services: s.services || [], sort_order: s.sort_order });
    setSelectedServices(s.services || []);
    setDialogOpen(true);
  };

  const toggleService = (svc: string) => {
    setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form, services: selectedServices };
    if (editId) {
      await updateStaff.mutateAsync({ id: editId, ...payload });
    } else {
      await createStaff.mutateAsync({ ...payload, provider_id: provider!.id });
    }
    setDialogOpen(false);
  };

  if (!provider) {
    return (
      <PageShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mitarbeiter</h1>
          </div>
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
            <p className="text-muted-foreground">Kein Provider-Profil gefunden.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Mitarbeiter</h1>
        </div>

        {/* Active Staff Widgets */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Aktive Mitarbeiter ({activeStaff.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activeStaff.map(member => (
              <Card key={member.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-primary" />
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{member.name}</span>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); openEdit(member); }}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); deleteStaff.mutate(member.id); }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">{member.role}</p>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {(member.services || []).slice(0, 3).map(s => (
                      <Badge key={s} variant="outline" className="text-[9px] px-1 py-0">{s}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {member.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{member.phone}</span>}
                    {member.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{member.email}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* + Mitarbeiter anlegen */}
            <Card
              className="border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all flex items-center justify-center min-h-[100px]"
              onClick={openCreate}
            >
              <div className="text-center text-muted-foreground">
                <Plus className="h-6 w-6 mx-auto mb-1" />
                <span className="text-xs">Mitarbeiter anlegen</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Inactive Staff */}
        {inactiveStaff.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Inaktive Mitarbeiter ({inactiveStaff.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {inactiveStaff.map(member => (
                <Card key={member.id} className="relative overflow-hidden opacity-60 hover:opacity-80 transition-opacity">
                  <div className="h-1 bg-muted" />
                  <CardContent className="pt-3 pb-3 px-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{member.name}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(member)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{member.role}</p>
                    <Badge variant="secondary" className="text-[9px] mt-1">Inaktiv</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Staff Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Vor- und Nachname" /></div>
              <div>
                <Label>Rolle</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>E-Mail</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Dienstleistungen</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SERVICE_OPTIONS.map(s => (
                    <Badge
                      key={s}
                      variant={selectedServices.includes(s) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleService(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Aktiv</Label>
              </div>
              <Button onClick={handleSave} disabled={createStaff.isPending || updateStaff.isPending} className="w-full">
                <Save className="h-4 w-4 mr-1" /> Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
