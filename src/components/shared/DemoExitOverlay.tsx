/**
 * DemoExitOverlay — Shown when user ends the demo session.
 * Encourages account creation with a marketing CTA.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Heart } from 'lucide-react';

interface DemoExitOverlayProps {
  open: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
}

export function DemoExitOverlay({ open, onClose, onCreateAccount }: DemoExitOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-card">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Hat Ihnen die Demo gefallen?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Erstellen Sie jetzt Ihren eigenen Account und nutzen Sie alle Funktionen 
            der Plattform — mit Ihren eigenen Daten, ohne Einschränkungen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/5 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium">Mit eigenem Account erhalten Sie:</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Voller Lese- und Schreibzugriff auf alle Module
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Persönlicher KI-Assistent Armstrong
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Dokumentenmanagement mit KI-Analyse
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Immobilien-, Finanz- und Versicherungsverwaltung
              </li>
            </ul>
          </div>

          <Button onClick={onCreateAccount} className="w-full" size="lg">
            <UserPlus className="w-4 h-4 mr-2" />
            Eigenen Account erstellen
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <button
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Nein danke, Demo beenden
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center">
          Kostenlos starten • Keine Kreditkarte erforderlich
        </p>
      </DialogContent>
    </Dialog>
  );
}
