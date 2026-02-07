/**
 * TaskWidget — Square widget card for Armstrong task actions
 * 
 * Displays task info with approve/cancel buttons in a compact square layout.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MailOpen,
  Bell,
  CheckSquare,
  Search,
  StickyNote,
  FolderKanban,
  Lightbulb,
  Send,
  Check, 
  X, 
  Loader2,
  AlertTriangle,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Widget, TaskWidgetType } from '@/types/widget';
import { WIDGET_CONFIGS } from '@/types/widget';

// Icon mapping
const WIDGET_ICONS: Record<TaskWidgetType, typeof Mail> = {
  letter: Mail,
  email: MailOpen,
  reminder: Bell,
  task: CheckSquare,
  research: Search,
  note: StickyNote,
  project: FolderKanban,
  idea: Lightbulb,
};

// Risk level styling
const RISK_CONFIG = {
  low: {
    label: 'Niedrig',
    icon: Shield,
    className: 'bg-status-success/10 text-status-success border-status-success/20',
  },
  medium: {
    label: 'Mittel',
    icon: AlertTriangle,
    className: 'bg-status-warn/10 text-status-warn border-status-warn/20',
  },
  high: {
    label: 'Hoch',
    icon: Zap,
    className: 'bg-status-error/10 text-status-error border-status-error/20',
  },
};

// Cost model display
const COST_LABELS = {
  free: 'Kostenlos',
  metered: 'Verbrauch',
  premium: 'Premium',
};

interface TaskWidgetProps {
  widget: Widget;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  isExecuting?: boolean;
}

export function TaskWidget({ 
  widget, 
  onConfirm, 
  onCancel, 
  isExecuting = false 
}: TaskWidgetProps) {
  const config = WIDGET_CONFIGS[widget.type];
  const Icon = WIDGET_ICONS[widget.type as TaskWidgetType] || Send;
  const risk = RISK_CONFIG[widget.risk_level];
  const RiskIcon = risk.icon;
  
  const timeAgo = formatDistanceToNow(new Date(widget.created_at), { 
    addSuffix: true, 
    locale: de 
  });

  return (
    <Card className="glass-card border-primary/20 aspect-square relative overflow-hidden">
      {/* Gradient Overlay */}
      <div 
        className={cn(
          "absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-br",
          config.gradient
        )}
      />
      
      <CardContent className="p-4 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {config.label_de}
            </span>
          </div>
          <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", risk.className)}>
            <RiskIcon className="h-2.5 w-2.5 mr-0.5" />
            {risk.label}
          </Badge>
        </div>
        
        {/* Title & Description */}
        <div className="flex-1 min-h-0">
          <h4 className="font-medium text-sm text-foreground truncate">
            {widget.title}
          </h4>
          {widget.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {widget.description}
            </p>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-2 space-y-2">
          {/* Meta Info */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{timeAgo}</span>
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
              {COST_LABELS[widget.cost_model]}
            </Badge>
          </div>
          
          {/* Action Buttons - Stack vertically */}
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(widget.id);
              }}
              disabled={isExecuting}
              className="h-7 text-xs gap-1"
            >
              {isExecuting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Freigeben
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(widget.id);
              }}
              disabled={isExecuting}
              className="h-7 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Abbrechen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
