/**
 * SortableWidget — Wrapper for drag-sortable widgets
 * 
 * Uses @dnd-kit/sortable for smooth drag animations.
 * Drag functionality is DISABLED on mobile for better UX.
 * Mobile uses snap-start for Instagram-style scroll-snap feed.
 */

import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOBILE } from '@/config/designManifest';

interface SortableWidgetProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SortableWidget({ id, children, className }: SortableWidgetProps) {
  const isMobile = useIsMobile();
  
  // ALWAYS call useSortable - use disabled flag for mobile
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isMobile });

  // On mobile: Render with snap classes for Instagram-style feed
  if (isMobile) {
    return <div className={cn('w-full', MOBILE.SNAP_ITEM, className)}>{children}</div>;
  }

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
