/**
 * TaskWidget — Square widget card for Armstrong task actions
 * 
 * DESIGN SPEC:
 * - Displays task info in a compact square layout (aspect-square)
 * - Actions: Two round glass buttons at bottom center
 *   - Left: X (cancel/reject) - outline style, hover destructive
 *   - Right: ✓ (approve/confirm) - primary tint, glass effect
 * - No text labels on buttons, only icons
 * - Glass morphism: backdrop-blur-sm, semi-transparent backgrounds
 */

import { Card, CardContent } from '@/components/ui/card';
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
        <div className="mt-auto pt-2">
          {/* Meta Info */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
            <span>{timeAgo}</span>
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
              {COST_LABELS[widget.cost_model]}
            </Badge>
          </div>
          
          {/* Action Buttons - Two round glass buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Cancel Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(widget.id);
              }}
              disabled={isExecuting}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                "bg-background/60 backdrop-blur-sm border border-muted-foreground/20",
                "hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Abbrechen"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Confirm Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm(widget.id);
              }}
              disabled={isExecuting}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                "bg-primary/10 backdrop-blur-sm border border-primary/30",
                "hover:bg-primary/20 hover:border-primary/50 text-primary",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Freigeben"
            >
              {isExecuting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
