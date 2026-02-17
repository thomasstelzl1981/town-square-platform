/**
 * PMPension — Vertikales Widget-Layout: Zimmer links, Inline-Akte rechts
 */
import { useState, useMemo } from 'react';
import { Plus, PawPrint, LogOut, Save, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_ROOM);
  const [currentDate, setCurrentDate] = useState(new Date());

  const pensionRooms = rooms.filter(r => r.is_active);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }), [weekStart]);

  // Group assignments by room
  const assignmentsByRoom = new Map<string, PetRoomAssignment[]>();
  assignments.forEach(a => {
    if (!assignmentsByRoom.has(a.room_id)) assignmentsByRoom.set(a.room_id, []);
    assignmentsByRoom.get(a.room_id)!.push(a);
  });

  // Calendar bookings
  const pensionBookings = bookings.filter(b => !['cancelled', 'no_show'].includes(b.status));
  const bookingsByDate = new Map<string, typeof pensionBookings>();
  pensionBookings.forEach(b => {
    if (!bookingsByDate.has(b.scheduled_date)) bookingsByDate.set(b.scheduled_date, []);
    bookingsByDate.get(b.scheduled_date)!.push(b);
  });

  const handleCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setForm(EMPTY_ROOM);
  };

  const handleSelect = (room: PetRoom) => {
    setIsCreating(false);
    setSelectedId(room.id);
    setForm({
      name: room.name, room_type: room.room_type, capacity: room.capacity,
      description: room.description || '', is_active: room.is_active, sort_order: room.sort_order,
    });
  };

  const handleClose = () => { setSelectedId(null); setIsCreating(false); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (selectedId) {
      await updateRoom.mutateAsync({ id: selectedId, ...form });
    } else {
      await createRoom.mutateAsync({ ...form, provider_id: provider!.id });
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteRoom.mutateAsync(selectedId);
    handleClose();
  };

  const showAkte = selectedId || isCreating;

  if (!provider) {
    return (
      <PageShell>
        <div className="space-y-6">
          <ModulePageHeader title="Pension" description="Zimmerverwaltung und Belegungskalender" />
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
          title="Pension"
          description="Zimmerverwaltung und Belegungskalender"
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
              {pensionRooms.map(room => {
                const occ = (assignmentsByRoom.get(room.id) || []).length;
                const isFull = occ >= room.capacity;
                const isSelected = selectedId === room.id;
                return (
                  <Card
                    key={room.id}
                    className={cn(
                      'relative overflow-hidden cursor-pointer hover:shadow-md transition-all flex-shrink-0',
                      'w-36 md:w-full aspect-square',
                      isSelected && 'ring-2 ring-primary shadow-lg',
                      isFull && 'border-destructive/30',
                      occ === 0 && !isSelected && 'border-emerald-500/30',
                      occ > 0 && !isFull && !isSelected && 'border-amber-500/30',
                    )}
                    onClick={() => handleSelect(room)}
                  >
                    <div className={cn(
                      'h-1.5',
                      occ === 0 && 'bg-emerald-500',
                      occ > 0 && !isFull && 'bg-amber-500',
                      isFull && 'bg-destructive',
                    )} />
                    <CardContent className="p-3 flex flex-col justify-between h-[calc(100%-6px)]">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{ROOM_TYPE_ICONS[room.room_type] || '🏠'}</span>
                          <span className="text-sm font-medium truncate">{room.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{ROOM_TYPE_LABELS[room.room_type]}</span>
                      </div>
                      <Badge variant={isFull ? 'destructive' : occ > 0 ? 'secondary' : 'outline'} className="text-[10px] w-fit">
                        {occ}/{room.capacity} 🐕
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
              {pensionRooms.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Zimmer angelegt.
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
                      {isCreating ? 'Neues Zimmer' : `Zimmerakte: ${form.name}`}
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
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Zimmer 1" />
                      </div>
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
                      <div>
                        <Label>Beschreibung</Label>
                        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                        <Label>Aktiv</Label>
                      </div>
                    </div>

                    {/* Aktuelle Belegung (nur im Edit-Modus) */}
                    {selectedId && (assignmentsByRoom.get(selectedId) || []).length > 0 && (
                      <div>
                        <div className="border-t pt-4 mt-2">
                          <h3 className="text-sm font-semibold mb-2">Aktuelle Belegung</h3>
                          <div className="space-y-1.5">
                            {(assignmentsByRoom.get(selectedId) || []).map(a => (
                              <div key={a.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                                <PawPrint className="h-4 w-4 text-primary" />
                                <span className="flex-1 text-sm">{a.pet?.name}</span>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => checkOut.mutate(a.id)}>
                                  <LogOut className="h-3 w-3 mr-1" /> Check-Out
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={handleSave} disabled={createRoom.isPending || updateRoom.isPending}>
                        <Save className="h-4 w-4 mr-1" /> Speichern
                      </Button>
                      {selectedId && (
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteRoom.isPending}>
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
          {!showAkte && pensionRooms.length > 0 && (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              <p className="text-sm text-muted-foreground">Zimmer auswählen oder neues Zimmer anlegen</p>
            </div>
          )}
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
      </div>
    </PageShell>
  );
}
