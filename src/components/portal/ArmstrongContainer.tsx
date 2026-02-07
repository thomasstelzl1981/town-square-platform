/**
 * ARMSTRONG CONTAINER — Desktop Chat Container
 * 
 * Collapsed State: Planet sphere (60px) - DRAGGABLE
 * Expanded State: Right-side stripe (320px width, full height) - DRAGGABLE
 * 
 * Acts as drop target for drag-and-drop files
 * Desktop only: Freely positionable via drag handle
 */

import { useState, useCallback } from 'react';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useDraggable } from '@/hooks/useDraggable';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Minimize2, 
  X,
  Paperclip,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

// Container dimensions for boundary calculation
const EXPANDED_SIZE = { width: 320, height: 500 };
const COLLAPSED_SIZE = { width: 80, height: 100 };

export function ArmstrongContainer() {
  const location = useLocation();
  const { armstrongVisible, armstrongExpanded, toggleArmstrong, toggleArmstrongExpanded, isMobile } = usePortalLayout();
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Draggable positioning (different size for expanded vs collapsed)
  const currentSize = armstrongExpanded ? EXPANDED_SIZE : COLLAPSED_SIZE;
  
  const { position, isDragging, dragHandleProps } = useDraggable({
    storageKey: 'armstrong-position',
    containerSize: currentSize,
    boundaryPadding: 20,
    disabled: isMobile, // Disable on mobile
  });

  // Derive context from current route
  const getContext = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    return {
      zone: 'Portal',
      module: segments[1] ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1) : 'Dashboard',
      entity: segments[2] || undefined,
    };
  };

  // Drag and drop handlers for files
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Get file name for display (no actual processing)
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setAttachedFile(files[0].name);
    }
  }, []);

  const removeAttachment = useCallback(() => {
    setAttachedFile(null);
  }, []);

  // Don't render if not visible
  if (!armstrongVisible) {
    return null;
  }

  // Expanded State: Full chat panel - DRAGGABLE
  if (armstrongExpanded) {
    return (
      <div 
        className={cn(
          'fixed w-80 border bg-card rounded-2xl shadow-lg z-40 flex flex-col overflow-hidden',
          isDragOver && 'ring-2 ring-primary ring-inset',
          isDragging && 'shadow-2xl'
        )}
        style={{
          left: position.x,
          top: position.y,
          height: EXPANDED_SIZE.height,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Draggable Header */}
        <div 
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-between p-3 border-b bg-muted/30 cursor-grab active:cursor-grabbing',
            'select-none'
          )}
        >
          <div className="flex items-center gap-2">
            {/* Mini planet indicator */}
            <div className="armstrong-planet w-6 h-6" />
            <span className="font-medium text-sm">Armstrong</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                toggleArmstrongExpanded();
              }}
              title="Minimieren"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                toggleArmstrong();
              }}
              title="Schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel 
            context={getContext()}
            position="docked"
          />
        </div>
      </div>
    );
  }

  // Collapsed State: Planet Sphere - DRAGGABLE
  return (
    <div 
      className={cn(
        'fixed z-40 flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing',
        isDragOver && 'scale-110',
        isDragging && 'opacity-90'
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      {...dragHandleProps}
      onClick={(e) => {
        // Only expand if not dragging
        if (!isDragging) {
          toggleArmstrongExpanded();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Planet Sphere */}
      <div 
        className={cn(
          'armstrong-planet w-14 h-14 flex items-center justify-center',
          isDragOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        title="Armstrong öffnen"
      >
        <MessageCircle className="h-5 w-5 text-white/80" />
      </div>
      
      {/* Label */}
      <span className="text-[10px] font-medium text-muted-foreground">Armstrong</span>
    </div>
  );
}
