/**
 * SystemWidgetsTab — Manage system widgets for dashboard
 * 
 * Features:
 * - Toggle ON/OFF for each system widget
 * - Drag & Drop to reorder
 * - Detail drawer with widget info
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Globe,
  Cloud,
  TrendingUp,
  Newspaper,
  Rocket,
  Quote,
  Radio,
  GripVertical,
  Info,
  RotateCcw,
  Settings2,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWidgetPreferences } from '@/hooks/useWidgetPreferences';
import { SYSTEM_WIDGETS, getSystemWidget } from '@/config/systemWidgets';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { useIsMobile } from '@/hooks/use-mobile';

// Icon mapping
const ICON_MAP: Record<string, typeof Globe> = {
  Globe,
  Cloud,
  TrendingUp,
  Newspaper,
  Rocket,
  Quote,
  Radio,
};

interface SortableWidgetItemProps {
  code: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onInfoClick: () => void;
}

function SortableWidgetItem({ code, enabled, onToggle, onInfoClick }: SortableWidgetItemProps) {
  const widget = getSystemWidget(code);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!widget) return null;

  const Icon = ICON_MAP[widget.icon] || Globe;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none',
        isDragging && 'z-50'
      )}
    >
      <Card className={cn(
        'glass-card border-muted-foreground/10 transition-all',
        isDragging && 'shadow-lg border-primary/30',
        !enabled && 'opacity-60'
      )}>
        <CardContent className="p-3 flex items-center gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Icon */}
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
            'bg-gradient-to-br',
            widget.gradient
          )}>
            <Icon className="h-5 w-5 text-foreground/70" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{widget.name_de}</span>
              {widget.status === 'stub' && (
                <Badge variant="outline" className="text-[9px] h-4">
                  Coming Soon
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {widget.description_de}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onInfoClick}
            >
              <Info className="h-4 w-4" />
            </Button>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={widget.status === 'stub'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SystemWidgetsTab() {
  const isMobile = useIsMobile();
  const {
    preferences,
    enabledWidgets,
    toggleWidget,
    updateOrder,
    resetToDefaults,
    isUpdating,
  } = useWidgetPreferences();

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const widgetCodes = preferences.map(p => p.widget_code);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = widgetCodes.indexOf(active.id as string);
      const newIndex = widgetCodes.indexOf(over.id as string);
      const newOrder = arrayMove(widgetCodes, oldIndex, newIndex);
      updateOrder(newOrder);
    }
  };

  const selectedWidgetData = selectedWidget ? getSystemWidget(selectedWidget) : null;

  return (
    <div className={isMobile ? 'p-4' : 'p-4 md:p-6 lg:p-8'}>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className={isMobile ? 'text-lg font-semibold' : 'text-h2'}>
              Systemwidgets
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            disabled={isUpdating}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Aktivieren Sie Widgets für Ihr Dashboard und ordnen Sie diese per Drag & Drop an.
        </p>
      </div>

      {/* Active Count */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary">
          {enabledWidgets.length} von {SYSTEM_WIDGETS.length} aktiv
        </Badge>
      </div>

      {/* Widget List */}
      {preferences.length === 0 ? (
        <Card className="glass-card border-dashed border-muted-foreground/20">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine Systemwidgets verfügbar
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={widgetCodes}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {widgetCodes.map(code => {
                const pref = preferences.find(p => p.widget_code === code);
                if (!pref) return null;
                
                return (
                  <SortableWidgetItem
                    key={code}
                    code={code}
                    enabled={pref.enabled}
                    onToggle={(enabled) => toggleWidget(code, enabled)}
                    onInfoClick={() => setSelectedWidget(code)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Detail Drawer */}
      <DetailDrawer
        open={!!selectedWidget}
        onOpenChange={(open) => !open && setSelectedWidget(null)}
        title={selectedWidgetData?.name_de || 'Widget-Details'}
        description="Informationen zum Systemwidget"
      >
        {selectedWidgetData && (
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-sm font-medium mb-2">Beschreibung</h4>
              <p className="text-sm text-muted-foreground">
                {selectedWidgetData.description_de}
              </p>
            </div>

            {/* Data Source */}
            <div>
              <h4 className="text-sm font-medium mb-2">Datenquelle</h4>
              <p className="text-sm text-muted-foreground">
                {selectedWidgetData.data_source}
              </p>
            </div>

            {/* Cache */}
            {selectedWidgetData.cache_interval_min > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Aktualisierung</h4>
                <p className="text-sm text-muted-foreground">
                  Alle {selectedWidgetData.cache_interval_min} Minuten
                </p>
              </div>
            )}

            {/* Cost Model */}
            <div>
              <h4 className="text-sm font-medium mb-2">Kostenmodell</h4>
              <Badge variant={selectedWidgetData.cost_model === 'free' ? 'secondary' : 'default'}>
                {selectedWidgetData.cost_model === 'free' ? 'Kostenlos' : 'Verbrauchsabhängig'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Im MVP werden keine Kosten berechnet.
              </p>
            </div>

            {/* Status */}
            <div>
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <Badge variant={selectedWidgetData.status === 'live' ? 'default' : 'outline'}>
                {selectedWidgetData.status === 'live' ? 'Live' : 'In Entwicklung'}
              </Badge>
            </div>

            {/* Privacy */}
            {selectedWidgetData.privacy_note && (
              <div>
                <h4 className="text-sm font-medium mb-2">Datenschutz</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedWidgetData.privacy_note}
                </p>
              </div>
            )}

            {/* Autoplay Info */}
            <div>
              <h4 className="text-sm font-medium mb-2">Autoplay</h4>
              <p className="text-sm text-muted-foreground">
                {selectedWidgetData.has_autoplay 
                  ? 'Dieses Widget kann automatisch starten.'
                  : 'Kein automatischer Start — nur auf Nutzerinteraktion.'}
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
