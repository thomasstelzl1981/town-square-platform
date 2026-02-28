/**
 * PortalDashboard — Widget-based dashboard with Drag & Drop
 * Two full-page snap sections: System Widgets + Armstrong workspace
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { useTodayEvents } from '@/hooks/useTodayEvents';
import { useWidgetOrder } from '@/hooks/useWidgetOrder';
import { useWidgetPreferences } from '@/hooks/useWidgetPreferences';
import { useTaskWidgets } from '@/hooks/useTaskWidgets';
import { usePreviewSafeMode } from '@/hooks/usePreviewSafeMode';
import { GlobeWidget } from '@/components/dashboard/GlobeWidget';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { ArmstrongGreetingCard } from '@/components/dashboard/ArmstrongGreetingCard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { SortableWidget } from '@/components/dashboard/SortableWidget';
import { TaskWidget } from '@/components/dashboard/TaskWidget';
import { FinanceWidget } from '@/components/dashboard/widgets/FinanceWidget';
import { AccountsWidget } from '@/components/dashboard/widgets/AccountsWidget';
import { NewsWidget } from '@/components/dashboard/widgets/NewsWidget';
import { SpaceWidget } from '@/components/dashboard/widgets/SpaceWidget';
import { QuoteWidget } from '@/components/dashboard/widgets/QuoteWidget';
import { RadioWidget } from '@/components/dashboard/widgets/RadioWidget';
import { PVLiveWidget } from '@/components/dashboard/widgets/PVLiveWidget';
import { BrandLinkWidget } from '@/components/dashboard/widgets/BrandLinkWidget';
import { MeetingRecorderWidget } from '@/components/dashboard/MeetingRecorderWidget';
import { NotesWidget } from '@/components/dashboard/widgets/NotesWidget';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, Inbox, ChevronDown, Globe, Radio, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const ARMSTRONG_WIDGET_ID = 'system_armstrong';

const WIDGET_CODE_TO_ID: Record<string, string> = {
  'SYS.GLOBE.EARTH': 'system_globe',
  'SYS.WEATHER.SUMMARY': 'system_weather',
  'SYS.FIN.MARKETS': 'system_finance',
  'SYS.NEWS.BRIEFING': 'system_news',
  'SYS.SPACE.DAILY': 'system_space',
  'SYS.MINDSET.QUOTE': 'system_quote',
  'SYS.AUDIO.RADIO': 'system_radio',
  'SYS.PV.LIVE': 'system_pv_live',
  'SYS.BRAND.KAUFY': 'system_brand_kaufy',
  'SYS.BRAND.FUTUREROOM': 'system_brand_futureroom',
  'SYS.BRAND.SOT': 'system_brand_sot',
  'SYS.BRAND.ACQUIARY': 'system_brand_acquiary',
  'SYS.MEET.RECORDER': 'system_meeting_recorder',
  'SYS.FIN.ACCOUNTS': 'system_accounts',
};

/** Placeholder card shown in preview for disabled heavy widgets */
function PreviewPlaceholderCard({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <Card className="relative h-[260px] md:h-auto md:aspect-square flex items-center justify-center bg-muted/50 border-dashed border-muted-foreground/20">
      <CardContent className="flex flex-col items-center gap-2 text-muted-foreground">
        <Icon className="h-8 w-8 opacity-40" />
        <span className="text-xs text-center">{label}<br /><span className="opacity-60">(Preview deaktiviert)</span></span>
      </CardContent>
    </Card>
  );
}

