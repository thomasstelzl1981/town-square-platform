/**
 * DashboardGrid — Drag & Drop Context for Widget Grid
 * 
 * DESIGN MANIFEST V3.0: Fixed 4-column grid (lg:grid-cols-4)
 * Uses @dnd-kit for sortable grid with touch support.
 * Drag & Drop is DISABLED on mobile for better UX.
 */

import { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useIsMobile } from '@/hooks/use-mobile';
import { WIDGET_GRID } from '@/config/designManifest';

interface DashboardGridProps {
  widgetIds: string[];
  onReorder: (newOrder: string[]) => void;
  children: ReactNode;
}

export function DashboardGrid({ widgetIds, onReorder, children }: DashboardGridProps) {
  const isMobile = useIsMobile();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgetIds.indexOf(String(active.id));
      const newIndex = widgetIds.indexOf(String(over.id));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(widgetIds, oldIndex, newIndex);
        onReorder(newOrder);
      }
    }
  };

  // On mobile: simple vertical stack
  if (isMobile) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {children}
      </div>
    );
  }

  // Desktop: Full DnD with manifest grid
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
        <div className={WIDGET_GRID.FULL}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}
