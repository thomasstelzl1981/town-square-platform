/**
 * MobileBottomBar — Unified bottom bar for ALL mobile views
 * 
 * Features:
 * - Home button + 4 Area glass buttons (round)
 * - Persistent Armstrong input bar with Voice, Upload, Send
 */

import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';
import { VoiceButton } from '@/components/armstrong/VoiceButton';
import { MobileAttachMenu } from './MobileAttachMenu';
import { areaConfig, type AreaKey } from '@/manifests/areaConfig';
import { MOBILE_HIDDEN_AREAS } from '@/config/mobileConfig';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Send,
  Loader2,
  Database,
  Rocket,
  Wrench,
  LayoutGrid,
  Home,
  X
} from 'lucide-react';

const areaIcons: Record<AreaKey, React.ElementType> = {
  base: Database,
  missions: Rocket,
  operations: Wrench,
  services: LayoutGrid,
};

/* ── Area Nav Button (round) ─────────────────────────── */
function NavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95',
        'h-14 w-14 rounded-full',
        'backdrop-blur-md border shadow-sm',
        isActive
          ? 'bg-primary/15 border-primary/30 text-primary shadow-primary/10'
          : 'bg-white/10 dark:bg-white/5 border-white/15 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
  );
}

/* ── Attached Files Row ──────────────────────────────── */
function AttachedFiles({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <div className="px-4 pb-1 flex gap-1.5 flex-wrap">
      {files.map((file, i) => (
        <div
          key={i}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 text-xs text-muted-foreground max-w-[140px]"
        >
          <span className="truncate">{file.name}</span>
          <button onClick={() => onRemove(i)} className="shrink-0">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
export function MobileBottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeArea, setActiveArea, setMobileNavView, setSelectedMobileModule } = usePortalLayout();
  const advisor = useArmstrongAdvisor();
  const voice = useArmstrongVoice();

  const [input, setInput] = React.useState('');
  const [voiceMode, setVoiceMode] = React.useState(false);
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);
  const prevListeningRef = React.useRef(false);

  const isDashboard = location.pathname === '/portal' || location.pathname === '/portal/';

  // Auto-send transcript when user stops speaking
  React.useEffect(() => {
    if (prevListeningRef.current && !voice.isListening && voice.transcript.trim()) {
      setVoiceMode(true);
      if (!isDashboard) navigate('/portal');
      advisor.sendMessage(voice.transcript.trim());
    }
    prevListeningRef.current = voice.isListening;
  }, [voice.isListening, voice.transcript]);

  const handleSend = () => {
    if (input.trim() && !advisor.isLoading) {
      setVoiceMode(false);
      if (!isDashboard) navigate('/portal');
      advisor.sendMessage(input.trim());
      setInput('');
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = React.useCallback(() => {
    if (voice.isListening) voice.stopListening();
    else voice.startListening();
  }, [voice]);

  const handleAreaClick = (areaKey: AreaKey) => {
    setActiveArea(areaKey);
    setMobileNavView('modules');
    setSelectedMobileModule(null);
    navigate(`/portal/area/${areaKey}`);
  };

  const handleHomeClick = () => {
    navigate('/portal');
  };

  const handleFilesSelected = (files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const mobileAreas = areaConfig.filter(a => !MOBILE_HIDDEN_AREAS.includes(a.key));

  return (
    <nav
      className="sticky bottom-0 z-40 w-full bg-background/60 backdrop-blur-xl border-t border-border/20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Area Navigation — 5 round buttons (Home + 4 Areas) */}
      <div className="px-2 pt-2 pb-3">
        <div className="flex items-center justify-around">
          <NavButton
            icon={Home}
            label="Home"
            isActive={isDashboard}
            onClick={handleHomeClick}
          />
          {mobileAreas.map((area) => (
            <NavButton
              key={area.key}
              icon={areaIcons[area.key]}
              label={area.labelShort}
              isActive={activeArea === area.key && !isDashboard}
              onClick={() => handleAreaClick(area.key)}
            />
          ))}
        </div>
      </div>

      {/* Attached files preview */}
      <AttachedFiles files={attachedFiles} onRemove={removeFile} />

      {/* Input Bar — [Mic] [+] [Input] [Send] */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/30">
          <VoiceButton
            isListening={voice.isListening}
            isProcessing={voice.isProcessing}
            isSpeaking={voice.isSpeaking}
            isConnected={voice.isConnected}
            error={voice.error}
            onToggle={handleVoiceToggle}
            size="md"
          />

          <MobileAttachMenu
            onFilesSelected={handleFilesSelected}
            disabled={advisor.isLoading}
          />

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
            disabled={advisor.isLoading}
          />

          <Button
            size="sm"
            className={cn(
              'h-8 w-8 p-0 rounded-full transition-all shrink-0',
              input.trim() && !advisor.isLoading
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-muted'
            )}
            onClick={handleSend}
            disabled={!input.trim() || advisor.isLoading}
          >
            {advisor.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Send className="h-4 w-4 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
