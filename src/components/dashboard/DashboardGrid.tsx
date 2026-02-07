/**
 * DashboardGrid — Drag & Drop Context for Widget Grid
 * 
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

interface DashboardGridProps {
  widgetIds: string[];
  onReorder: (newOrder: string[]) => void;
  children: ReactNode;
}

export function DashboardGrid({ widgetIds, onReorder, children }: DashboardGridProps) {
  const isMobile = useIsMobile();
  
  // Desktop only: Configure sensors for pointer (no TouchSensor for mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
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

  // On mobile: Render simple grid without DnD
  if (isMobile) {
    return (
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    );
  }

  // Desktop: Full DnD functionality
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
        <div 
          className="grid gap-4 md:gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}
