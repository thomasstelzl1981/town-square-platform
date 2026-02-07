/**
 * ARMSTRONG CONTAINER — Desktop Fixed Planetary Mini-Chat
 * 
 * Collapsed State: Planetary widget (192px) with input, upload, send - FIXED bottom-right
 * Expanded State: Chat panel (320x500px) with gradient header - FIXED bottom-right
 * 
 * Uses createPortal to render directly into document.body to bypass any
 * transform/overflow issues from parent containers.
 * 
 * Desktop only: Fixed position, toggle via SystemBar Rocket button
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  // Ensure we only render portal after mount (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Don't render if not visible, on mobile, or not mounted
  if (!armstrongVisible || isMobile || !mounted) {
    return null;
  }

  // The Armstrong widget content
  const armstrongContent = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Anchor wrapper - positions Armstrong bottom-right with safe-area support */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          right: 'calc(1.25rem + env(safe-area-inset-right, 0px))',
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {armstrongExpanded ? (
          /* EXPANDED: Full chat panel with gradient header */
          <div 
            ref={containerRef}
            className={cn(
              'w-80 rounded-2xl shadow-xl flex flex-col overflow-hidden',
              'ring-2 ring-primary/20',
              'bg-card',
              isDragOver && 'ring-2 ring-primary ring-inset'
            )}
            style={{ height: 500 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Header with gradient */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-br from-primary via-primary/80 to-purple-900/70">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="font-medium text-sm text-primary-foreground">Armstrong</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
                  onClick={toggleArmstrongExpanded}
                  title="Minimieren"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20"
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
        ) : (
          /* COLLAPSED: Planetary Widget - 192px with atmospheric design */
          <div 
            ref={containerRef}
            className={cn(
              'h-48 w-48 rounded-full',
              'bg-gradient-to-br from-primary via-primary/80 to-purple-900/70',
              'ring-4 ring-primary/20',
              'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),_0_0_48px_-12px_hsl(217_91%_60%/0.4)]',
              'hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5),_0_0_64px_-8px_hsl(217_91%_60%/0.5)]',
              'hover:scale-105 transition-all duration-300',
              'flex flex-col items-center justify-center gap-3 p-5',
              'relative overflow-hidden',
              isDragOver && 'ring-4 ring-white/50 scale-110'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Light reflection (planetary highlight top-left) */}
            <div className="absolute top-5 left-5 h-10 w-10 rounded-full bg-white/15 blur-md pointer-events-none" />
            
            {/* Atmospheric shimmer (bottom-right) */}
            <div className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-purple-400/10 blur-sm pointer-events-none" />
            
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            
            {/* Bot Icon + Label */}
            <div className="flex items-center gap-2 relative z-10">
              <Bot className="h-5 w-5 text-primary-foreground/90" />
              <span className="text-xs font-medium text-primary-foreground/80">Armstrong</span>
            </div>
            
            {/* Input Field */}
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleInputFocus}
              onClick={(e) => e.stopPropagation()}
              placeholder="Fragen..."
              className={cn(
                'w-full h-10 rounded-full bg-white/20 border-0 relative z-10',
                'text-sm text-primary-foreground placeholder:text-primary-foreground/50',
                'px-4 text-center',
                'focus:outline-none focus:bg-white/30',
                'transition-colors'
              )}
            />
            
            {/* Upload + Send Buttons */}
            <div className="flex items-center gap-3 relative z-10">
              <button 
                onClick={handleUploadClick}
                className={cn(
                  'h-8 w-8 rounded-full bg-white/20 hover:bg-white/30',
                  'flex items-center justify-center',
                  'transition-colors'
                )}
                title="Datei anhängen"
              >
                <Paperclip className="h-4 w-4 text-primary-foreground/80" />
              </button>
              <button 
                onClick={handleSendClick}
                className={cn(
                  'h-8 w-8 rounded-full bg-white/30 hover:bg-white/40',
                  'flex items-center justify-center',
                  'transition-colors'
                )}
                title="Senden"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render via portal directly into document.body
  return createPortal(armstrongContent, document.body);
}
