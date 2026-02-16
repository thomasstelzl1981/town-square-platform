/**
 * Pets — Caring Tab
 * Pflege-Kalender mit Quick-Add, überfällige Events hervorgehoben, Pet-Filter
 */
import { useState, useMemo } from 'react';
import { Heart, Plus, Check, Trash2, Clock, AlertTriangle, Calendar, Filter } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
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
import { usePets } from '@/hooks/usePets';
import { isPast, format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PetsCaring() {
  const { data: allEvents = [], isLoading } = useCaringEvents();
  const { data: pets = [] } = usePets();
  const createEvent = useCreateCaringEvent();
  const completeEvent = useCompleteCaringEvent();
  const deleteEvent = useDeleteCaringEvent();

  const [createOpen, setCreateOpen] = useState(false);
  const [petFilter, setPetFilter] = useState<string>('all');

  // Form state
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
      pet_id: form.pet_id,
      event_type: form.event_type,
      title: form.title,
      description: form.description || undefined,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      recurring_interval_days: form.recurring_interval_days || undefined,
      reminder_enabled: form.reminder_enabled,
    });
    setCreateOpen(false);
    setForm({ pet_id: '', event_type: 'other', title: '', description: '', scheduled_at: '', recurring_interval_days: 0, reminder_enabled: false });
  };

  // Auto-fill title from event type
  const handleEventTypeChange = (type: string) => {
    const cfg = CARING_EVENT_TYPES[type];
    setForm(prev => ({
      ...prev,
      event_type: type,
      title: prev.title || (cfg?.label || ''),
    }));
  };

  function formatScheduledDate(dateStr: string): string {
    const d = parseISO(dateStr);
    if (isToday(d)) return `Heute, ${format(d, 'HH:mm')}`;
    if (isTomorrow(d)) return `Morgen, ${format(d, 'HH:mm')}`;
    return format(d, 'dd.MM.yyyy HH:mm', { locale: de });
  }

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
            {event.recurring_interval_days && (
              <Badge variant="outline" className="text-[10px]">↻ {event.recurring_interval_days}d</Badge>
            )}
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
      <ModulePageHeader title="CARING" description="Pflege-Kalender, Tierarzt-Termine und Medikamenten-Tracking" />

      {/* KPI + Actions */}
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
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{overdue.length}</p>
            <p className="text-xs text-muted-foreground">Überfällig</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">Anstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Erledigt</p>
          </CardContent>
        </Card>
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
