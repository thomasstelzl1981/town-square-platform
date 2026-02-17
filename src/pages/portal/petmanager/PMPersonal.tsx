/**
 * PMPersonal — Vertikales Widget-Layout: Mitarbeiter links, Inline-Akte rechts
 */
import { useState } from 'react';
import { Plus, Save, Trash2, X, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useMyProvider } from '@/hooks/usePetBookings';
import { useProviderStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, type PetStaff } from '@/hooks/usePetStaff';
import { PageShell } from '@/components/shared/PageShell';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = ['Hundefriseur', 'Gassigeher', 'Betreuer', 'Trainer', 'Tierarzthelfer'];
const SERVICE_OPTIONS = ['Gassi', 'Tagesstätte', 'Hundesalon', 'Training', 'Tierarzt'];

const EMPTY_STAFF = { name: '', role: 'Betreuer', email: '', phone: '', is_active: true, services: [] as string[], sort_order: 0 };

export default function PMPersonal() {
  const { data: provider } = useMyProvider();
  const { data: staff = [] } = useProviderStaff(provider?.id);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const allStaff = staff;

  const handleCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm(EMPTY_STAFF);
    setSelectedServices([]);
  };

  const handleSelect = (member: PetStaff) => {
    setIsCreating(false);
    setSelectedId(member.id);
    setForm({
      name: member.name, role: member.role, email: member.email || '',
      phone: member.phone || '', is_active: member.is_active,
      services: member.services || [], sort_order: member.sort_order,
    });
    setSelectedServices(member.services || []);
  };

  const handleClose = () => { setSelectedId(null); setIsCreating(false); };

  const toggleService = (svc: string) => {
    setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form, services: selectedServices };
    if (selectedId) {
      await updateStaff.mutateAsync({ id: selectedId, ...payload });
    } else {
      await createStaff.mutateAsync({ ...payload, provider_id: provider!.id });
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteStaff.mutateAsync(selectedId);
    handleClose();
  };

  const showAkte = selectedId || isCreating;

  if (!provider) {
    return (
      <PageShell>
        <div className="space-y-6">
          <ModulePageHeader title="Mitarbeiter" description="Teammitglieder und Dienstleistungszuordnung" />
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
        <ModulePageHeader
          title="Mitarbeiter"
          description="Teammitglieder und Dienstleistungszuordnung"
          actions={
            <Button variant="glass" size="icon-round" onClick={handleCreate}>
              <Plus className="h-5 w-5" />
            </Button>
          }
        />

        {/* Main: Widgets left + Akte right */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: Vertical widget column */}
          <div className="md:w-48 lg:w-56 flex-shrink-0">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible md:max-h-[calc(100vh-220px)] md:overflow-y-auto pb-2 md:pb-0 md:pr-1">
              {allStaff.map(member => {
                const isSelected = selectedId === member.id;
                return (
                  <Card
                    key={member.id}
                    className={cn(
                      'relative overflow-hidden cursor-pointer hover:shadow-md transition-all flex-shrink-0',
                      'w-36 md:w-full aspect-square',
                      isSelected && 'ring-2 ring-primary shadow-lg',
                      member.is_active ? 'border-primary/20' : 'border-muted opacity-60',
                    )}
                    onClick={() => handleSelect(member)}
                  >
                    <div className={cn('h-1.5', member.is_active ? 'bg-primary' : 'bg-muted')} />
                    <CardContent className="p-3 flex flex-col justify-between h-[calc(100%-6px)]">
                      <div>
                        <span className="text-sm font-medium truncate block">{member.name}</span>
                        <span className="text-[10px] text-muted-foreground">{member.role}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(member.services || []).slice(0, 3).map(s => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1 py-0">{s}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {member.phone && <Phone className="h-2.5 w-2.5" />}
                          {member.email && <Mail className="h-2.5 w-2.5" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {allStaff.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Mitarbeiter angelegt.
                </div>
              )}
            </div>
          </div>

          {/* Right: Inline Akte */}
          {showAkte && (
            <div className="flex-1 min-w-0">
              <Card>
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                      {isCreating ? 'Neuer Mitarbeiter' : `Mitarbeiterakte: ${form.name}`}
                    </h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Basisdaten */}
                    <div className="space-y-3">
                      <div>
                        <Label>Name *</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Vor- und Nachname" />
                      </div>
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
                        <div>
                          <Label>E-Mail</Label>
                          <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@beispiel.de" />
                        </div>
                        <div>
                          <Label>Telefon</Label>
                          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0171 1234567" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                        <Label>Aktiv</Label>
                      </div>
                    </div>

                    {/* Dienstleistungen */}
                    <div className="border-t pt-4 mt-2">
                      <h3 className="text-sm font-semibold mb-2">Dienstleistungen</h3>
                      <div className="flex flex-wrap gap-1.5">
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

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={handleSave} disabled={createStaff.isPending || updateStaff.isPending}>
                        <Save className="h-4 w-4 mr-1" /> Speichern
                      </Button>
                      {selectedId && (
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteStaff.isPending}>
                          <Trash2 className="h-4 w-4 mr-1" /> Löschen
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Placeholder when no akte open */}
          {!showAkte && allStaff.length > 0 && (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-muted-foreground">Mitarbeiter auswählen oder neuen Mitarbeiter anlegen</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
