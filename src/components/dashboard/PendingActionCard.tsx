/**
 * PendingActionCard — Compact horizontal card for a single pending action
 * Displays action info with approve/cancel buttons
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  FileText, 
  Search, 
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

export interface PendingActionCardProps {
  id: string;
  action_code: string;
  title: string;
  description?: string;
  parameters?: Record<string, unknown>;
  risk_level: 'low' | 'medium' | 'high';
  cost_model: 'free' | 'metered' | 'premium';
  created_at: string;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  isExecuting?: boolean;
}

// Map action codes to icons
function getActionIcon(actionCode: string) {
  if (actionCode.includes('LETTER') || actionCode.includes('SEND')) {
    return Mail;
  }
  if (actionCode.includes('DOC') || actionCode.includes('EXTRACT')) {
    return FileText;
  }
  if (actionCode.includes('SEARCH') || actionCode.includes('WEB')) {
    return Search;
  }
  return Send;
}

// Risk level styling
const riskConfig = {
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
const costLabels = {
  free: 'Kostenlos',
  metered: 'Verbrauchsbasiert',
  premium: 'Premium',
};

// Channel display from parameters
function getChannelDisplay(parameters?: Record<string, unknown>): string | null {
  const channel = parameters?.channel as string | undefined;
  if (!channel) return null;
  
  const channelMap: Record<string, string> = {
    email: 'E-Mail',
    fax: 'Fax',
    post: 'Post',
    sms: 'SMS',
  };
  
  return channelMap[channel] || channel;
}

export function PendingActionCard({
  id,
  action_code,
  title,
  description,
  parameters,
  risk_level,
  cost_model,
  created_at,
  onConfirm,
  onCancel,
  isExecuting = false,
}: PendingActionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const ActionIcon = getActionIcon(action_code);
  const risk = riskConfig[risk_level];
  const RiskIcon = risk.icon;
  const channel = getChannelDisplay(parameters);
  
  const timeAgo = formatDistanceToNow(new Date(created_at), { 
    addSuffix: true, 
    locale: de 
  });

  return (
    <Card 
      className={cn(
        "glass-card border-primary/20 transition-all duration-200",
        isHovered && "border-primary/40 shadow-lg shadow-primary/5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3 md:p-4">
        {/* Mobile: Vertical layout */}
        <div className="flex flex-col gap-3 md:hidden">
          {/* Header Row */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <ActionIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate">
                {title}
              </h4>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] h-5", risk.className)}>
              <RiskIcon className="h-3 w-3 mr-1" />
              {risk.label}
            </Badge>
            
            <Badge variant="secondary" className="text-[10px] h-5">
              {costLabels[cost_model]}
            </Badge>
            
            {channel && (
              <Badge variant="outline" className="text-[10px] h-5 border-muted-foreground/20">
                {channel}
              </Badge>
            )}
            
            <span className="text-[10px] text-muted-foreground ml-auto">
              {timeAgo}
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onConfirm(id)}
              disabled={isExecuting}
              className="flex-1 h-8 text-xs gap-1.5"
            >
              {isExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Freigeben
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(id)}
              disabled={isExecuting}
              className="flex-1 h-8 text-xs gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Abbrechen
            </Button>
          </div>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <ActionIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-foreground">
                {title}
              </h4>
              <span className="text-[10px] text-muted-foreground">
                {timeAgo}
              </span>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={cn("text-[10px] h-5", risk.className)}>
              <RiskIcon className="h-3 w-3 mr-1" />
              {risk.label}
            </Badge>
            
            <Badge variant="secondary" className="text-[10px] h-5">
              {costLabels[cost_model]}
            </Badge>
            
            {channel && (
              <Badge variant="outline" className="text-[10px] h-5 border-muted-foreground/20">
                {channel}
              </Badge>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => onConfirm(id)}
              disabled={isExecuting}
              className="h-8 text-xs gap-1.5 px-3"
            >
              {isExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Freigeben
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(id)}
              disabled={isExecuting}
              className="h-8 text-xs gap-1.5 px-3"
            >
              <X className="h-3.5 w-3.5" />
              Abbrechen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
