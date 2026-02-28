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
import { useArmstrongAdvisor } from '@/hooks/useArmstrongAdvisor';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';
import { VoiceButton } from '@/components/shared/VoiceButton';
import { MobileAttachMenu } from './MobileAttachMenu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Send,
  Loader2,
  X
} from 'lucide-react';

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
interface MobileBottomBarProps {
  onChatActivated?: () => void;
}

export function MobileBottomBar({ onChatActivated }: MobileBottomBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
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
      onChatActivated?.();
      advisor.sendMessage(voice.transcript.trim());
    }
    prevListeningRef.current = voice.isListening;
  }, [voice.isListening, voice.transcript]);

  const handleSend = () => {
    if (input.trim() && !advisor.isLoading) {
      setVoiceMode(false);
      if (!isDashboard) navigate('/portal');
      onChatActivated?.();
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

  const handleFilesSelected = (files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <nav
      className="sticky bottom-0 z-40 w-full bg-background/80 backdrop-blur-2xl border-t border-border/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Attached files preview */}
      <AttachedFiles files={attachedFiles} onRemove={removeFile} />

      {/* Input Bar — Lovable-style clean input */}
      <div className="px-3 pb-2 pt-0.5">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/20">
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
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm placeholder:text-muted-foreground/50"
            disabled={advisor.isLoading}
          />

          <Button
            size="sm"
            className={cn(
              'h-7 w-7 p-0 rounded-lg transition-all shrink-0',
              input.trim() && !advisor.isLoading
                ? 'bg-foreground hover:bg-foreground/90'
                : 'bg-muted/60'
            )}
            onClick={handleSend}
            disabled={!input.trim() || advisor.isLoading}
          >
            {advisor.isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Send className="h-3.5 w-3.5 text-background" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
