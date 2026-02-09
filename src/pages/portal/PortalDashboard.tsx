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

import { useMemo } from 'react';
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
import { NewsWidget } from '@/components/dashboard/widgets/NewsWidget';
import { SpaceWidget } from '@/components/dashboard/widgets/SpaceWidget';
import { QuoteWidget } from '@/components/dashboard/widgets/QuoteWidget';
import { RadioWidget } from '@/components/dashboard/widgets/RadioWidget';
import { PVLiveWidget } from '@/components/dashboard/widgets/PVLiveWidget';
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
};

export default function PortalDashboard() {
  const { profile, isDevelopmentMode } = useAuth();
  const { location, loading: locationLoading } = useGeolocation();
  const { data: weather, isLoading: weatherLoading } = useWeather(
    location?.latitude ?? null,
    location?.longitude ?? null
  );
  const { data: todayEvents = [], isLoading: eventsLoading } = useTodayEvents();
  
  // System widget preferences
  const { enabledWidgets, isLoading: prefsLoading } = useWidgetPreferences();

  // Task widgets from DB with realtime
  const { widgets: taskWidgets, executingId, handleConfirm, handleCancel } = useTaskWidgets();

  // Convert enabled widget codes to legacy IDs
  const enabledSystemWidgetIds = useMemo(() => {
    return enabledWidgets
      .map(code => WIDGET_CODE_TO_ID[code])
      .filter(Boolean);
  }, [enabledWidgets]);

  // Combine all widget IDs for ordering
  const allWidgetIds = useMemo(() => {
    const taskIds = taskWidgets.map(w => w.id);
    return [ARMSTRONG_WIDGET_ID, ...enabledSystemWidgetIds, ...taskIds];
  }, [enabledSystemWidgetIds, taskWidgets]);

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
    if (widgetId === 'system_news') return <NewsWidget />;
    if (widgetId === 'system_space') return <SpaceWidget />;
    if (widgetId === 'system_quote') return <QuoteWidget />;
    if (widgetId === 'system_radio') return <RadioWidget />;
    if (widgetId === 'system_pv_live') return <PVLiveWidget />;
    
    // Task widgets from DB
    const taskWidget = taskWidgets.find(w => w.id === widgetId);
    if (taskWidget) {
      return (
        <TaskWidget
          widget={taskWidget}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isExecuting={executingId === widgetId}
        />
      );
    }
    
    return null;
  };

  // Filter to only show existing widgets
  const visibleWidgetIds = order.filter(id => {
    if (id === ARMSTRONG_WIDGET_ID) return true;
    if (enabledSystemWidgetIds.includes(id)) return true;
    return taskWidgets.some(w => w.id === id);
  });

  const noSystemWidgetsEnabled = enabledSystemWidgetIds.length === 0;
  const noTaskWidgets = taskWidgets.length === 0;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {isDevelopmentMode && (
        <p className="text-xs text-status-warn mb-4">
          Entwicklungsmodus aktiv
        </p>
      )}

      <h1 className="text-h1 text-center mb-6 md:mb-8 text-foreground tracking-widest">
        WELCOME ON BOARD
      </h1>

      <DashboardGrid widgetIds={visibleWidgetIds} onReorder={updateOrder}>
        {visibleWidgetIds.map(widgetId => {
          const widget = renderWidget(widgetId);
          if (!widget) return null;
          
          return (
            <SortableWidget key={widgetId} id={widgetId}>
              {widget}
            </SortableWidget>
          );
        })}
      </DashboardGrid>

      {noSystemWidgetsEnabled && noTaskWidgets && (
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
  );
}
