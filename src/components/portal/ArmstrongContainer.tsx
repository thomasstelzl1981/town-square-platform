/**
 * ARMSTRONG CONTAINER — Desktop Draggable Round Mini-Chat
 * 
 * Collapsed State: Round widget (150px) with input, upload, send - DRAGGABLE
 * Expanded State: Chat panel (320x500px) - DRAGGABLE via header
 * 
 * Acts as drop target for drag-and-drop files
 * Desktop only: Freely positionable via drag
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useDraggable } from '@/hooks/useDraggable';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Minimize2, 
  X,
  Paperclip,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

// Container dimensions for boundary calculation
const EXPANDED_SIZE = { width: 320, height: 500 };
const COLLAPSED_SIZE = { width: 150, height: 150 };

export function ArmstrongContainer() {
  const location = useLocation();
  const { armstrongVisible, armstrongExpanded, toggleArmstrongExpanded, hideArmstrong, isMobile } = usePortalLayout();
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Draggable positioning (different size for expanded vs collapsed)
  const currentSize = armstrongExpanded ? EXPANDED_SIZE : COLLAPSED_SIZE;
  
  const { position, isDragging, dragHandleProps, resetPosition } = useDraggable({
    storageKey: 'armstrong-position',
    containerSize: currentSize,
    boundaryPadding: 20,
    disabled: isMobile,
  });

  // If Armstrong is being shown and the position key was cleared (e.g. via SystemBar reset),
  // we must actively reset the in-memory position state too.
  useEffect(() => {
    if (!armstrongVisible || isMobile) return;

    let hasStoredPosition = false;
    try {
      hasStoredPosition = !!localStorage.getItem('armstrong-position');
    } catch {
      // If storage is unavailable, don't force resets.
      hasStoredPosition = true;
    }

    if (!hasStoredPosition) {
      resetPosition();
    }
  }, [armstrongVisible, isMobile, resetPosition]);

  // Self-healing: Check if container is off-screen and reset if needed
  useEffect(() => {
    if (!armstrongVisible || isMobile || !containerRef.current) return;
    
    const timeout = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const visibleArea = Math.max(0, visibleWidth) * Math.max(0, visibleHeight);
      const totalArea = rect.width * rect.height;
      
      if (totalArea > 0 && visibleArea / totalArea < 0.2) {
        resetPosition();
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [armstrongVisible, armstrongExpanded, isMobile, resetPosition]);

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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Expand and pass file to chat
      toggleArmstrongExpanded();
    }
  }, [toggleArmstrongExpanded]);

  // Handle input focus -> expand
  const handleInputFocus = useCallback(() => {
    toggleArmstrongExpanded();
  }, [toggleArmstrongExpanded]);

  // Handle upload button click
  const handleUploadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileChange = useCallback(() => {
    toggleArmstrongExpanded();
  }, [toggleArmstrongExpanded]);

  // Handle send button click
  const handleSendClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputValue.trim()) {
      toggleArmstrongExpanded();
    }
  }, [inputValue, toggleArmstrongExpanded]);

  // Don't render if not visible or on mobile
  if (!armstrongVisible || isMobile) {
    return null;
  }

  // EXPANDED: Full chat panel - DRAGGABLE via header
  if (armstrongExpanded) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          'fixed w-80 border bg-card rounded-2xl shadow-xl z-[60] flex flex-col overflow-hidden',
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
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="h-3 w-3 text-primary-foreground" />
            </div>
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
                hideArmstrong();
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

  // COLLAPSED: Round Mini-Chat Widget - DRAGGABLE
  return (
    <div 
      ref={containerRef}
      className={cn(
        'fixed z-[60] h-[150px] w-[150px] rounded-full',
        'bg-gradient-to-br from-primary to-primary/80',
        'shadow-xl hover:shadow-2xl hover:scale-105',
        'transition-all duration-200 ease-out',
        'flex flex-col items-center justify-center gap-2 p-4',
        'cursor-grab active:cursor-grabbing',
        isDragOver && 'ring-2 ring-white/50 scale-110',
        isDragging && 'opacity-90'
      )}
      style={{
        left: position.x,
        top: position.y,
        ...dragHandleProps.style,
      }}
      onMouseDown={dragHandleProps.onMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      
      {/* Bot Icon + Label */}
      <div className="flex items-center gap-1.5">
        <Bot className="h-4 w-4 text-primary-foreground/80" />
        <span className="text-[11px] font-medium text-primary-foreground/70">Armstrong</span>
      </div>
      
      {/* Compact Input Field */}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleInputFocus}
        onClick={(e) => e.stopPropagation()}
        placeholder="Fragen..."
        className={cn(
          'w-full h-8 rounded-full bg-white/20 border-0',
          'text-xs text-primary-foreground placeholder:text-primary-foreground/50',
          'px-3 text-center',
          'focus:outline-none focus:bg-white/30',
          'transition-colors'
        )}
      />
      
      {/* Upload + Send Buttons */}
      <div className="flex items-center gap-2">
        <button 
          onClick={handleUploadClick}
          className={cn(
            'h-7 w-7 rounded-full bg-white/20 hover:bg-white/30',
            'flex items-center justify-center',
            'transition-colors'
          )}
          title="Datei anhängen"
        >
          <Paperclip className="h-3.5 w-3.5 text-primary-foreground/70" />
        </button>
        <button 
          onClick={handleSendClick}
          className={cn(
            'h-7 w-7 rounded-full bg-white/30 hover:bg-white/40',
            'flex items-center justify-center',
            'transition-colors'
          )}
          title="Senden"
        >
          <Send className="h-3.5 w-3.5 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}
