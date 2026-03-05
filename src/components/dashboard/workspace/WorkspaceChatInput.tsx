/**
 * WorkspaceChatInput — Input bar + file attach + data toggle + slash picker
 * Extracted from ArmstrongWorkspace R-28
 */
import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { VoiceButton } from '@/components/shared/VoiceButton';
import { SlashCommandPicker } from '@/components/dashboard/workspace/SlashCommandPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, Loader2, Paperclip, X, Database, Globe } from 'lucide-react';

const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.tif,.docx,.doc,.csv,.xlsx,.xls,.pptx,.ppt,.txt,.md,.json,.xml,.yaml,.yml,.rtf,.odt,.ods,.odp,.html,.htm,.svg,.mp3,.wav,.m4a,.ogg,.mp4,.mov,.avi,.mkv,.zip,.rar,.7z';

interface Props {
  input: string;
  isLoading: boolean;
  isParsing: boolean;
  useMyData: boolean;
  showSlashPicker: boolean;
  slashQuery: string;
  currentModule: string | null;
  documentContext: any;
  attachedFile: { name: string } | null;
  voice: {
    isRecording: boolean;
    isConnecting: boolean;
    isSpeaking: boolean;
    error: string | null;
  };
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSlashSelect: (action: any) => void;
  onSlashClose: () => void;
  onToggleData: () => void;
  onVoicePressStart: () => void;
  onVoicePressEnd: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearDocument: () => void;
}

export function WorkspaceChatInput({
  input, isLoading, isParsing, useMyData, showSlashPicker, slashQuery,
  currentModule, documentContext, attachedFile, voice,
  onInputChange, onSend, onSlashSelect, onSlashClose, onToggleData,
  onVoicePressStart, onVoicePressEnd, onFileUpload, onClearDocument,
}: Props) {
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSlashPicker) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [showSlashPicker, onSend]);

  return (
    <>
      {/* Attached document preview */}
      {attachedFile && !isParsing && (
        <div className="px-4 py-2 border-t border-border/30 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs bg-primary/5 rounded-lg px-3 py-1.5">
            <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate flex-1 font-medium">{attachedFile.name}</span>
            <button onClick={onClearDocument} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <input
        ref={docInputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={onFileUpload}
      />

      {/* Input bar */}
      <div className="p-3 border-t border-border/30 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          {showSlashPicker && (
            <SlashCommandPicker
              query={slashQuery}
              currentModule={currentModule}
              onSelect={onSlashSelect}
              onClose={onSlashClose}
            />
          )}

          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/20">
            <VoiceButton
              isRecording={voice.isRecording}
              isConnecting={voice.isConnecting}
              isSpeaking={voice.isSpeaking}
              error={voice.error}
              onPressStart={onVoicePressStart}
              onPressEnd={onVoicePressEnd}
              size="md"
            />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0 rounded-full shrink-0',
                documentContext ? 'text-primary' : 'text-muted-foreground'
              )}
              onClick={() => docInputRef.current?.click()}
              disabled={isLoading || isParsing}
              title="Dokument anhängen"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={documentContext ? 'Frage zum Dokument...' : 'Nachricht an Armstrong... (/ für Aktionen)'}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
              disabled={isLoading}
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'shrink-0 p-1.5 rounded-full transition-colors',
                      useMyData ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                    )}
                    onClick={onToggleData}
                  >
                    {useMyData ? <Database className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {useMyData ? 'Mit deinen Daten arbeiten (aktiv)' : 'Allgemeiner Modus (ohne Daten)'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              size="sm"
              className={cn(
                'h-8 w-8 p-0 rounded-full transition-all shrink-0',
                input.trim() && !isLoading ? 'bg-primary hover:bg-primary/90' : 'bg-muted'
              )}
              onClick={onSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Send className="h-4 w-4 text-primary-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
