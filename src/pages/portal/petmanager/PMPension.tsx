/**
 * PMPension — Pensionsbereich: Zimmer-Widgets + Belegungskalender
 */
import { useState, useMemo } from 'react';
import { DoorOpen, Plus, Edit2, Trash2, PawPrint, LogOut, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMyProvider, useBookings } from '@/hooks/usePetBookings';
import {
  useProviderRooms, useCreateRoom, useUpdateRoom, useDeleteRoom,
  useRoomAssignments, useCheckOutFromRoom,
  type PetRoom, type PetRoomAssignment,
} from '@/hooks/usePetRooms';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

const ROOM_TYPE_LABELS: Record<string, string> = { zimmer: 'Zimmer', auslauf: 'Auslauf', box: 'Box' };
const ROOM_TYPE_ICONS: Record<string, string> = { zimmer: '🏠', auslauf: '🌳', box: '📦' };
const EMPTY_ROOM = { name: '', room_type: 'zimmer', capacity: 1, description: '', is_active: true, sort_order: 0 };

export default function PMPension() {
  const { data: provider } = useMyProvider();
  const { data: rooms = [] } = useProviderRooms(provider?.id);
  const { data: assignments = [] } = useRoomAssignments(provider?.id);
  const { data: bookings = [] } = useBookings(provider ? { providerId: provider.id } : undefined);
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const checkOut = useCheckOutFromRoom();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ROOM);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter to pension rooms only
  const pensionRooms = rooms.filter(r => r.is_active);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);

  // Group assignments by room
  const assignmentsByRoom = new Map<string, PetRoomAssignment[]>();
  assignments.forEach(a => {
    if (!assignmentsByRoom.has(a.room_id)) assignmentsByRoom.set(a.room_id, []);
    assignmentsByRoom.get(a.room_id)!.push(a);
  });

  // Group bookings by date for calendar
  const pensionBookings = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status));
  const bookingsByDate = new Map<string, typeof pensionBookings>();
  pensionBookings.forEach(b => {
    if (!bookingsByDate.has(b.scheduled_date)) bookingsByDate.set(b.scheduled_date, []);
    bookingsByDate.get(b.scheduled_date)!.push(b);
  });

  const openCreate = () => { setEditId(null); setForm(EMPTY_ROOM); setDialogOpen(true); };
  const openEdit = (r: PetRoom) => {
    setEditId(r.id);
    setForm({ name: r.name, room_type: r.room_type, capacity: r.capacity, description: r.description || '', is_active: r.is_active, sort_order: r.sort_order });
    setDialogOpen(true);
  };
  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await updateRoom.mutateAsync({ id: editId, ...form });
    } else {
      await createRoom.mutateAsync({ ...form, provider_id: provider!.id });
    }
    setDialogOpen(false);
  };

  if (!provider) {
    return (
      <PageShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <DoorOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Pension</h1>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DoorOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Pension</h1>
          </div>
        </div>

        {/* Zimmer-Widgets */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Zimmer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pensionRooms.map(room => {
              const occ = (assignmentsByRoom.get(room.id) || []).length;
              const isFull = occ >= room.capacity;
              return (
                <Card key={room.id} className={cn(
                  'relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow',
                  isFull && 'border-destructive/30',
                  occ === 0 && 'border-emerald-500/30',
                  occ > 0 && !isFull && 'border-amber-500/30',
                )}>
                  <div className={cn(
                    'h-1',
                    occ === 0 && 'bg-emerald-500',
                    occ > 0 && !isFull && 'bg-amber-500',
                    isFull && 'bg-destructive',
                  )} />
                  <CardContent className="pt-3 pb-3 px-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {ROOM_TYPE_ICONS[room.room_type] || '🏠'} {room.name}
                      </span>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); openEdit(room); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); deleteRoom.mutate(room.id); }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={isFull ? 'destructive' : occ > 0 ? 'secondary' : 'outline'} className="text-[10px]">
                        {occ}/{room.capacity} 🐕
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{ROOM_TYPE_LABELS[room.room_type]}</span>
                    </div>
                    {/* Show assigned pets */}
                    {(assignmentsByRoom.get(room.id) || []).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(assignmentsByRoom.get(room.id) || []).map(a => (
                          <div key={a.id} className="flex items-center gap-1.5 text-[10px] bg-muted/40 rounded px-1.5 py-0.5">
                            <PawPrint className="h-2.5 w-2.5 text-primary" />
                            <span className="flex-1 truncate">{a.pet?.name}</span>
                            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => checkOut.mutate(a.id)}>
                              <LogOut className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {/* + Zimmer anlegen */}
            <Card
              className="border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all flex items-center justify-center min-h-[100px]"
              onClick={openCreate}
            >
              <div className="text-center text-muted-foreground">
                <Plus className="h-6 w-6 mx-auto mb-1" />
                <span className="text-xs">Zimmer anlegen</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Belegungskalender */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Belegungskalender</h2>
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

          {pensionRooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">Legen Sie zuerst Zimmer an, um den Belegungskalender zu sehen.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b font-medium text-muted-foreground w-28">Zimmer</th>
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
                    {pensionRooms.map(room => (
                      <tr key={room.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">
                          <span className="flex items-center gap-1">
                            {ROOM_TYPE_ICONS[room.room_type]} {room.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">max {room.capacity}</span>
                        </td>
                        {weekDays.map(day => {
                          const dateKey = format(day, 'yyyy-MM-dd');
                          const dayBookings = (bookingsByDate.get(dateKey) || []);
                          // Simple: show count of bookings for this day
                          const count = dayBookings.length;
                          const ratio = count / Math.max(room.capacity, 1);
                          return (
                            <td key={day.toISOString()} className={cn(
                              'p-1 text-center border-l',
                              isToday(day) && 'bg-primary/5',
                              ratio >= 1 && 'bg-destructive/10',
                              ratio >= 0.5 && ratio < 1 && 'bg-amber-500/10',
                              ratio > 0 && ratio < 0.5 && 'bg-emerald-500/10',
                            )}>
                              {count > 0 && (
                                <div className="flex flex-col gap-0.5">
                                  {dayBookings.slice(0, 3).map(b => (
                                    <div key={b.id} className="rounded bg-primary/15 px-1 py-0.5 text-[9px] truncate">
                                      {b.pet?.name}
                                    </div>
                                  ))}
                                  {count > 3 && <span className="text-[9px] text-muted-foreground">+{count - 3}</span>}
                                </div>
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

        {/* Room Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Zimmer bearbeiten' : 'Neues Zimmer'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Zimmer 1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Raumtyp</Label>
                  <Select value={form.room_type} onValueChange={v => setForm(f => ({ ...f, room_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{ROOM_TYPE_ICONS[k]} {v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kapazität (Tiere)</Label>
                  <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Aktiv</Label>
              </div>
              <Button onClick={handleSave} disabled={createRoom.isPending || updateRoom.isPending} className="w-full">
                <Save className="h-4 w-4 mr-1" /> Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
