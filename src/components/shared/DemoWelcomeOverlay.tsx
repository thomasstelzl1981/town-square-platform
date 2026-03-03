/**
 * DemoWelcomeOverlay — Shown once when demo mode starts.
 * Explains what the user is about to experience.
 * Uses sessionStorage to show only once per session.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Eye, ShieldCheck, Rocket } from 'lucide-react';

const WELCOME_SHOWN_KEY = 'sot_demo_welcome_shown';

interface DemoWelcomeOverlayProps {
  open: boolean;
  onDismiss: () => void;
}

export function DemoWelcomeOverlay({ open, onDismiss }: DemoWelcomeOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Only show once per session
    try {
      if (sessionStorage.getItem(WELCOME_SHOWN_KEY) === 'true') {
        onDismiss();
        return;
      }
    } catch { /* ignore */ }
    setVisible(true);
  }, [open, onDismiss]);

  const handleStart = () => {
    try {
      sessionStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    } catch { /* ignore */ }
    setVisible(false);
    onDismiss();
  };

  return (
    <Dialog open={visible} onOpenChange={(v) => { if (!v) handleStart(); }}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-card">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Herzlich willkommen!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Sie betreten jetzt den Demo-Modus von System of a Town — 
            unserer KI-gestützten Plattform für Immobilien, Finanzen und mehr.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Eye className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Voller Lesezugriff</p>
              <p className="text-xs text-muted-foreground">
                Alle Module, Daten und KI-Funktionen stehen Ihnen zur Verfügung.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Keine Änderungen möglich</p>
              <p className="text-xs text-muted-foreground">
                Im Demo-Modus können keine Daten gespeichert oder verändert werden.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Rocket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">KI-Assistent inklusive</p>
              <p className="text-xs text-muted-foreground">
                Nutzen Sie Armstrong, unseren KI-Berater, direkt in der Demo.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleStart} className="w-full mt-2">
          <Sparkles className="w-4 h-4 mr-2" />
          Demo starten
        </Button>

        <p className="text-[11px] text-muted-foreground/60 text-center">
          Tipp: Sie können jederzeit einen eigenen Account erstellen, um alle Funktionen zu nutzen.
        </p>
      </DialogContent>
    </Dialog>
  );
}
