/**
 * ARMSTRONG CONTAINER — Earth & Parchment Design
 * 
 * Collapsed State: Stylized Earth globe (160px) with blue/green gradient
 * Expanded State: Clean parchment panel (320x500px) with professional styling
 * 
 * Design: Earth globe collapsed + clean white/parchment expanded
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
  Send,
  Globe
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
          /* EXPANDED: Clean Parchment Panel */
          <div 
            ref={containerRef}
            className={cn(
              'w-80 rounded-[20px] flex flex-col overflow-hidden',
              'armstrong-panel-shadow',
              isDarkMode ? 'armstrong-glass-dark' : 'armstrong-glass-light',
              isDragOver && 'ring-2 ring-primary'
            )}
            style={{ height: 500 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Header - Clean Professional */}
            <div className="flex items-center justify-between p-3 armstrong-header-clean">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center",
                  isDarkMode ? "bg-primary/20" : "bg-primary/10"
                )}>
                  <Globe className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-semibold text-sm leading-tight",
                    isDarkMode ? "text-foreground" : "text-foreground"
                  )}>Armstrong</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">AI Co-Pilot</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={toggleArmstrongExpanded}
                  title="Minimieren"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
          /* COLLAPSED: Earth Globe Widget */
          <div 
            ref={containerRef}
            className={cn(
              'h-40 w-40 rounded-full',
              'armstrong-earth armstrong-earth-glow',
              'hover:scale-105 transition-all duration-300 ease-out',
              'flex flex-col items-center justify-center gap-2.5 p-4',
              'cursor-pointer',
              isDragOver && 'scale-110 ring-4 ring-white/40'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Light reflection - atmospheric highlight top */}
            <div 
              className="absolute top-3 left-6 h-14 w-14 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 30%, hsla(200, 90%, 85%, 0.5) 0%, transparent 60%)',
                filter: 'blur(6px)',
              }}
            />
            
            {/* Secondary highlight - sun glint */}
            <div 
              className="absolute top-6 left-10 h-5 w-5 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.7) 0%, transparent 70%)',
                filter: 'blur(2px)',
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
              <div className="h-6 w-6 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                <Globe className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-white/95 tracking-wide drop-shadow-sm">Armstrong</span>
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
                <Paperclip className="h-3.5 w-3.5 text-white/85" />
              </button>
              <button 
                onClick={handleSendClick}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200',
                  inputValue.trim() 
                    ? 'bg-white/35 hover:bg-white/45' 
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