/**
 * DashboardGrid — Drag & Drop Context for Widget Grid
 * 
 * Uses @dnd-kit for sortable grid with touch support.
 */

import { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface DashboardGridProps {
  widgetIds: string[];
  onReorder: (newOrder: string[]) => void;
  children: ReactNode;
}

export function DashboardGrid({ widgetIds, onReorder, children }: DashboardGridProps) {
  // Configure sensors for pointer and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms long-press to activate on touch
        tolerance: 5, // 5px tolerance for movement during delay
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 320px))',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}
