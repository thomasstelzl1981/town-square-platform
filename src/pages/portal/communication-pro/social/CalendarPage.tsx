/**
 * Social Calendar — Planning & Manual Posted
 * Phase 9: Week view + list, plan drafts, status workflow
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Check, Clock, Eye } from 'lucide-react';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Draft {
  id: string;
  draft_title: string | null;
  content_linkedin: string | null;
  status: string;
  planned_at: string | null;
  posted_at: string | null;
  platform_targets: string[] | null;
}

export function CalendarPage() {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
  [weekStart]);

  const { data: drafts = [] } = useQuery({
    queryKey: ['social-calendar-drafts', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase
        .from('social_drafts')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .in('status', ['ready', 'planned', 'posted_manual'])
        .order('planned_at', { ascending: true });
      return (data || []) as Draft[];
    },
    enabled: !!activeOrganization?.id,
  });

  const planDraft = async (draftId: string, date: Date) => {
    await supabase.from('social_drafts').update({
      planned_at: date.toISOString(),
      status: 'planned',
    }).eq('id', draftId);
    queryClient.invalidateQueries({ queryKey: ['social-calendar-drafts'] });
    toast({ title: `Geplant für ${format(date, 'dd.MM.yyyy')}` });
  };

  const markPosted = async (draftId: string) => {
    await supabase.from('social_drafts').update({
      status: 'posted_manual',
      posted_at: new Date().toISOString(),
    }).eq('id', draftId);
    queryClient.invalidateQueries({ queryKey: ['social-calendar-drafts'] });
    toast({ title: 'Als gepostet markiert' });
  };

  const unplanned = drafts.filter((d) => d.status === 'ready' && !d.planned_at);
  const getDraftsForDay = (date: Date) =>
    drafts.filter((d) => d.planned_at && isSameDay(new Date(d.planned_at), date));

  const statusIcon: Record<string, typeof Check> = { planned: Clock, posted_manual: Check };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Kalender & Planung</h1>
        <p className="text-muted-foreground mt-1">
          Plane deine Drafts und markiere sie als gepostet.
        </p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>← Vorher</Button>
        <span className="text-sm font-medium">
          {format(weekStart, 'dd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'dd. MMM yyyy', { locale: de })}
        </span>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>Weiter →</Button>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Heute</Button>
        )}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayDrafts = getDraftsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`border rounded-lg p-2 min-h-[120px] ${isToday(day) ? 'border-primary bg-primary/5' : ''}`}
            >
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {format(day, 'EEE dd.', { locale: de })}
              </div>
              <div className="space-y-1">
                {dayDrafts.map((d) => {
                  const Icon = statusIcon[d.status] || Clock;
                  return (
                    <div key={d.id} className="text-xs bg-card border rounded px-1.5 py-1 flex items-center gap-1">
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{d.draft_title || 'Draft'}</span>
                      {d.status === 'planned' && (
                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto shrink-0" onClick={() => markPosted(d.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unplanned drafts */}
      {unplanned.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fertige Drafts (unverplant)</h3>
          {unplanned.map((d) => (
            <Card key={d.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <span className="flex-1 text-sm font-medium">{d.draft_title || 'Unbenannt'}</span>
                <div className="flex gap-1">
                  {weekDays.slice(0, 5).map((day) => (
                    <Button key={day.toISOString()} variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => planDraft(d.id, day)}>
                      {format(day, 'EEE', { locale: de })}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {drafts.length === 0 && unplanned.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Nichts geplant</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Erstelle zuerst Entwürfe unter "Content Creation" und markiere sie als fertig.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
