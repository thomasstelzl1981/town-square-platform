/**
 * WorkspaceOnboarding — Empty state & first-steps guide for new users
 * Shown when no projects exist and no messages are active
 */
import { useState } from 'react';
import { ArmstrongOrb } from '@/components/chat/ArmstrongOrb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  FolderPlus,
  Slash,
  Database,
  Mic,
  Paperclip,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface WorkspaceOnboardingProps {
  onNewProject: () => void;
  onStartChat: (message: string) => void;
}

const QUICK_STARTS = [
  {
    icon: Database,
    label: 'Meine Immobilien analysieren',
    prompt: 'Zeig mir eine Übersicht meiner Immobilien und deren aktuelle Performance.',
  },
  {
    icon: Sparkles,
    label: 'Finanzierung berechnen',
    prompt: 'Hilf mir bei der Berechnung einer neuen Finanzierung.',
  },
  {
    icon: Paperclip,
    label: 'Dokument auswerten',
    prompt: 'Ich möchte ein Dokument hochladen und auswerten lassen.',
  },
];

const FEATURES = [
  {
    icon: FolderPlus,
    title: 'Projekte',
    description: 'Organisiere Aufgaben in Langzeit-Projekten mit eigenem Kontext.',
  },
  {
    icon: Slash,
    title: '/ Aktionen',
    description: 'Tippe / im Chat für kontextsensitive KI-Aktionen aus dem Katalog.',
  },
  {
    icon: Mic,
    title: 'Spracheingabe',
    description: 'Halte die Mikrofon-Taste gedrückt und sprich deine Anfrage.',
  },
  {
    icon: Paperclip,
    title: 'Dokument-Upload',
    description: 'Lade PDFs oder Bilder hoch — Armstrong extrahiert den Inhalt.',
  },
];

export function WorkspaceOnboarding({ onNewProject, onStartChat }: WorkspaceOnboardingProps) {
  const [showFeatures, setShowFeatures] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 max-w-lg mx-auto text-center space-y-6">
      {/* Hero */}
      <div className="space-y-3">
        <ArmstrongOrb state="idle" size={56} />
        <h2 className="text-xl font-bold tracking-tight">
          Willkommen im Armstrong Workspace
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Dein KI-Co-Pilot für Immobilien, Finanzierung und mehr.
          Starte einen Chat, erstelle ein Projekt oder nutze eine Schnellstart-Aktion.
        </p>
      </div>

      {/* Quick starts */}
      <div className="w-full space-y-2">
        {QUICK_STARTS.map((qs) => (
          <button
            key={qs.label}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border/20 hover:border-primary/20 transition-all text-left group"
            onClick={() => onStartChat(qs.prompt)}
          >
            <qs.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm flex-1">{qs.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      {/* New project CTA */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={onNewProject}
      >
        <FolderPlus className="h-4 w-4" />
        Neues Projekt erstellen
      </Button>

      {/* Feature highlights (collapsible) */}
      <button
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        onClick={() => setShowFeatures(!showFeatures)}
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${showFeatures ? 'rotate-90' : ''}`} />
        Was kann Armstrong?
      </button>

      {showFeatures && (
        <div className="grid grid-cols-2 gap-2 w-full">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-3 text-left bg-muted/20 border-border/20">
              <f.icon className="h-4 w-4 text-primary mb-1.5" />
              <p className="text-xs font-medium">{f.title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{f.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
