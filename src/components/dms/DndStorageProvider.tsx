/**
 * DndStorageProvider — @dnd-kit context for internal file/folder moves
 * 
 * Wraps the content area (ColumnView/ListView) and handles:
 * - PointerSensor with activation distance (click vs drag)
 * - onDragEnd dispatch to moveFile/moveFolder
 * - DragOverlay with ghost item
 */
import { useState, type ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Folder, File } from 'lucide-react';
import { getFileIcon } from './storageHelpers';

export interface DndDragData {
  type: 'file' | 'folder';
  name: string;
  documentId?: string;
  nodeId?: string;
  mimeType?: string;
}

interface DndStorageProviderProps {
  onMoveFile: (documentId: string, targetFolderId: string) => Promise<boolean>;
  onMoveFolder: (folderId: string, targetFolderId: string) => Promise<boolean>;
  children: ReactNode;
}

export function DndStorageProvider({ onMoveFile, onMoveFolder, children }: DndStorageProviderProps) {
  const [activeItem, setActiveItem] = useState<DndDragData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(event.active.data.current as DndDragData);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dragData = active.data.current as DndDragData;
    const dropData = over.data.current as { type: string } | undefined;

    if (dropData?.type !== 'folder') return;

    const targetFolderId = String(over.id);

    if (dragData.type === 'file' && dragData.documentId) {
      await onMoveFile(dragData.documentId, targetFolderId);
    } else if (dragData.type === 'folder' && dragData.nodeId) {
      if (dragData.nodeId === targetFolderId) return;
      await onMoveFolder(dragData.nodeId, targetFolderId);
    }
  }

  const Icon = activeItem
    ? activeItem.type === 'folder'
      ? Folder
      : getFileIcon(activeItem.mimeType)
    : File;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg text-sm max-w-[200px] pointer-events-none">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{activeItem.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
