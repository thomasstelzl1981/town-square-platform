/**
 * PMRaeume — Raumverwaltung und Belegungsansicht (P5.3 + P5.4)
 */
import { useState } from 'react';
import { DoorOpen, Plus, Trash2, Edit2, PawPrint, LogOut, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMyProvider } from '@/hooks/usePetBookings';
import {
  useProviderRooms, useCreateRoom, useUpdateRoom, useDeleteRoom,
  useRoomAssignments, useCheckOutFromRoom,
  type PetRoom, type PetRoomAssignment,
} from '@/hooks/usePetRooms';
import { cn } from '@/lib/utils';

const ROOM_TYPE_LABELS: Record<string, string> = {
  zimmer: 'Zimmer',
  auslauf: 'Auslauf',
  box: 'Box',
  salon: 'Salon',
};

const ROOM_TYPE_ICONS: Record<string, string> = {
  zimmer: '🏠',
  auslauf: '🌳',
  box: '📦',
  salon: '✂️',
};

const EMPTY_ROOM = { name: '', room_type: 'zimmer', capacity: 1, description: '', is_active: true, sort_order: 0 };

export default function PMRaeume() {
  const { data: provider } = useMyProvider();
  const { data: rooms = [] } = useProviderRooms(provider?.id);
  const { data: assignments = [] } = useRoomAssignments(provider?.id);
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const checkOut = useCheckOutFromRoom();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ROOM);

  if (!provider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <DoorOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Räume & Belegung</h1>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <p className="text-muted-foreground">Kein Provider-Profil gefunden.</p>
        </div>
      </div>
    );
  }

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
      await createRoom.mutateAsync({ ...form, provider_id: provider.id });
    }
    setDialogOpen(false);
  };

  // Group assignments by room
  const assignmentsByRoom = new Map<string, PetRoomAssignment[]>();
  assignments.forEach(a => {
    if (!assignmentsByRoom.has(a.room_id)) assignmentsByRoom.set(a.room_id, []);
    assignmentsByRoom.get(a.room_id)!.push(a);
  });

  const activeRooms = rooms.filter(r => r.is_active);
  const inactiveRooms = rooms.filter(r => !r.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DoorOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Räume & Belegung</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-4 w-4" /> Raum</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? 'Raum bearbeiten' : 'Neuer Raum'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Zimmer 1, Auslauf Nord" /></div>
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
                  <Label>Kapazität</Label>
                  <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sortierung</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>Aktiv</Label>
                </div>
              </div>
              <Button onClick={handleSave} disabled={createRoom.isPending || updateRoom.isPending} className="w-full">
                <Save className="h-4 w-4 mr-1" /> Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{activeRooms.length}</p>
          <p className="text-xs text-muted-foreground">Aktive Räume</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{activeRooms.reduce((s, r) => s + r.capacity, 0)}</p>
          <p className="text-xs text-muted-foreground">Gesamtkapazität</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-primary">{assignments.length}</p>
          <p className="text-xs text-muted-foreground">Aktuell belegt</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">
            {activeRooms.reduce((s, r) => s + r.capacity, 0) - assignments.length}
          </p>
          <p className="text-xs text-muted-foreground">Freie Plätze</p>
        </CardContent></Card>
      </div>

      {/* Belegungsansicht — Room Cards */}
      {activeRooms.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Aktuelle Belegung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRooms.map(room => {
              const roomAssignments = assignmentsByRoom.get(room.id) || [];
              const occupancy = roomAssignments.length;
              const isFull = occupancy >= room.capacity;

              return (
                <Card key={room.id} className={cn(
                  'relative overflow-hidden',
                  isFull && 'border-destructive/30',
                )}>
                  {/* Top bar */}
                  <div className={cn(
                    'h-1',
                    occupancy === 0 && 'bg-emerald-500',
                    occupancy > 0 && !isFull && 'bg-amber-500',
                    isFull && 'bg-destructive',
                  )} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span>{ROOM_TYPE_ICONS[room.room_type] || '🏠'}</span>
                        {room.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-[10px]">
                          {occupancy}/{room.capacity}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(room)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteRoom.mutate(room.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {room.description && <p className="text-[10px] text-muted-foreground">{room.description}</p>}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {roomAssignments.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">Kein Tier zugewiesen</p>
                    ) : (
                      <div className="space-y-1.5">
                        {roomAssignments.map(a => (
                          <div key={a.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/40 border border-border/20">
                            <PawPrint className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{a.pet?.name}</p>
                              <p className="text-[10px] text-muted-foreground">{a.pet?.species} {a.pet?.breed ? `· ${a.pet.breed}` : ''}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] gap-0.5 px-1.5"
                              onClick={() => checkOut.mutate(a.id)}
                            >
                              <LogOut className="h-3 w-3" /> Aus
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive rooms list */}
      {inactiveRooms.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Inaktive Räume ({inactiveRooms.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {inactiveRooms.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-border/20">
                  <span>{ROOM_TYPE_ICONS[r.room_type]}</span>
                  <span className="text-sm text-muted-foreground flex-1">{r.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(r)}><Edit2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <DoorOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Noch keine Räume angelegt.</p>
          <p className="text-muted-foreground text-xs mt-1">Erstellen Sie Zimmer, Boxen oder Ausläufe für Ihre Einrichtung.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Ersten Raum anlegen
          </Button>
        </div>
      )}
    </div>
  );
}
