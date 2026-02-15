/**
 * MeetingRecorderWidget — System Widget for live meeting transcription (WF-MEET-01)
 * 
 * States: idle → consent → recording → countdown → processing → ready
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mic, MicOff, Square, Loader2, FileText, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetingRecorder } from '@/hooks/useMeetingRecorder';
import { MeetingCountdownOverlay } from './MeetingCountdownOverlay';
import { MeetingResultDrawer } from './MeetingResultDrawer';

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MeetingRecorderWidget() {
  const {
    session,
    requestConsent,
    confirmConsentAndStart,
    triggerCountdown,
    resumeRecording,
    stopAndProcess,
    reset,
    setTitle,
  } = useMeetingRecorder();

  const [consentChecked, setConsentChecked] = useState(false);
  const [titleInput, setTitleInput] = useState('Meeting');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { status } = session;

  return (
    <>
      <Card className="glass-card border-primary/20 aspect-square relative overflow-hidden">
        {/* Gradient */}
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-br from-red-500/10 to-orange-600/5" />

        {/* Recording pulse */}
        {status === 'recording' && (
          <div className="absolute top-3 right-3 z-20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </div>
        )}

        <CardContent className="p-4 h-full flex flex-col relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center">
              <Mic className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Meeting Recorder
            </span>
          </div>

          {/* IDLE */}
          {status === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Physische Besprechungen live transkribieren
              </p>
              <Button
                onClick={requestConsent}
                size="sm"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Meeting starten
              </Button>
            </div>
          )}

          {/* CONSENT */}
          {status === 'consent' && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              <Input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Meeting-Titel"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Es wird kein Audio gespeichert — nur Text. Alle Teilnehmer müssen einverstanden sein.
              </p>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="meeting-consent"
                  checked={consentChecked}
                  onCheckedChange={(v) => setConsentChecked(!!v)}
                />
                <label htmlFor="meeting-consent" className="text-xs text-foreground cursor-pointer leading-tight">
                  Alle Teilnehmer sind einverstanden
                </label>
              </div>
              <div className="mt-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  size="sm"
                  disabled={!consentChecked}
                  onClick={() => {
                    setTitle(titleInput);
                    confirmConsentAndStart(titleInput);
                  }}
                  className="flex-1 gap-1"
                >
                  <Mic className="h-3 w-3" />
                  Starten
                </Button>
              </div>
            </div>
          )}

          {/* RECORDING */}
          {status === 'recording' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <p className="text-base font-medium text-foreground">
                {session.title}
              </p>
              <p className="text-2xl font-mono text-foreground tabular-nums">
                {formatDuration(session.durationSec)}
              </p>
              {session.sttEngine && (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full",
                  session.sttEngine === 'elevenlabs' 
                    ? "bg-emerald-500/10 text-emerald-600" 
                    : "bg-amber-500/10 text-amber-600"
                )}>
                  {session.sttEngine === 'elevenlabs' ? 'ElevenLabs' : 'Browser'}
                </span>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={triggerCountdown}
                className="gap-2"
              >
                <Square className="h-3 w-3" />
                Stop
              </Button>
            </div>
          )}

          {/* COUNTDOWN */}
          {status === 'countdown' && (
            <MeetingCountdownOverlay
              countdownSec={session.countdownSec}
              onResume={resumeRecording}
              onStop={stopAndProcess}
            />
          )}

          {/* PROCESSING */}
          {status === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Zusammenfassung wird erstellt…
              </p>
            </div>
          )}

          {/* READY */}
          {status === 'ready' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-foreground text-center">
                Protokoll erstellt
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Ein Aufgaben-Widget wurde auf dem Dashboard abgelegt.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawerOpen(true)}
                >
                  Öffnen
                </Button>
                <Button
                  size="sm"
                  onClick={reset}
                >
                  Neues Meeting
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Drawer */}
      {session.resultSessionId && (
        <MeetingResultDrawer
          sessionId={session.resultSessionId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  );
}
