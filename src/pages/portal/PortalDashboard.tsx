/**
 * PortalDashboard — Widget-based dashboard with Drag & Drop
 * 
 * Layout:
 * +----------+----------+----------+----------+
 * |Armstrong | Weather  | Globe    | Tasks... |
 * +----------+----------+----------+----------+
 * 
 * System widgets are now controlled via user preferences (KI-Office → Widgets).
 * All widgets are square and can be sorted via drag & drop.
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { useTodayEvents } from '@/hooks/useTodayEvents';
import { useWidgetOrder } from '@/hooks/useWidgetOrder';
import { useWidgetPreferences } from '@/hooks/useWidgetPreferences';
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
import { toast } from 'sonner';
import type { Widget } from '@/types/widget';
import { DEMO_TASK_WIDGETS } from '@/types/widget';

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

  // Task widgets state (demo data for now)
  const [taskWidgets, setTaskWidgets] = useState<Widget[]>(DEMO_TASK_WIDGETS);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Convert enabled widget codes to legacy IDs
  const enabledSystemWidgetIds = useMemo(() => {
    return enabledWidgets
      .map(code => WIDGET_CODE_TO_ID[code])
      .filter(Boolean);
  }, [enabledWidgets]);

  // Combine all widget IDs for ordering
  // Armstrong is always first, then system widgets, then task widgets
  const allWidgetIds = useMemo(() => {
    const taskIds = taskWidgets
      .filter(w => w.status === 'pending')
      .map(w => w.id);
    return [ARMSTRONG_WIDGET_ID, ...enabledSystemWidgetIds, ...taskIds];
  }, [enabledSystemWidgetIds, taskWidgets]);

  // Widget order with persistence
  const { order, updateOrder } = useWidgetOrder(allWidgetIds);

  const isLoading = locationLoading || weatherLoading || eventsLoading;

  // Handler for task widget confirmation
  const handleConfirm = async (widgetId: string) => {
    setExecutingId(widgetId);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update widget status
    setTaskWidgets(prev => 
      prev.map(w => 
        w.id === widgetId 
          ? { ...w, status: 'completed' as const, completed_at: new Date().toISOString() } 
          : w
      )
    );
    
    setExecutingId(null);
    toast.success('Aktion erfolgreich ausgeführt', {
      description: 'Der Auftrag wurde zur Sendung freigegeben.',
    });
  };

  // Handler for task widget cancellation
  const handleCancel = (widgetId: string) => {
    setTaskWidgets(prev => 
      prev.map(w => 
        w.id === widgetId 
          ? { ...w, status: 'cancelled' as const } 
          : w
      )
    );
    
    toast.info('Aktion abgebrochen', {
      description: 'Die Aktion wurde nicht ausgeführt.',
    });
  };

  // Render widget by ID
  const renderWidget = (widgetId: string) => {
    // Armstrong greeting (always shown)
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
    
    // System widgets
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
    
    // New stub widgets
    if (widgetId === 'system_finance') {
      return <FinanceWidget />;
    }
    
    if (widgetId === 'system_news') {
      return <NewsWidget />;
    }
    
    if (widgetId === 'system_space') {
      return <SpaceWidget />;
    }
    
    if (widgetId === 'system_quote') {
      return <QuoteWidget />;
    }
    
    if (widgetId === 'system_radio') {
      return <RadioWidget />;
    }
    
    if (widgetId === 'system_pv_live') {
      return <PVLiveWidget />;
    }
    
    // Task widgets
    const taskWidget = taskWidgets.find(w => w.id === widgetId);
    if (taskWidget && taskWidget.status === 'pending') {
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
    // Armstrong always visible
    if (id === ARMSTRONG_WIDGET_ID) return true;
    // System widgets based on preferences
    if (enabledSystemWidgetIds.includes(id)) return true;
    // Task widgets
    const widget = taskWidgets.find(w => w.id === id);
    return widget && widget.status === 'pending';
  });

  // Check if no system widgets are enabled (besides Armstrong)
  const noSystemWidgetsEnabled = enabledSystemWidgetIds.length === 0;
  const noTaskWidgets = taskWidgets.filter(w => w.status === 'pending').length === 0;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Development Mode Indicator */}
      {isDevelopmentMode && (
        <p className="text-xs text-status-warn mb-4">
          Entwicklungsmodus aktiv
        </p>
      )}

      {/* Welcome Headline */}
      <h1 className="text-h1 text-center mb-6 md:mb-8 text-foreground tracking-widest">
        WELCOME ON BOARD
      </h1>

      {/* Widget Grid with Drag & Drop */}
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

      {/* Empty State for System Widgets */}
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
