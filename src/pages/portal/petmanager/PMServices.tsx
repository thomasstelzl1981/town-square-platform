/**
 * PMServices — Services-Bereich: Mitarbeiter-Widgets + Terminkalender
 */
import { useState, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, Save, ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMyProvider, useBookings } from '@/hooks/usePetBookings';
import { useProviderStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, type PetStaff } from '@/hooks/usePetStaff';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

const ROLE_OPTIONS = ['Hundefriseur', 'Gassigeher', 'Betreuer', 'Trainer', 'Tierarzthelfer'];
const SERVICE_OPTIONS = ['Gassi', 'Tagesstätte', 'Hundesalon', 'Training', 'Tierarzt'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const EMPTY_STAFF = { name: '', role: 'Betreuer', email: '', phone: '', is_active: true, services: [] as string[], sort_order: 0 };

export default function PMServices() {
  const { data: provider } = useMyProvider();
  const { data: staff = [] } = useProviderStaff(provider?.id);
  const { data: bookings = [] } = useBookings(provider ? { providerId: provider.id } : undefined);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const activeStaff = staff.filter(s => s.is_active);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);

  // Service bookings (non-pension)
  const serviceBookings = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status));

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
            <h1 className="text-2xl font-bold">Services</h1>
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
          <h1 className="text-2xl font-bold">Services</h1>
        </div>

        {/* Mitarbeiter-Widgets */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activeStaff.map(member => {
              const memberBookings = serviceBookings.filter(b => {
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                return b.scheduled_date === todayStr;
              });
              return (
                <Card key={member.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-1 bg-primary" />
                  <CardContent className="pt-3 pb-3 px-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{member.name}</span>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(member)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteStaff.mutate(member.id)}>
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
                      {member.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" /></span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

        {/* Terminkalender */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Terminkalender</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[140px] text-center">
                {format(weekStart, 'dd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="link" size="sm" className="text-xs h-5" onClick={() => setCurrentDate(new Date())}>Heute</Button>
            </div>
          </div>

          {activeStaff.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">Legen Sie zuerst Mitarbeiter an, um den Terminkalender zu sehen.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b font-medium text-muted-foreground w-28">Mitarbeiter</th>
                      {weekDays.map(day => (
                        <th key={day.toISOString()} className={cn(
                          'p-2 border-b font-medium text-center min-w-[80px]',
                          isToday(day) ? 'text-primary bg-primary/5' : 'text-muted-foreground',
                        )}>
                          <div>{format(day, 'EEE', { locale: de })}</div>
                          <div className="text-[10px]">{format(day, 'dd.MM.')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeStaff.map(member => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">
                          <div>{member.name}</div>
                          <span className="text-[10px] text-muted-foreground">{member.role}</span>
                        </td>
                        {weekDays.map(day => {
                          const dateKey = format(day, 'yyyy-MM-dd');
                          const dayBookings = serviceBookings.filter(b => b.scheduled_date === dateKey);
                          return (
                            <td key={day.toISOString()} className={cn(
                              'p-1 text-center border-l',
                              isToday(day) && 'bg-primary/5',
                            )}>
                              {dayBookings.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  {dayBookings.slice(0, 3).map(b => (
                                    <div key={b.id} className="rounded bg-primary/15 px-1 py-0.5 text-[9px] truncate">
                                      {b.scheduled_time_start?.slice(0, 5)} {b.service?.title}
                                    </div>
                                  ))}
                                  {dayBookings.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayBookings.length - 3}</span>}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

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