export default function PortalDashboard() {
  const { profile, isDevelopmentMode } = useAuth();
  const { isPreview, allowHeavyWidgets } = usePreviewSafeMode();
  const navigate = useNavigate();
  const { location, loading: locationLoading } = useGeolocation();
  const { data: weather, isLoading: weatherLoading } = useWeather(
    location?.latitude ?? null,
    location?.longitude ?? null
  );
  const { data: todayEvents = [], isLoading: eventsLoading } = useTodayEvents();
  const { enabledWidgets, isLoading: prefsLoading } = useWidgetPreferences();
  const { widgets: taskWidgets, executingId, handleConfirm, handleCancel, handleDelete } = useTaskWidgets();

  // Scroll indicator visibility
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop > 50) setShowScrollHint(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleWidgetConfirm = useCallback((widgetId: string) => {
    const widget = taskWidgets.find(w => w.id === widgetId);
    if (widget?.action_code === 'ARM.RENT.REMINDER' && widget.parameters) {
      const params = widget.parameters as Record<string, unknown>;
      const contactId = params.contactId as string || '';
      const amount = params.amount as number || 0;
      const period = params.period as string || '';
      const prompt = encodeURIComponent(
        `Erstelle ein Mahnschreiben wegen ausstehender Mietzahlung für den Zeitraum ${period}. Der offene Betrag beträgt ${amount.toFixed(2)} EUR. Bitte halte den Ton sachlich aber bestimmt.`
      );
      handleConfirm(widgetId);
      navigate(`/portal/office/brief?contactId=${contactId}&subject=Mahnung&prompt=${prompt}`);
      return;
    }
    handleConfirm(widgetId);
  }, [taskWidgets, handleConfirm, navigate]);

  const enabledSystemWidgetIds = useMemo(() => {
    return enabledWidgets
      .map(code => WIDGET_CODE_TO_ID[code])
      .filter(Boolean);
  }, [enabledWidgets]);

  // Armstrong + all enabled system widgets (no cap)
  const systemWidgetIds = useMemo(() => {
    return [ARMSTRONG_WIDGET_ID, ...enabledSystemWidgetIds];
  }, [enabledSystemWidgetIds]);

  const taskWidgetIds = useMemo(() => taskWidgets.map(w => w.id), [taskWidgets]);
  const allWidgetIds = useMemo(() => [...systemWidgetIds, ...taskWidgetIds], [systemWidgetIds, taskWidgetIds]);
  const { order, updateOrder } = useWidgetOrder(prefsLoading ? [] : allWidgetIds);

  const isLoading = locationLoading || weatherLoading || eventsLoading;

  const renderWidget = (widgetId: string) => {
    if (widgetId === 'system_armstrong') {
      return (
        <ArmstrongGreetingCard
          displayName={profile?.last_name || profile?.display_name || ''}
          city={location?.city || ''}
          weather={weather ?? null}
          todayEvents={todayEvents}
          isLoading={isLoading}
        />
      );
    }
    if (widgetId === 'system_weather') {
      return <WeatherCard latitude={location?.latitude ?? null} longitude={location?.longitude ?? null} city={location?.city} />;
    }
    if (widgetId === 'system_globe') {
      return <GlobeWidget latitude={location?.latitude ?? null} longitude={location?.longitude ?? null} city={location?.city} />;
    }
    if (widgetId === 'system_finance') return <FinanceWidget />;
    if (widgetId === 'system_accounts') return <AccountsWidget />;
    if (widgetId === 'system_news') return <NewsWidget />;
    if (widgetId === 'system_space') return <SpaceWidget />;
    if (widgetId === 'system_quote') return <QuoteWidget />;
    if (widgetId === 'system_radio') {
      if (!allowHeavyWidgets) return <PreviewPlaceholderCard label="Radio" icon={Radio} />;
      return <RadioWidget />;
    }
    if (widgetId === 'system_pv_live') {
      if (!allowHeavyWidgets) return <PreviewPlaceholderCard label="PV Live" icon={Zap} />;
      return <PVLiveWidget />;
    }
    if (widgetId === 'system_meeting_recorder') return <MeetingRecorderWidget />;
    if (widgetId === 'system_brand_kaufy') return <BrandLinkWidget code="SYS.BRAND.KAUFY" />;
    if (widgetId === 'system_brand_futureroom') return <BrandLinkWidget code="SYS.BRAND.FUTUREROOM" />;
    if (widgetId === 'system_brand_sot') return <BrandLinkWidget code="SYS.BRAND.SOT" />;
    if (widgetId === 'system_brand_acquiary') return <BrandLinkWidget code="SYS.BRAND.ACQUIARY" />;

    const taskWidget = taskWidgets.find(w => w.id === widgetId);
    if (taskWidget) {
      return (
        <TaskWidget
          widget={taskWidget}
          onConfirm={handleWidgetConfirm}
          onCancel={handleCancel}
          onDelete={handleDelete}
          isExecuting={executingId === widgetId}
        />
      );
    }
    return null;
  };

  const visibleSystemIds = order.filter(id => systemWidgetIds.includes(id));
  const visibleTaskIds = order.filter(id => taskWidgetIds.includes(id));
  const noSystemWidgetsEnabled = enabledSystemWidgetIds.length === 0;

  return (
    <div
      ref={scrollRef}
      className="h-[calc(100dvh-4rem)] overflow-y-auto snap-y snap-mandatory"
    >
      {/* ===== Section 1: Welcome ===== */}
      <section className="min-h-[calc(100dvh-4rem)] snap-start flex flex-col relative">
        <div className="max-w-7xl mx-auto w-full px-2 py-3 md:p-6 lg:p-8 flex-1">
          {isDevelopmentMode && (
            <p className="text-xs text-status-warn mb-4">
              Entwicklungsmodus aktiv
            </p>
          )}

          <h1 className="text-lg md:text-h1 text-center mb-4 md:mb-8 text-foreground tracking-widest">
            WELCOME ON BOARD
          </h1>

          <DashboardGrid widgetIds={visibleSystemIds} onReorder={updateOrder}>
            {visibleSystemIds.map(widgetId => {
              const widget = renderWidget(widgetId);
              if (!widget) return null;
              return (
                <SortableWidget key={widgetId} id={widgetId}>
                  {widget}
                </SortableWidget>
              );
            })}
          </DashboardGrid>

          {noSystemWidgetsEnabled && (
            <Card className="mt-6 glass-card border-dashed border-muted-foreground/20">
              <CardContent className="py-8 flex flex-col items-center justify-center text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Keine Systemwidgets aktiviert
                </p>
                <Link to="/portal/office?tab=widgets">
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Widgets konfigurieren
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Scroll indicator */}
        <div
          className={`flex justify-center pb-4 transition-opacity duration-500 ${
            showScrollHint ? 'opacity-60' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground animate-bounce" />
        </div>
      </section>

      {/* ===== Section 2: Armstrong ===== */}
      <section className="min-h-[calc(100dvh-4rem)] snap-start flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-2 py-3 md:p-6 lg:p-8 flex-1">
          <h2 className="text-lg md:text-h1 text-center mb-2 md:mb-4 text-foreground tracking-widest">
            ARMSTRONG
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Deine Arbeitsoberfläche — Armstrong erstellt hier automatisch Widgets
          </p>

          <DashboardGrid
            widgetIds={['notes_widget', ...visibleTaskIds]}
            onReorder={updateOrder}
          >
            {/* Notes Widget — always first */}
            <SortableWidget key="notes_widget" id="notes_widget">
              <NotesWidget />
            </SortableWidget>

            {visibleTaskIds.map(widgetId => {
              const widget = renderWidget(widgetId);
              if (!widget) return null;
              return (
                <SortableWidget key={widgetId} id={widgetId}>
                  {widget}
                </SortableWidget>
              );
            })}
          </DashboardGrid>
        </div>
      </section>
    </div>
  );
}
