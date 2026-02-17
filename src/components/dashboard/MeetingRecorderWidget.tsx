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
import { Mic, Square, Loader2, FileText, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetingRecorder } from '@/hooks/useMeetingRecorder';
import { MeetingCountdownOverlay } from './MeetingCountdownOverlay';
import { MeetingResultDrawer } from './MeetingResultDrawer';

const MAX_DURATION_SEC = 90 * 60;

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  const progressPct = Math.min((session.durationSec / MAX_DURATION_SEC) * 100, 100);
  const isWarning = session.durationSec >= 80 * 60;

  return (
    <>
      <Card className="border-rose-500/25 aspect-square relative overflow-hidden backdrop-blur-sm bg-card/80">
        {/* Warm glassy gradient background */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-500/15 via-red-500/10 to-amber-500/8" />
        {/* Radial center glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, hsla(0,70%,60%,0.08) 0%, transparent 70%)' }} />

        {/* Recording pulse indicator */}
        {status === 'recording' && (
          <div className="absolute top-3 right-3 z-20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
          </div>
        )}

        <CardContent className="p-4 h-full flex flex-col relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Mic className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-medium">Meeting Recorder</span>
          </div>

          {/* IDLE */}
          {status === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <button
                onClick={requestConsent}
                className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 backdrop-blur-sm flex items-center justify-center text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all duration-200 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.15),0_1px_3px_hsla(0,0%,0%,0.06)]"
              >
                <Circle className="h-5 w-5 fill-current" />
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Aufnahme starten
              </p>
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
              <p className="text-sm font-medium text-foreground truncate max-w-full">
                {session.title}
              </p>
              <p className="text-3xl font-mono text-foreground tabular-nums tracking-tight">
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
              <button
                onClick={triggerCountdown}
                className="h-12 w-12 rounded-full bg-rose-500/15 border border-rose-500/40 backdrop-blur-sm flex items-center justify-center text-rose-500 hover:bg-rose-500/25 active:scale-95 transition-all duration-200 animate-pulse"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
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
              <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
              <p className="text-sm text-muted-foreground text-center">
                Zusammenfassung wird erstellt…
              </p>
            </div>
          )}

          {/* READY */}
          {status === 'ready' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-rose-500" />
              <p className="text-sm font-medium text-foreground text-center">
                Protokoll erstellt
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Ein Aufgaben-Widget wurde auf dem Dashboard abgelegt.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
                  Öffnen
                </Button>
                <Button size="sm" onClick={reset}>
                  Neues Meeting
                </Button>
              </div>
            </div>
          )}

          {/* Progress bar – only during recording */}
          {status === 'recording' && (
            <div className="mt-auto pt-2">
              <div className="h-[3px] w-full rounded-full bg-rose-500/10 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    isWarning ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: `${progressPct}%` }}
                />
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
