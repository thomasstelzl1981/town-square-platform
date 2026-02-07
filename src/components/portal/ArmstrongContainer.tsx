/**
 * ARMSTRONG CONTAINER — Desktop Chat Container
 * 
 * Collapsed State: Bottom-right compact card (~200x120px) - DRAGGABLE
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
  Maximize2, 
  Minimize2, 
  X,
  Paperclip,
  Send,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

// Container dimensions for boundary calculation
const EXPANDED_SIZE = { width: 320, height: 500 };
const COLLAPSED_SIZE = { width: 256, height: 180 };

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
          'fixed w-80 border bg-card rounded-xl shadow-lg z-40 flex flex-col overflow-hidden',
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
            'flex items-center justify-between p-3 border-b bg-muted/30',
            'select-none'
          )}
        >
          <div className="flex items-center gap-2">
            {/* Grip indicator */}
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Armstrong</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
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
              className="h-7 w-7"
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

  // Collapsed State: Compact card - DRAGGABLE
  return (
    <div 
      className={cn(
        'fixed w-64 bg-card border rounded-xl shadow-lg z-40 overflow-hidden',
        isDragOver && 'ring-2 ring-primary',
        isDragging && 'shadow-2xl'
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Draggable Header */}
      <div 
        {...dragHandleProps}
        className={cn(
          'flex items-center justify-between p-2 border-b bg-muted/30',
          'select-none'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Grip indicator */}
          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="font-medium text-xs">Armstrong</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleArmstrongExpanded();
            }}
            title="Erweitern"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleArmstrong();
            }}
            title="Schließen"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Mini message area */}
      <div className="h-16 p-2 text-xs text-muted-foreground overflow-hidden">
        <p>Wie kann ich dir helfen?</p>
        <p className="text-xs opacity-60 mt-1">Dateien hier ablegen...</p>
      </div>

      {/* Input area */}
      <div className="p-2 border-t">
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 p-1.5 bg-muted rounded text-xs">
            <Paperclip className="h-3 w-3" />
            <span className="truncate flex-1">{attachedFile}</span>
            <button onClick={removeAttachment} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nachricht..."
            className="h-7 text-xs"
          />
          <Button size="icon" className="h-7 w-7" disabled={!inputValue.trim()}>
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
