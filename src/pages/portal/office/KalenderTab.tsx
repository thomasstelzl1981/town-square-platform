import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Building,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  location: string | null;
  contact_id: string | null;
  property_id: string | null;
  google_event_id?: string | null;
  microsoft_event_id?: string | null;
  synced_from?: string | null;
}

export function KalenderTab() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    all_day: false,
    location: '',
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch events for current month
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_at', monthStart.toISOString())
        .lte('start_at', monthEnd.toISOString())
        .order('start_at');
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id, id')
        .single();
      
      if (!profile?.active_tenant_id) {
        throw new Error('Kein aktiver Mandant');
      }

      const { error } = await supabase.from('calendar_events').insert({
        tenant_id: profile.active_tenant_id,
        created_by: profile.id,
        title: data.title,
        description: data.description || null,
        start_at: data.start_at,
        end_at: data.end_at || null,
        all_day: data.all_day,
        location: data.location || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Termin erstellt');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_at: '',
      end_at: '',
      all_day: false,
      location: '',
    });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start_at), day));
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleOpenCreate = () => {
    setFormData({
      ...formData,
      start_at: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
    });
    setCreateDialogOpen(true);
  };

  // Get day of week for first day of month (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();
  // Adjust for Monday start (German calendar)
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // === MOBILE: Vereinfachte Listenansicht ===
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </h2>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw]">
              <DialogHeader>
                <DialogTitle>Neuer Termin</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="m-title">Titel *</Label>
                  <Input
                    id="m-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="z.B. Besichtigung"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="m-all_day">Ganztägig</Label>
                  <Switch
                    id="m-all_day"
                    checked={formData.all_day}
                    onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-start_at">Start *</Label>
                  <Input
                    id="m-start_at"
                    type={formData.all_day ? 'date' : 'datetime-local'}
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-location">Ort</Label>
                  <Input
                    id="m-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.title || !formData.start_at || createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mobile: Schnellzugriff Heute */}
        <Button variant="outline" size="sm" className="w-full" onClick={goToToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Heute
        </Button>

        {/* Mobile: Tagesliste für aktuellen Monat */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Keine Termine in diesem Monat
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{event.title}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {event.all_day ? (
                              <span>Ganztägig</span>
                            ) : (
                              <span>{format(new Date(event.start_at), 'HH:mm')}</span>
                            )}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium">
                            {format(new Date(event.start_at), 'd. MMM', { locale: de })}
                          </div>
                          {event.synced_from && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {event.synced_from === 'google' ? '📅 Google' : '📅 MS'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === DESKTOP: Original 12-Column Grid ===
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Calendar View */}
      <div className="col-span-8">
        <Card className="glass-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl min-w-[180px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Heute
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4" />
                    Neuer Termin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neuen Termin erstellen</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie einen neuen Kalendereintrag.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titel *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="z.B. Besichtigung Hauptstraße 15"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="all_day">Ganztägig</Label>
                      <Switch
                        id="all_day"
                        checked={formData.all_day}
                        onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_at">Start *</Label>
                        <Input
                          id="start_at"
                          type={formData.all_day ? 'date' : 'datetime-local'}
                          value={formData.start_at}
                          onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_at">Ende</Label>
                        <Input
                          id="end_at"
                          type={formData.all_day ? 'date' : 'datetime-local'}
                          value={formData.end_at}
                          onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ort</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="z.B. Hauptstraße 15, 10115 Berlin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Beschreibung</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optionale Notizen zum Termin..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button 
                      onClick={() => createMutation.mutate(formData)}
                      disabled={!formData.title || !formData.start_at || createMutation.isPending}
                    >
                      {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Erstellen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1" />
              ))}
              
              {/* Month days */}
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'h-24 p-1 border rounded-md transition-colors text-left',
                      isSelected && 'border-primary bg-primary/5',
                      !isSelected && 'hover:bg-muted/50',
                      !isSameMonth(day, currentMonth) && 'opacity-50'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-sm mb-1',
                      isToday && 'bg-primary text-primary-foreground font-bold'
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs truncate px-1 py-0.5 rounded bg-primary/10 text-primary"
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} weitere
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Day Details */}
      <div className="col-span-4 space-y-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Keine Termine an diesem Tag
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={handleOpenCreate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Termin erstellen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{event.title}</h4>
                        {event.all_day && (
                          <Badge variant="secondary" className="text-xs">
                            Ganztägig
                          </Badge>
                        )}
                      </div>
                      {!event.all_day && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_at), 'HH:mm')}
                          {event.end_at && (
                            <> - {format(new Date(event.end_at), 'HH:mm')}</>
                          )}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              Termin mit Kontakt
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Building className="h-4 w-4" />
              Besichtigung planen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
