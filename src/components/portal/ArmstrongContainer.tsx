/**
 * ARMSTRONG CONTAINER — Orbital Glass Design
 * 
 * Collapsed State: Textured planetary widget (160px) with gold-blue gradient
 * Expanded State: Glass panel (320x500px) with theme-adaptive styling
 * 
 * Design: Mode-independent planet + theme-adaptive glass panels
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
import { useTheme } from 'next-themes';

export function ArmstrongContainer() {
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { armstrongVisible, armstrongExpanded, toggleArmstrongExpanded, hideArmstrong, isMobile } = usePortalLayout();
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getContext = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    return {
      zone: 'Portal',
      module: segments[1] ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1) : 'Dashboard',
      entity: segments[2] || undefined,
    };
  };

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
      toggleArmstrongExpanded();
    }
  }, [toggleArmstrongExpanded]);

  const handleInputFocus = useCallback(() => {
    toggleArmstrongExpanded();
  }, [toggleArmstrongExpanded]);

  const handleUploadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(() => {
    toggleArmstrongExpanded();
  }, [toggleArmstrongExpanded]);

  const handleSendClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputValue.trim()) {
      toggleArmstrongExpanded();
    }
  }, [inputValue, toggleArmstrongExpanded]);

  if (!armstrongVisible || isMobile || !mounted) {
    return null;
  }

  const armstrongContent = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div 
        className="absolute pointer-events-auto"
        style={{
          right: 'calc(1.25rem + env(safe-area-inset-right, 0px))',
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {armstrongExpanded ? (
          /* EXPANDED: Glass Chat Panel - Theme Adaptive */
          <div 
            ref={containerRef}
            className={cn(
              'w-80 rounded-[20px] flex flex-col overflow-hidden',
              'armstrong-panel-shadow',
              isDarkMode ? 'armstrong-glass-dark' : 'armstrong-glass-light',
              isDragOver && 'ring-2 ring-[hsl(42_76%_52%)]'
            )}
            style={{ height: 500 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Header with Gold→Blue Gradient */}
            <div className="flex items-center justify-between p-3 armstrong-header-gradient">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-white leading-tight">Armstrong</span>
                  <span className="text-[10px] text-white/60 leading-tight">AI Co-Pilot</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                  onClick={toggleArmstrongExpanded}
                  title="Minimieren"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                  onClick={hideArmstrong}
                  title="Schließen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Panel with transparent background */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel 
                context={getContext()}
                position="docked"
                className="bg-transparent"
              />
            </div>
          </div>
        ) : (
          /* COLLAPSED: Orbital Planet Widget - Mode Independent */
          <div 
            ref={containerRef}
            className={cn(
              'h-40 w-40 rounded-full',
              'armstrong-planet armstrong-glow-ring',
              'hover:scale-105 transition-all duration-300 ease-out',
              'flex flex-col items-center justify-center gap-2.5 p-4',
              'cursor-pointer',
              isDragOver && 'scale-110 ring-4 ring-white/40'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Light reflection - top left highlight */}
            <div 
              className="absolute top-4 left-4 h-12 w-12 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, hsla(48, 85%, 78%, 0.5) 0%, transparent 60%)',
                filter: 'blur(6px)',
              }}
            />
            
            {/* Secondary highlight - creates depth */}
            <div 
              className="absolute top-8 left-8 h-6 w-6 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.6) 0%, transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
            
            {/* Atmospheric rim glow - bottom right */}
            <div 
              className="absolute bottom-3 right-3 h-10 w-10 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, hsl(280 50% 50% / 0.3) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />
            
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            
            {/* Bot Icon + Label */}
            <div className="flex items-center gap-2 relative z-10">
              <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-white/90 tracking-wide">Armstrong</span>
            </div>
            
            {/* Glass Input Field */}
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleInputFocus}
              onClick={(e) => e.stopPropagation()}
              placeholder="Fragen..."
              className={cn(
                'w-full h-9 rounded-full armstrong-input relative z-10',
                'text-sm text-white placeholder:text-white/50',
                'px-4 text-center',
                'transition-all duration-200'
              )}
            />
            
            {/* Glass Action Buttons */}
            <div className="flex items-center gap-2.5 relative z-10">
              <button 
                onClick={handleUploadClick}
                className="h-8 w-8 rounded-full armstrong-btn-glass flex items-center justify-center"
                title="Datei anhängen"
              >
                <Paperclip className="h-3.5 w-3.5 text-white/80" />
              </button>
              <button 
                onClick={handleSendClick}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200',
                  inputValue.trim() 
                    ? 'bg-white/30 hover:bg-white/40' 
                    : 'armstrong-btn-glass'
                )}
                title="Senden"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(armstrongContent, document.body);
}