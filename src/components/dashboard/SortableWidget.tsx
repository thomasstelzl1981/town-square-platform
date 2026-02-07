/**
 * SortableWidget — Wrapper for drag-sortable widgets
 * 
 * Uses @dnd-kit/sortable for smooth drag animations.
 */

import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SortableWidget({ id, children, className }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none', // Prevent touch scrolling during drag
        isDragging && 'opacity-50 z-50 shadow-2xl shadow-primary/20',
        !isDragging && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      {children}
    </div>
  );
}
