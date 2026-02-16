/**
 * Pets — Caring Tab
 * 4 CI-Widgets (Gassi, Tagesstätte, Pension, Hundefriseur) + Pflege-Kalender
 */
import { useState, useMemo } from 'react';
import { Heart, Plus, Check, Trash2, Clock, AlertTriangle, Calendar, Filter, Footprints, Sun, Home, Scissors, PawPrint } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCaringEvents, useCreateCaringEvent, useCompleteCaringEvent, useDeleteCaringEvent, CARING_EVENT_TYPES } from '@/hooks/usePetCaring';
import { useCreateBooking } from '@/hooks/usePetBookings';
import { usePets } from '@/hooks/usePets';
import { isPast, format, parseISO, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';

type CaringWidget = 'gassi' | 'tagesstaette' | 'pension' | 'friseur';

const CARING_WIDGETS: { key: CaringWidget; title: string; icon: typeof Footprints; description: string; category: string }[] = [
  { key: 'gassi', title: 'Gassi-Service', icon: Footprints, description: 'Dog-Walking buchen', category: 'walking' },
  { key: 'tagesstaette', title: 'Tagesstätte', icon: Sun, description: 'Tagesbetreuung buchen', category: 'daycare' },
  { key: 'pension', title: 'Pension', icon: Home, description: 'Mehrtägige Unterbringung', category: 'boarding' },
  { key: 'friseur', title: 'Hundefriseur', icon: Scissors, description: 'Grooming-Termin buchen', category: 'grooming' },
];

export default function PetsCaring() {
  const { data: allEvents = [], isLoading } = useCaringEvents();
  const { data: pets = [] } = usePets();
  const createEvent = useCreateCaringEvent();
  const completeEvent = useCompleteCaringEvent();
  const deleteEvent = useDeleteCaringEvent();
  const createBooking = useCreateBooking();

  const [activeWidget, setActiveWidget] = useState<CaringWidget | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [petFilter, setPetFilter] = useState<string>('all');

  // Booking form state
  const [bookingForm, setBookingForm] = useState({ pet_id: '', scheduled_date: '', scheduled_time_start: '', client_notes: '' });

  // Caring event form state
  const [form, setForm] = useState({
    pet_id: '', event_type: 'other', title: '', description: '',
    scheduled_at: '', recurring_interval_days: 0, reminder_enabled: false,
  });

  const filteredEvents = useMemo(() => {
    if (petFilter === 'all') return allEvents;
    return allEvents.filter(e => e.pet_id === petFilter);
  }, [allEvents, petFilter]);

  const overdue = filteredEvents.filter(e => !e.is_completed && isPast(parseISO(e.scheduled_at)));
  const upcoming = filteredEvents.filter(e => !e.is_completed && !isPast(parseISO(e.scheduled_at)));
  const completed = filteredEvents.filter(e => e.is_completed);

  const handleCreate = async () => {
    if (!form.pet_id || !form.title || !form.scheduled_at) return;
    await createEvent.mutateAsync({
      pet_id: form.pet_id, event_type: form.event_type, title: form.title,
      description: form.description || undefined,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      recurring_interval_days: form.recurring_interval_days || undefined,
      reminder_enabled: form.reminder_enabled,
    });
    setCreateOpen(false);
    setForm({ pet_id: '', event_type: 'other', title: '', description: '', scheduled_at: '', recurring_interval_days: 0, reminder_enabled: false });
  };

  const handleBookService = async () => {
    if (!bookingForm.pet_id || !bookingForm.scheduled_date || !activeWidget) return;
    const widgetCfg = CARING_WIDGETS.find(w => w.key === activeWidget);
    if (!widgetCfg) return;
    await createBooking.mutateAsync({
      pet_id: bookingForm.pet_id,
      service_id: '', // will be matched by category in backend
      provider_id: '',
      scheduled_date: bookingForm.scheduled_date,
      scheduled_time_start: bookingForm.scheduled_time_start || undefined,
      duration_minutes: 60,
      price_cents: 0,
      client_notes: `${widgetCfg.title}${bookingForm.client_notes ? ': ' + bookingForm.client_notes : ''}`,
    });
    setBookingForm({ pet_id: '', scheduled_date: '', scheduled_time_start: '', client_notes: '' });
  };

  const handleEventTypeChange = (type: string) => {
    const cfg = CARING_EVENT_TYPES[type];
    setForm(prev => ({ ...prev, event_type: type, title: prev.title || (cfg?.label || '') }));
  };

  function formatScheduledDate(dateStr: string): string {
    const d = parseISO(dateStr);
    if (isToday(d)) return `Heute, ${format(d, 'HH:mm')}`;
    if (isTomorrow(d)) return `Morgen, ${format(d, 'HH:mm')}`;
    return format(d, 'dd.MM.yyyy HH:mm', { locale: de });
  }

  const toggleWidget = (key: CaringWidget) => {
    setActiveWidget(prev => prev === key ? null : key);
    setBookingForm({ pet_id: '', scheduled_date: '', scheduled_time_start: '', client_notes: '' });
  };

  function EventCard({ event, showActions = true }: { event: typeof allEvents[0]; showActions?: boolean }) {
    const cfg = CARING_EVENT_TYPES[event.event_type] || CARING_EVENT_TYPES.other;
    const isOverdue = !event.is_completed && isPast(parseISO(event.scheduled_at));
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border/30 bg-muted/30'}`}>
        <span className="text-lg mt-0.5">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{event.title}</p>
            {isOverdue && <Badge variant="destructive" className="text-[10px]">Überfällig</Badge>}
            {event.is_completed && <Badge variant="secondary" className="text-[10px]">Erledigt</Badge>}
            {event.recurring_interval_days && <Badge variant="outline" className="text-[10px]">↻ {event.recurring_interval_days}d</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatScheduledDate(event.scheduled_at)}</span>
            <span>· {event.pet?.name}</span>
          </div>
          {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
        </div>
        {showActions && !event.is_completed && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => completeEvent.mutate(event.id)} title="Erledigt">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteEvent.mutate(event.id)} title="Löschen">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader title="CARING" description="Services buchen und Pflege-Kalender verwalten" />

      {/* CI-Widget Navigation */}
      <WidgetGrid variant="widget" className="mb-6">
        {CARING_WIDGETS.map(w => {
          const Icon = w.icon;
          const isActive = activeWidget === w.key;
          return (
            <WidgetCell key={w.key}>
              <button
                onClick={() => toggleWidget(w.key)}
                className={`w-full h-full rounded-xl border p-4 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer
                  ${isActive
                    ? 'border-teal-500/50 bg-teal-500/5 shadow-[0_0_20px_-5px_hsl(var(--teal-glow,180_60%_40%)/0.3)]'
                    : 'border-border/40 bg-card hover:border-teal-500/30 hover:bg-teal-500/5'
                  }`}
              >
                <div className={`p-3 rounded-lg ${isActive ? 'bg-teal-500/15 text-teal-600' : 'bg-muted/50 text-muted-foreground'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">{w.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{w.description}</p>
                </div>
              </button>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Inline Booking Calendar */}
      {activeWidget && (
        <Card className="mb-6 border-teal-500/20">
          <CardContent className="pt-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {(() => { const w = CARING_WIDGETS.find(w => w.key === activeWidget); const Icon = w?.icon || Footprints; return <><Icon className="h-4 w-4 text-teal-600" />{w?.title} buchen</>; })()}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Tier *</Label>
                <Select value={bookingForm.pet_id} onValueChange={v => setBookingForm(f => ({ ...f, pet_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Tier wählen…" /></SelectTrigger>
                  <SelectContent>
                    {pets.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2"><PawPrint className="h-3 w-3" />{p.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Datum *</Label>
                <Input type="date" value={bookingForm.scheduled_date} onChange={e => setBookingForm(f => ({ ...f, scheduled_date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label>Uhrzeit</Label>
                <Input type="time" value={bookingForm.scheduled_time_start} onChange={e => setBookingForm(f => ({ ...f, scheduled_time_start: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleBookService} disabled={createBooking.isPending || !bookingForm.pet_id || !bookingForm.scheduled_date} className="w-full">
                  Buchen
                </Button>
              </div>
            </div>
            <div>
              <Label>Anmerkungen</Label>
              <Textarea value={bookingForm.client_notes} onChange={e => setBookingForm(f => ({ ...f, client_notes: e.target.value }))} placeholder="Besondere Wünsche…" rows={2} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pflege-Kalender */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Select value={petFilter} onValueChange={setPetFilter}>
            <SelectTrigger className="w-48"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Alle Tiere" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Tiere</SelectItem>
              {pets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neues Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Pflege-Event anlegen</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Tier</Label>
                <Select value={form.pet_id} onValueChange={v => setForm(prev => ({ ...prev, pet_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Tier wählen…" /></SelectTrigger>
                  <SelectContent>{pets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Typ</Label>
                <Select value={form.event_type} onValueChange={handleEventTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CARING_EVENT_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titel</Label>
                <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="z.B. Tollwut-Impfung" />
              </div>
              <div>
                <Label>Datum & Uhrzeit</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(prev => ({ ...prev, scheduled_at: e.target.value }))} />
              </div>
              <div>
                <Label>Wiederholung (Tage, 0 = einmalig)</Label>
                <Input type="number" min={0} value={form.recurring_interval_days} onChange={e => setForm(prev => ({ ...prev, recurring_interval_days: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Beschreibung (optional)</Label>
                <Textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.reminder_enabled} onCheckedChange={v => setForm(prev => ({ ...prev, reminder_enabled: v }))} />
                <Label>Erinnerung aktivieren</Label>
              </div>
              <Button onClick={handleCreate} disabled={!form.pet_id || !form.title || !form.scheduled_at || createEvent.isPending} className="w-full">
                {createEvent.isPending ? 'Wird erstellt…' : 'Event erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{overdue.length}</p><p className="text-xs text-muted-foreground">Überfällig</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{upcoming.length}</p><p className="text-xs text-muted-foreground">Anstehend</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{completed.length}</p><p className="text-xs text-muted-foreground">Erledigt</p></CardContent></Card>
      </div>

      {/* Events */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Laden…</p>
      ) : (
        <Tabs defaultValue={overdue.length > 0 ? 'overdue' : 'upcoming'}>
          <TabsList>
            {overdue.length > 0 && <TabsTrigger value="overdue" className="gap-1"><AlertTriangle className="h-3 w-3" />Überfällig ({overdue.length})</TabsTrigger>}
            <TabsTrigger value="upcoming" className="gap-1"><Clock className="h-3 w-3" />Anstehend ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed" className="gap-1"><Check className="h-3 w-3" />Erledigt ({completed.length})</TabsTrigger>
          </TabsList>

          {overdue.length > 0 && (
            <TabsContent value="overdue" className="space-y-2 mt-4">
              {overdue.map(e => <EventCard key={e.id} event={e} />)}
            </TabsContent>
          )}

          <TabsContent value="upcoming" className="space-y-2 mt-4">
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mt-3">Keine anstehenden Pflege-Events</p>
              </div>
            ) : upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </TabsContent>

          <TabsContent value="completed" className="space-y-2 mt-4">
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Noch keine erledigten Events</p>
            ) : completed.slice(0, 20).map(e => <EventCard key={e.id} event={e} showActions={false} />)}
          </TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
