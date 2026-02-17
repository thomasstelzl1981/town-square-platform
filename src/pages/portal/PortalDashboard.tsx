/**
 * PortalDashboard — Widget-based dashboard with Drag & Drop
 * 
 * Layout:
 * +----------+----------+----------+----------+
 * |Armstrong | Weather  | Globe    | Tasks... |
 * +----------+----------+----------+----------+
 * 
 * System widgets are now controlled via user preferences (KI-Office → Widgets).
 * Task widgets are persisted in DB with realtime updates from Armstrong.
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { useTodayEvents } from '@/hooks/useTodayEvents';
import { useWidgetOrder } from '@/hooks/useWidgetOrder';
import { useWidgetPreferences } from '@/hooks/useWidgetPreferences';
import { useTaskWidgets } from '@/hooks/useTaskWidgets';
import { EarthGlobeCard } from '@/components/dashboard/EarthGlobeCard';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings2, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

// Armstrong is always shown (not toggleable via preferences)
const ARMSTRONG_WIDGET_ID = 'system_armstrong';

// Map system widget codes to legacy IDs for rendering
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

export default function PortalDashboard() {
  const { profile, isDevelopmentMode } = useAuth();
  const navigate = useNavigate();
  const { location, loading: locationLoading } = useGeolocation();
  const { data: weather, isLoading: weatherLoading } = useWeather(
    location?.latitude ?? null,
    location?.longitude ?? null
  );
  const { data: todayEvents = [], isLoading: eventsLoading } = useTodayEvents();
  
  // System widget preferences
  const { enabledWidgets, isLoading: prefsLoading } = useWidgetPreferences();

  // Task widgets from DB with realtime
  const { widgets: taskWidgets, executingId, handleConfirm, handleCancel, handleDelete } = useTaskWidgets();

  // Intercept confirm for Mahnung widgets → navigate to brief generator
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

  // Convert enabled widget codes to legacy IDs
  const enabledSystemWidgetIds = useMemo(() => {
    return enabledWidgets
      .map(code => WIDGET_CODE_TO_ID[code])
      .filter(Boolean);
  }, [enabledWidgets]);

  // System widget IDs (Armstrong + enabled system widgets)
  const systemWidgetIds = useMemo(() => {
    return [ARMSTRONG_WIDGET_ID, ...enabledSystemWidgetIds];
  }, [enabledSystemWidgetIds]);

  // Task widget IDs
  const taskWidgetIds = useMemo(() => {
    return taskWidgets.map(w => w.id);
  }, [taskWidgets]);

  // Combine all widget IDs for ordering
  const allWidgetIds = useMemo(() => {
    return [...systemWidgetIds, ...taskWidgetIds];
  }, [systemWidgetIds, taskWidgetIds]);

  // Widget order with persistence
  const { order, updateOrder } = useWidgetOrder(allWidgetIds);

  const isLoading = locationLoading || weatherLoading || eventsLoading;

  // Render widget by ID
  const renderWidget = (widgetId: string) => {
    if (widgetId === 'system_armstrong') {
      return (
        <ArmstrongGreetingCard
          displayName={profile?.display_name || ''}
          city={location?.city || ''}
          weather={weather ?? null}
          todayEvents={todayEvents}
          isLoading={isLoading}
        />
      );
    }
    
    if (widgetId === 'system_weather') {
      return (
        <WeatherCard
          latitude={location?.latitude ?? null}
          longitude={location?.longitude ?? null}
          city={location?.city}
        />
      );
    }
    
    if (widgetId === 'system_globe') {
      return (
        <EarthGlobeCard
          latitude={location?.latitude ?? null}
          longitude={location?.longitude ?? null}
          city={location?.city}
        />
      );
    }
    
    if (widgetId === 'system_finance') return <FinanceWidget />;
    if (widgetId === 'system_accounts') return <AccountsWidget />;
    if (widgetId === 'system_news') return <NewsWidget />;
    if (widgetId === 'system_space') return <SpaceWidget />;
    if (widgetId === 'system_quote') return <QuoteWidget />;
    if (widgetId === 'system_radio') return <RadioWidget />;
    if (widgetId === 'system_pv_live') return <PVLiveWidget />;
    if (widgetId === 'system_meeting_recorder') return <MeetingRecorderWidget />;
    if (widgetId === 'system_brand_kaufy') return <BrandLinkWidget code="SYS.BRAND.KAUFY" />;
    if (widgetId === 'system_brand_futureroom') return <BrandLinkWidget code="SYS.BRAND.FUTUREROOM" />;
    if (widgetId === 'system_brand_sot') return <BrandLinkWidget code="SYS.BRAND.SOT" />;
    if (widgetId === 'system_brand_acquiary') return <BrandLinkWidget code="SYS.BRAND.ACQUIARY" />;
    
    // Task widgets from DB
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

  // Filter ordered IDs into system and task groups
  const visibleSystemIds = order.filter(id => systemWidgetIds.includes(id));
  const visibleTaskIds = order.filter(id => taskWidgetIds.includes(id));

  const noSystemWidgetsEnabled = enabledSystemWidgetIds.length === 0;
  const noTaskWidgets = taskWidgets.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-2 py-3 md:p-6 lg:p-8">
      {isDevelopmentMode && (
        <p className="text-xs text-status-warn mb-4">
          Entwicklungsmodus aktiv
        </p>
      )}

      <h1 className="text-lg md:text-h1 text-center mb-4 md:mb-8 text-foreground tracking-widest">
        WELCOME ON BOARD
      </h1>

      {/* System Widgets */}
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

      {/* Armstrong Section */}
      <h2 className="text-lg tracking-widest text-muted-foreground mt-8 mb-4">
        ARMSTRONG
      </h2>

      {visibleTaskIds.length > 0 ? (
        <DashboardGrid widgetIds={visibleTaskIds} onReorder={updateOrder}>
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
      ) : (
        <Card className="glass-card border-dashed border-muted-foreground/20">
          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Keine aktiven Aufgaben — Armstrong erstellt hier automatisch Widgets
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
