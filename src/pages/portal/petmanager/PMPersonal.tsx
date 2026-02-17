/**
 * PMPersonal — Vertikales Widget-Layout: Mitarbeiter links, Inline-Akte rechts
 * Erweitert um Arbeitszeiten-Sektion und Urlaubs-Sektion
 */
import { useState } from 'react';
import { Plus, Save, Trash2, X, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useMyProvider } from '@/hooks/usePetBookings';
import {
  useProviderStaff, useCreateStaff, useUpdateStaff, useDeleteStaff,
  useStaffVacations, useCreateVacation, useDeleteVacation,
  type PetStaff,
} from '@/hooks/usePetStaff';
import { PageShell } from '@/components/shared/PageShell';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = ['Hundefriseur', 'Gassigeher', 'Betreuer', 'Trainer', 'Tierarzthelfer'];
const SERVICE_OPTIONS = ['Gassi', 'Tagesstätte', 'Hundesalon', 'Training', 'Tierarzt'];

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = { mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So' };

type WorkDay = { start: string; end: string } | null;
type WorkHours = Record<string, WorkDay>;

const DEFAULT_WORK_HOURS: WorkHours = {
  mon: { start: '08:00', end: '17:00' }, tue: { start: '08:00', end: '17:00' },
  wed: { start: '08:00', end: '17:00' }, thu: { start: '08:00', end: '17:00' },
  fri: { start: '08:00', end: '17:00' }, sat: null, sun: null,
};

const VACATION_TYPE_OPTIONS = [
  { value: 'urlaub', label: 'Urlaub' },
  { value: 'krank', label: 'Krank' },
  { value: 'frei', label: 'Frei' },
];

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
  const [workHours, setWorkHours] = useState<WorkHours>(DEFAULT_WORK_HOURS);

  // Vacation state
  const { data: vacations = [] } = useStaffVacations(selectedId || undefined);
  const createVacation = useCreateVacation();
  const deleteVacation = useDeleteVacation();
  const [newVacation, setNewVacation] = useState<{ start_date: string; end_date: string; vacation_type: string; notes: string } | null>(null);

  const allStaff = staff;

  const handleCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm(EMPTY_STAFF);
    setSelectedServices([]);
    setWorkHours(DEFAULT_WORK_HOURS);
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
    setWorkHours((member.work_hours as WorkHours) || DEFAULT_WORK_HOURS);
    setNewVacation(null);
  };

  const handleClose = () => { setSelectedId(null); setIsCreating(false); setNewVacation(null); };

  const toggleService = (svc: string) => {
    setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  };

  const toggleDay = (day: string) => {
    setWorkHours(prev => ({
      ...prev,
      [day]: prev[day] ? null : { start: '08:00', end: '17:00' },
    }));
  };

  const updateDayTime = (day: string, field: 'start' | 'end', value: string) => {
    setWorkHours(prev => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { start: '08:00', end: '17:00', [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form, services: selectedServices, work_hours: workHours };
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

  const handleAddVacation = async () => {
    if (!newVacation || !selectedId || !newVacation.start_date || !newVacation.end_date) return;
    await createVacation.mutateAsync({ staff_id: selectedId, ...newVacation });
    setNewVacation(null);
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

                    {/* Arbeitszeiten */}
                    <div className="border-t pt-4 mt-2">
                      <h3 className="text-sm font-semibold mb-2">Arbeitszeiten</h3>
                      <div className="space-y-1.5">
                        {DAY_KEYS.map(day => {
                          const active = !!workHours[day];
                          return (
                            <div key={day} className="flex items-center gap-2">
                              <Switch checked={active} onCheckedChange={() => toggleDay(day)} className="scale-75" />
                              <span className="w-6 text-xs font-medium text-muted-foreground">{DAY_LABELS[day]}</span>
                              {active ? (
                                <>
                                  <Input
                                    type="time"
                                    value={workHours[day]?.start || '08:00'}
                                    onChange={e => updateDayTime(day, 'start', e.target.value)}
                                    className="w-24 h-7 text-xs"
                                  />
                                  <span className="text-xs text-muted-foreground">–</span>
                                  <Input
                                    type="time"
                                    value={workHours[day]?.end || '17:00'}
                                    onChange={e => updateDayTime(day, 'end', e.target.value)}
                                    className="w-24 h-7 text-xs"
                                  />
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Frei</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Urlaub / Abwesenheiten */}
                    {selectedId && (
                      <div className="border-t pt-4 mt-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">Urlaub / Abwesenheiten</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setNewVacation({ start_date: '', end_date: '', vacation_type: 'urlaub', notes: '' })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Neu
                          </Button>
                        </div>

                        {/* Existing vacations */}
                        {vacations.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {vacations.map(v => (
                              <div key={v.id} className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1.5">
                                <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="font-medium">{v.start_date} – {v.end_date}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                  {VACATION_TYPE_OPTIONS.find(t => t.value === v.vacation_type)?.label || v.vacation_type}
                                </Badge>
                                {v.notes && <span className="text-muted-foreground truncate">{v.notes}</span>}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 ml-auto flex-shrink-0"
                                  onClick={() => deleteVacation.mutate(v.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {vacations.length === 0 && !newVacation && (
                          <p className="text-xs text-muted-foreground">Keine Einträge vorhanden.</p>
                        )}

                        {/* New vacation inline form */}
                        {newVacation && (
                          <div className="flex flex-wrap items-end gap-2 bg-muted/30 rounded p-2">
                            <div>
                              <Label className="text-[10px]">Von</Label>
                              <Input
                                type="date"
                                value={newVacation.start_date}
                                onChange={e => setNewVacation(v => v && ({ ...v, start_date: e.target.value }))}
                                className="w-32 h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px]">Bis</Label>
                              <Input
                                type="date"
                                value={newVacation.end_date}
                                onChange={e => setNewVacation(v => v && ({ ...v, end_date: e.target.value }))}
                                className="w-32 h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px]">Typ</Label>
                              <Select
                                value={newVacation.vacation_type}
                                onValueChange={val => setNewVacation(v => v && ({ ...v, vacation_type: val }))}
                              >
                                <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {VACATION_TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 min-w-[100px]">
                              <Label className="text-[10px]">Notiz</Label>
                              <Input
                                value={newVacation.notes}
                                onChange={e => setNewVacation(v => v && ({ ...v, notes: e.target.value }))}
                                className="h-7 text-xs"
                                placeholder="Optional"
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs" onClick={handleAddVacation} disabled={createVacation.isPending}>
                                <Save className="h-3 w-3 mr-1" /> OK
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setNewVacation(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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
