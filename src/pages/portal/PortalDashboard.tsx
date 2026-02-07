/**
 * PortalDashboard — Widget-based dashboard with Drag & Drop
 * 
 * Layout:
 * +----------+----------+----------+----------+
 * |Armstrong | Weather  | Globe    | Tasks... |
 * +----------+----------+----------+----------+
 * 
 * All widgets are square and can be sorted via drag & drop.
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { useTodayEvents } from '@/hooks/useTodayEvents';
import { useWidgetOrder } from '@/hooks/useWidgetOrder';
import { EarthGlobeCard } from '@/components/dashboard/EarthGlobeCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { ArmstrongGreetingCard } from '@/components/dashboard/ArmstrongGreetingCard';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { SortableWidget } from '@/components/dashboard/SortableWidget';
import { TaskWidget } from '@/components/dashboard/TaskWidget';
import { toast } from 'sonner';
import type { Widget } from '@/types/widget';
import { DEMO_TASK_WIDGETS } from '@/types/widget';

// System widget IDs
const SYSTEM_WIDGET_IDS = ['system_armstrong', 'system_weather', 'system_globe'];

export default function PortalDashboard() {
  const { profile, isDevelopmentMode } = useAuth();
  const { location, loading: locationLoading } = useGeolocation();
  const { data: weather, isLoading: weatherLoading } = useWeather(
    location?.latitude ?? null,
    location?.longitude ?? null
  );
  const { data: todayEvents = [], isLoading: eventsLoading } = useTodayEvents();

  // Task widgets state (demo data for now)
  const [taskWidgets, setTaskWidgets] = useState<Widget[]>(DEMO_TASK_WIDGETS);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Combine all widget IDs for ordering
  const allWidgetIds = useMemo(() => {
    const taskIds = taskWidgets
      .filter(w => w.status === 'pending')
      .map(w => w.id);
    return [...SYSTEM_WIDGET_IDS, ...taskIds];
  }, [taskWidgets]);

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
    // System widgets
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
    if (SYSTEM_WIDGET_IDS.includes(id)) return true;
    const widget = taskWidgets.find(w => w.id === id);
    return widget && widget.status === 'pending';
  });

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
    </div>
  );
}
