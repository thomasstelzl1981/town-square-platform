/**
 * ARMSTRONG CONTAINER — Desktop Fixed Round Mini-Chat
 * 
 * Collapsed State: Round widget (150px) with input, upload, send - FIXED bottom-right
 * Expanded State: Chat panel (320x500px) - FIXED bottom-right
 * 
 * Acts as drop target for drag-and-drop files
 * Desktop only: Fixed position, toggle via SystemBar Rocket button
 */

import { useState, useCallback, useRef } from 'react';
import { usePortalLayout } from '@/hooks/usePortalLayout';
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

export function ArmstrongContainer() {
  const location = useLocation();
  const { armstrongVisible, armstrongExpanded, toggleArmstrongExpanded, hideArmstrong, isMobile } = usePortalLayout();
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // EXPANDED: Full chat panel - FIXED bottom-right
  if (armstrongExpanded) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          'fixed right-5 bottom-5 w-80 border bg-card rounded-2xl shadow-xl z-[60] flex flex-col overflow-hidden',
          isDragOver && 'ring-2 ring-primary ring-inset'
        )}
        style={{ height: 500 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
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
              onClick={toggleArmstrongExpanded}
              title="Minimieren"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={hideArmstrong}
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

  // COLLAPSED: Round Mini-Chat Widget - FIXED bottom-right
  return (
    <div 
      ref={containerRef}
      className={cn(
        'fixed right-5 bottom-5 z-[60] h-[150px] w-[150px] rounded-full',
        'bg-gradient-to-br from-primary to-primary/80',
        'shadow-xl hover:shadow-2xl hover:scale-105',
        'transition-all duration-200 ease-out',
        'flex flex-col items-center justify-center gap-2 p-4',
        isDragOver && 'ring-2 ring-white/50 scale-110'
      )}
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
