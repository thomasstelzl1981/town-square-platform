/**
 * PMPension — Zimmer-Widgets links + Excel-Belegungskalender rechts
 * Kalender: Sticky Zimmer-Spalte, Sub-Zeilen pro Kapazität, horizontaler Scroll (14+ Tage),
 * mindestens 1 Jahr navigierbar, schwebender Speichern-Button bei dirty state.
 */
import { useState, useMemo, useRef, useCallback } from 'react';
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
import { format, addDays, isToday, eachDayOfInterval, isWeekend } from 'date-fns';
import { de } from 'date-fns/locale';

const ROOM_TYPE_LABELS: Record<string, string> = { zimmer: 'Zimmer', auslauf: 'Auslauf', box: 'Box' };
const ROOM_TYPE_ICONS: Record<string, string> = { zimmer: '🏠', auslauf: '🌳', box: '📦' };
const EMPTY_ROOM = { name: '', room_type: 'zimmer', capacity: 1, description: '', is_active: true, sort_order: 0 };

const VISIBLE_DAYS = 14;

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

  // Dirty state for calendar edits (future booking edits)
  const [dirtyEdits, setDirtyEdits] = useState<Map<string, string>>(new Map());
  const isDirty = dirtyEdits.size > 0;

  const pensionRooms = rooms.filter(r => r.is_active);

  // Generate visible date columns
  const visibleDays = useMemo(() => {
    const start = currentDate;
    return eachDayOfInterval({ start, end: addDays(start, VISIBLE_DAYS - 1) });
  }, [currentDate]);

  // Group assignments by room
  const assignmentsByRoom = useMemo(() => {
    const map = new Map<string, PetRoomAssignment[]>();
    assignments.forEach(a => {
      if (!map.has(a.room_id)) map.set(a.room_id, []);
      map.get(a.room_id)!.push(a);
    });
    return map;
  }, [assignments]);

  // Calendar bookings indexed by date
  const pensionBookings = useMemo(() => bookings.filter(b => !['cancelled', 'no_show'].includes(b.status)), [bookings]);
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, typeof pensionBookings>();
    pensionBookings.forEach(b => {
      if (!map.has(b.scheduled_date)) map.set(b.scheduled_date, []);
      map.get(b.scheduled_date)!.push(b);
    });
    return map;
  }, [pensionBookings]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const navigateWeek = useCallback((dir: number) => {
    setCurrentDate(prev => addDays(prev, dir * 7));
  }, []);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const handleCellClick = useCallback((roomId: string, slotIdx: number, dateKey: string) => {
    const key = `${roomId}:${slotIdx}:${dateKey}`;
    setDirtyEdits(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, 'marked');
      }
      return next;
    });
  }, []);

  const handleSaveEdits = useCallback(() => {
    // TODO: persist dirty edits as bookings
    setDirtyEdits(new Map());
  }, []);

  const handleCreate = () => { setSelectedId(null); setIsCreating(true); setForm(EMPTY_ROOM); };
  const handleSelect = (room: PetRoom) => {
    setIsCreating(false); setSelectedId(room.id);
    setForm({ name: room.name, room_type: room.room_type, capacity: room.capacity, description: room.description || '', is_active: room.is_active, sort_order: room.sort_order });
  };
  const handleClose = () => { setSelectedId(null); setIsCreating(false); };
  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (selectedId) await updateRoom.mutateAsync({ id: selectedId, ...form });
    else { await createRoom.mutateAsync({ ...form, provider_id: provider!.id }); setIsCreating(false); }
  };
  const handleDelete = async () => { if (!selectedId) return; await deleteRoom.mutateAsync(selectedId); handleClose(); };

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

        {/* Zimmerakte Overlay */}
        {showAkte && (
          <Card className="relative z-10">
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

                {/* Aktuelle Belegung */}
                {selectedId && (assignmentsByRoom.get(selectedId) || []).length > 0 && (
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
                )}

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
        )}

        {/* Excel-Belegungskalender */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Belegungskalender</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[160px] text-center">
                {format(visibleDays[0], 'dd. MMM', { locale: de })} – {format(visibleDays[visibleDays.length - 1], 'dd. MMM yyyy', { locale: de })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="link" size="sm" className="text-xs h-5" onClick={goToday}>Heute</Button>
            </div>
          </div>

          {pensionRooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">Legen Sie zuerst Zimmer an, um den Belegungskalender zu sehen.</p>
            </div>
          ) : (
            <div ref={scrollRef} className="overflow-x-auto border rounded-lg bg-card">
              <table className="border-collapse text-xs" style={{ minWidth: `${180 + VISIBLE_DAYS * 72}px` }}>
                <thead>
                  <tr>
                    {/* Sticky room header */}
                    <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur-sm border-b border-r p-2 text-left font-medium text-muted-foreground"
                        style={{ minWidth: 180 }}>
                      Zimmer
                    </th>
                    {visibleDays.map(day => (
                      <th key={day.toISOString()}
                          className={cn(
                            'p-1.5 border-b border-r font-medium text-center',
                            isToday(day) ? 'text-primary bg-primary/10' : 'text-muted-foreground',
                            isWeekend(day) && 'bg-muted/40',
                          )}
                          style={{ minWidth: 72 }}>
                        <div className="text-[10px]">{format(day, 'EEE', { locale: de })}</div>
                        <div>{format(day, 'dd.MM.')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pensionRooms.map((room, roomIdx) => {
                    const slots = Array.from({ length: room.capacity }, (_, i) => i);
                    return slots.map((slotIdx) => (
                      <tr key={`${room.id}-${slotIdx}`}
                          className={cn(
                            slotIdx === room.capacity - 1 && roomIdx < pensionRooms.length - 1 && 'border-b-2 border-b-border',
                            slotIdx < room.capacity - 1 && 'border-b border-b-border/40',
                          )}>
                        {/* Sticky room name cell — only on first slot row */}
                        {slotIdx === 0 ? (
                          <td className="sticky left-0 z-10 bg-card border-r p-2 font-medium cursor-pointer hover:bg-muted/60 transition-colors"
                              rowSpan={room.capacity}
                              onClick={() => handleSelect(room)}
                              style={{ minWidth: 180 }}>
                            <div className="flex items-center gap-1.5">
                              <span>{ROOM_TYPE_ICONS[room.room_type]}</span>
                              <span className="truncate">{room.name}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {(assignmentsByRoom.get(room.id) || []).length}/{room.capacity} 🐕
                              </Badge>
                            </div>
                          </td>
                        ) : null}
                        {/* Date cells */}
                        {visibleDays.map(day => {
                          const dateKey = format(day, 'yyyy-MM-dd');
                          const cellKey = `${room.id}:${slotIdx}:${dateKey}`;
                          const isMarked = dirtyEdits.has(cellKey);
                          return (
                            <td key={day.toISOString()}
                                className={cn(
                                  'border-r p-0.5 text-center cursor-pointer transition-colors',
                                  isToday(day) && 'bg-primary/5',
                                  isWeekend(day) && !isToday(day) && 'bg-muted/20',
                                  isMarked && 'bg-primary/20 ring-1 ring-inset ring-primary/40',
                                  !isMarked && 'hover:bg-muted/40',
                                )}
                                style={{ minWidth: 72, height: 28 }}
                                onClick={() => handleCellClick(room.id, slotIdx, dateKey)}>
                              {isMarked && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Button */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={handleSaveEdits} size="lg" className="shadow-xl rounded-full gap-2 px-6">
            <Save className="h-4 w-4" /> Änderungen speichern ({dirtyEdits.size})
          </Button>
        </div>
      )}
    </PageShell>
  );
}
