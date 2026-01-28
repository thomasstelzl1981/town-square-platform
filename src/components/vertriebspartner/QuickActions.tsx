import { PlayCircle, Presentation, AlertTriangle, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      icon: PlayCircle,
      label: 'Beratungsvideo',
      description: 'So funktioniert Immobilieninvestment',
      onClick: () => toast.info('Beratungsvideo wird vorbereitet...', { description: 'Content folgt in Kürze' }),
    },
    {
      icon: Presentation,
      label: 'Präsentation',
      description: 'Investment-Grundlagen für Kunden',
      onClick: () => toast.info('Präsentation wird geladen...', { description: 'Content folgt in Kürze' }),
    },
    {
      icon: AlertTriangle,
      label: 'Risikohinweise',
      description: 'Rechtliche Pflichtinformationen',
      onClick: () => toast.info('Risikohinweise werden geladen...', { description: 'Content folgt in Kürze' }),
    },
    {
      icon: Film,
      label: 'Über uns',
      description: 'Unternehmensvideo für Kunden',
      onClick: () => toast.info('Unternehmensvideo wird geladen...', { description: 'Content folgt in Kürze' }),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="flex flex-col items-center justify-center h-auto py-4 px-3 gap-2 hover:bg-primary/5 hover:border-primary/30"
          onClick={action.onClick}
        >
          <action.icon className="h-6 w-6 text-primary" />
          <div className="text-center">
            <div className="font-medium text-sm">{action.label}</div>
            <div className="text-xs text-muted-foreground">{action.description}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}
