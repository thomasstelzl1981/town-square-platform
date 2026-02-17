/**
 * PMPension — Zimmer-Widgets + Excel-Belegungskalender mit Halbtags-Darstellung
 * Sticky Zimmer-Spalte, farbige Buchungsbalken, Buchungs-Overlay, Klick-auf-Buchung
 */
import { useState, useMemo, useCallback } from 'react';
import { Home, Plus, PawPrint, LogOut, Save, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useMyProvider } from '@/hooks/usePetBookings';
import {
  useProviderRooms, useCreateRoom, useUpdateRoom, useDeleteRoom,
  useRoomAssignments, useCheckOutFromRoom,
  usePensionCalendarAssignments, useCreatePensionAssignment,
  useUpdatePensionAssignment, useDeletePensionAssignment,
  type PetRoom, type PensionCalendarAssignment,
} from '@/hooks/usePetRooms';
import { usePets } from '@/hooks/usePets';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/shared/PageShell';
import { format, addDays, isToday, eachDayOfInterval, isWeekend, isSameDay, parseISO, isBefore, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';

const ROOM_TYPE_LABELS: Record<string, string> = { zimmer: 'Zimmer', auslauf: 'Auslauf', box: 'Box' };
const ROOM_TYPE_ICONS: Record<string, string> = { zimmer: '🏠', auslauf: '🌳', box: '📦' };
const EMPTY_ROOM = { name: '', room_type: 'zimmer', capacity: 1, description: '', is_active: true, sort_order: 0 };

const VISIBLE_DAYS = 14;
const COL_WIDTH_ROOM = 200;
const COL_WIDTH_DATE = 100;
const CELL_HEIGHT = 64; // Taller for half-day split

const BOOKING_COLORS = [
  'bg-blue-400/70', 'bg-emerald-400/70', 'bg-amber-400/70', 'bg-rose-400/70',
  'bg-violet-400/70', 'bg-cyan-400/70', 'bg-orange-400/70', 'bg-teal-400/70',
];

function getBookingColor(idx: number) {
  return BOOKING_COLORS[idx % BOOKING_COLORS.length];
}

interface BookingFormData {
  pet_id: string;
  room_id: string;
  check_in_at: string;
  check_out_at: string;
  notes: string;
}

const EMPTY_BOOKING: BookingFormData = { pet_id: '', room_id: '', check_in_at: '', check_out_at: '', notes: '' };

export default function PMPension() {
  const { data: provider } = useMyProvider();
  const { data: rooms = [] } = useProviderRooms(provider?.id);
  const { data: assignments = [] } = useRoomAssignments(provider?.id);
  const { data: allPets = [] } = usePets();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const checkOut = useCheckOutFromRoom();
  const createAssignment = useCreatePensionAssignment();
  const updateAssignment = useUpdatePensionAssignment();
  const deleteAssignment = useDeletePensionAssignment();

  // Room form state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);

  // Booking form state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormData>(EMPTY_BOOKING);

  // Calendar navigation
  const [currentDate, setCurrentDate] = useState(new Date());

  const pensionRooms = rooms.filter(r => r.is_active);

  const visibleDays = useMemo(() => {
    return eachDayOfInterval({ start: currentDate, end: addDays(currentDate, VISIBLE_DAYS - 1) });
  }, [currentDate]);

  const startDateStr = format(visibleDays[0], 'yyyy-MM-dd');
  const endDateStr = format(visibleDays[visibleDays.length - 1], 'yyyy-MM-dd');

  const { data: calendarAssignments = [] } = usePensionCalendarAssignments(provider?.id, startDateStr, endDateStr);

  // Group calendar assignments by room
  const assignmentsByRoom = useMemo(() => {
    const map = new Map<string, PensionCalendarAssignment[]>();
    calendarAssignments.forEach(a => {
      if (!map.has(a.room_id)) map.set(a.room_id, []);
      map.get(a.room_id)!.push(a);
    });
    return map;
  }, [calendarAssignments]);

  // Current occupancy for room badges
  const currentOccupancy = useMemo(() => {
    const map = new Map<string, number>();
    assignments.forEach(a => {
      map.set(a.room_id, (map.get(a.room_id) || 0) + 1);
    });
    return map;
  }, [assignments]);

  const navigateWeek = useCallback((dir: number) => {
    setCurrentDate(prev => addDays(prev, dir * 7));
  }, []);
  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  // ─── Room handlers ───────────────────────────
  const handleCreateRoom = () => { setSelectedRoomId(null); setIsCreatingRoom(true); setRoomForm(EMPTY_ROOM); setShowBookingDialog(false); };
  const handleSelectRoom = (room: PetRoom) => {
    setIsCreatingRoom(false); setSelectedRoomId(room.id); setShowBookingDialog(false);
    setRoomForm({ name: room.name, room_type: room.room_type, capacity: room.capacity, description: room.description || '', is_active: room.is_active, sort_order: room.sort_order });
  };
  const handleCloseRoom = () => { setSelectedRoomId(null); setIsCreatingRoom(false); };
  const handleSaveRoom = async () => {
    if (!roomForm.name.trim()) return;
    if (selectedRoomId) await updateRoom.mutateAsync({ id: selectedRoomId, ...roomForm });
    else { await createRoom.mutateAsync({ ...roomForm, provider_id: provider!.id }); setIsCreatingRoom(false); }
  };
  const handleDeleteRoom = async () => { if (!selectedRoomId) return; await deleteRoom.mutateAsync(selectedRoomId); handleCloseRoom(); };

  // ─── Booking handlers ───────────────────────────
  const handleOpenNewBooking = () => {
    setEditingAssignmentId(null);
    setBookingForm(EMPTY_BOOKING);
    setShowBookingDialog(true);
    setSelectedRoomId(null); setIsCreatingRoom(false);
  };

  const handleEditBooking = (assignment: PensionCalendarAssignment) => {
    setEditingAssignmentId(assignment.id);
    setBookingForm({
      pet_id: assignment.pet_id,
      room_id: assignment.room_id,
      check_in_at: assignment.check_in_at ? format(parseISO(assignment.check_in_at), 'yyyy-MM-dd') : '',
      check_out_at: assignment.check_out_at ? format(parseISO(assignment.check_out_at), 'yyyy-MM-dd') : '',
      notes: assignment.notes || '',
    });
    setShowBookingDialog(true);
    setSelectedRoomId(null); setIsCreatingRoom(false);
  };

  const handleCloseBooking = () => { setShowBookingDialog(false); setEditingAssignmentId(null); };

  const handleSaveBooking = async () => {
    if (!bookingForm.pet_id || !bookingForm.room_id || !bookingForm.check_in_at || !bookingForm.check_out_at) return;
    if (editingAssignmentId) {
      await updateAssignment.mutateAsync({
        id: editingAssignmentId,
        pet_id: bookingForm.pet_id,
        room_id: bookingForm.room_id,
        check_in_at: bookingForm.check_in_at,
        check_out_at: bookingForm.check_out_at,
        notes: bookingForm.notes || undefined,
      });
    } else {
      await createAssignment.mutateAsync({
        pet_id: bookingForm.pet_id,
        room_id: bookingForm.room_id,
        check_in_at: bookingForm.check_in_at,
        check_out_at: bookingForm.check_out_at,
        notes: bookingForm.notes || undefined,
      });
    }
    handleCloseBooking();
  };

  const handleDeleteBooking = async () => {
    if (!editingAssignmentId) return;
    await deleteAssignment.mutateAsync(editingAssignmentId);
    handleCloseBooking();
  };

  // ─── Cell rendering helpers ───────────────────────────
  const getAssignmentsForRoomDay = useCallback((roomId: string, day: Date) => {
    const roomAssignments = assignmentsByRoom.get(roomId) || [];
    return roomAssignments.filter(a => {
      const checkIn = parseISO(a.check_in_at);
      const checkOut = a.check_out_at ? parseISO(a.check_out_at) : null;
      const checkInDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
      const checkOutDate = checkOut ? new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate()) : null;
      const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      if (checkOutDate) {
        return dayDate >= checkInDate && dayDate <= checkOutDate;
      }
      return dayDate >= checkInDate;
    });
  }, [assignmentsByRoom]);

  const showRoomAkte = selectedRoomId || isCreatingRoom;

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
            <div className="flex items-center gap-2">
              <Button variant="glass" size="icon-round" onClick={handleCreateRoom} title="Neues Zimmer">
                <Home className="h-5 w-5" />
              </Button>
              <Button variant="glass" size="icon-round" onClick={handleOpenNewBooking} title="Neue Buchung">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          }
        />

        {/* Zimmerakte Overlay */}
        {showRoomAkte && (
          <Card className="relative z-10">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {isCreatingRoom ? 'Neues Zimmer' : `Zimmerakte: ${roomForm.name}`}
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseRoom}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label>Name *</Label>
                    <Input value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Zimmer 1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Raumtyp</Label>
                      <Select value={roomForm.room_type} onValueChange={v => setRoomForm(f => ({ ...f, room_type: v }))}>
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
                      <Input type="number" min={1} value={roomForm.capacity} onChange={e => setRoomForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Beschreibung</Label>
                    <Textarea value={roomForm.description} onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={roomForm.is_active} onCheckedChange={v => setRoomForm(f => ({ ...f, is_active: v }))} />
                    <Label>Aktiv</Label>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleSaveRoom} disabled={createRoom.isPending || updateRoom.isPending}>
                    <Save className="h-4 w-4 mr-1" /> Speichern
                  </Button>
                  {selectedRoomId && (
                    <Button variant="destructive" onClick={handleDeleteRoom} disabled={deleteRoom.isPending}>
                      <Trash2 className="h-4 w-4 mr-1" /> Löschen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buchungs-Dialog Overlay */}
        {showBookingDialog && (
          <Card className="relative z-10">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {editingAssignmentId ? 'Buchung bearbeiten' : 'Neue Buchung'}
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseBooking}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Hund *</Label>
                  <Select value={bookingForm.pet_id} onValueChange={v => setBookingForm(f => ({ ...f, pet_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Hund auswählen..." /></SelectTrigger>
                    <SelectContent>
                      {allPets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          <span className="flex items-center gap-1.5">
                            <PawPrint className="h-3 w-3" /> {pet.name} {pet.breed ? `(${pet.breed})` : ''}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zimmer *</Label>
                  <Select value={bookingForm.room_id} onValueChange={v => setBookingForm(f => ({ ...f, room_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Zimmer auswählen..." /></SelectTrigger>
                    <SelectContent>
                      {pensionRooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {ROOM_TYPE_ICONS[room.room_type]} {room.name} ({currentOccupancy.get(room.id) || 0}/{room.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Anreise *</Label>
                    <Input type="date" value={bookingForm.check_in_at} onChange={e => setBookingForm(f => ({ ...f, check_in_at: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Abreise *</Label>
                    <Input type="date" value={bookingForm.check_out_at} onChange={e => setBookingForm(f => ({ ...f, check_out_at: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Notizen</Label>
                  <Textarea value={bookingForm.notes} onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Futter, Medikamente, Besonderheiten..." />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleSaveBooking} disabled={createAssignment.isPending || updateAssignment.isPending}>
                    <Save className="h-4 w-4 mr-1" /> Speichern
                  </Button>
                  {editingAssignmentId && (
                    <Button variant="destructive" onClick={handleDeleteBooking} disabled={deleteAssignment.isPending}>
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
            <div className="overflow-x-auto border rounded-lg bg-card">
              <table className="border-collapse text-xs" style={{ minWidth: `${COL_WIDTH_ROOM + VISIBLE_DAYS * COL_WIDTH_DATE}px` }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur-sm border-b border-r p-2 text-left font-medium text-muted-foreground"
                        style={{ minWidth: COL_WIDTH_ROOM }}>
                      Zimmer
                    </th>
                    {visibleDays.map(day => (
                      <th key={day.toISOString()}
                          className={cn(
                            'p-1.5 border-b border-r font-medium text-center',
                            isToday(day) ? 'text-primary bg-primary/10' : 'text-muted-foreground',
                            isWeekend(day) && 'bg-muted/40',
                          )}
                          style={{ minWidth: COL_WIDTH_DATE }}>
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
                        {slotIdx === 0 ? (
                          <td className="sticky left-0 z-10 bg-card border-r p-2 font-medium cursor-pointer hover:bg-muted/60 transition-colors"
                              rowSpan={room.capacity}
                              onClick={() => handleSelectRoom(room)}
                              style={{ minWidth: COL_WIDTH_ROOM }}>
                            <div className="flex items-center gap-1.5">
                              <span>{ROOM_TYPE_ICONS[room.room_type]}</span>
                              <span className="truncate">{room.name}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {currentOccupancy.get(room.id) || 0}/{room.capacity} 🐕
                              </Badge>
                            </div>
                          </td>
                        ) : null}
                        {visibleDays.map(day => {
                          const dayAssignments = getAssignmentsForRoomDay(room.id, day);
                          // Pick the assignment for this slot index (if exists)
                          const assignment = dayAssignments[slotIdx] || null;

                          if (!assignment) {
                            return (
                              <td key={day.toISOString()}
                                  className={cn(
                                    'border-r p-0 text-center',
                                    isToday(day) && 'bg-primary/5',
                                    isWeekend(day) && !isToday(day) && 'bg-muted/20',
                                  )}
                                  style={{ minWidth: COL_WIDTH_DATE, height: CELL_HEIGHT }}>
                              </td>
                            );
                          }

                          const checkInDate = parseISO(assignment.check_in_at);
                          const checkOutDate = assignment.check_out_at ? parseISO(assignment.check_out_at) : null;
                          const isArrivalDay = isSameDay(day, checkInDate);
                          const isDepartureDay = checkOutDate && isSameDay(day, checkOutDate);
                          const isMiddleDay = !isArrivalDay && !isDepartureDay;
                          const colorClass = getBookingColor(calendarAssignments.indexOf(assignment));

                          return (
                            <td key={day.toISOString()}
                                className={cn(
                                  'border-r p-0 relative cursor-pointer transition-colors hover:ring-1 hover:ring-inset hover:ring-primary/40',
                                  isToday(day) && 'bg-primary/5',
                                  isWeekend(day) && !isToday(day) && 'bg-muted/20',
                                )}
                                style={{ minWidth: COL_WIDTH_DATE, height: CELL_HEIGHT }}
                                onClick={() => handleEditBooking(assignment)}>
                              <div className="w-full h-full flex flex-col">
                                {/* AM half = departure area */}
                                <div className={cn(
                                  'flex-1 flex items-center justify-center text-[9px] font-medium text-white truncate px-0.5',
                                  isDepartureDay && colorClass,
                                  isMiddleDay && colorClass,
                                  isArrivalDay && !isDepartureDay && 'bg-transparent',
                                )}>
                                  {(isDepartureDay || isMiddleDay) && (
                                    <span className="truncate">{assignment.pet?.name}</span>
                                  )}
                                </div>
                                {/* Divider */}
                                <div className="h-px bg-border/40" />
                                {/* PM half = arrival area */}
                                <div className={cn(
                                  'flex-1 flex items-center justify-center text-[9px] font-medium text-white truncate px-0.5',
                                  isArrivalDay && colorClass,
                                  isMiddleDay && colorClass,
                                  isDepartureDay && !isArrivalDay && 'bg-transparent',
                                )}>
                                  {(isArrivalDay || isMiddleDay) && (
                                    <span className="truncate">{assignment.pet?.name}</span>
                                  )}
                                </div>
                              </div>
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
    </PageShell>
  );
}
