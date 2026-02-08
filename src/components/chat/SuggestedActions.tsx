/**
 * SuggestedActions — Action chips component for Armstrong
 * 
 * Displays suggested actions as clickable chips/buttons.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Shield, 
  Coins,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { SuggestedAction } from '@/hooks/useArmstrongAdvisor';

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onSelect: (action: SuggestedAction) => void;
  className?: string;
}

const riskColors = {
  low: 'bg-status-success/10 text-status-success border-status-success/20',
  medium: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  high: 'bg-status-error/10 text-status-error border-status-error/20',
};

const costIcons = {
  free: null,
  metered: <Coins className="h-3 w-3" />,
  premium: <Sparkles className="h-3 w-3" />,
};

export const SuggestedActions: React.FC<SuggestedActionsProps> = ({
  actions,
  onSelect,
  className,
}) => {
  if (!actions.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Zap className="h-3 w-3" />
        Vorgeschlagene Aktionen
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <ActionChip 
            key={action.action_code} 
            action={action} 
            onSelect={onSelect} 
          />
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// ACTION CHIP
// =============================================================================

interface ActionChipProps {
  action: SuggestedAction;
  onSelect: (action: SuggestedAction) => void;
}

const ActionChip: React.FC<ActionChipProps> = ({ action, onSelect }) => {
  const needsConfirmation = action.execution_mode === 'execute_with_confirmation';
  
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-auto py-1.5 px-3 text-left justify-start gap-2 max-w-full",
        "hover:bg-primary/5 hover:border-primary/30 transition-colors"
      )}
      onClick={() => onSelect(action)}
    >
      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="text-xs font-medium truncate max-w-[200px]">
          {action.title_de}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Risk indicator */}
          <span className={cn(
            "inline-flex items-center h-4 px-1.5 rounded text-[10px] font-medium",
            riskColors[action.risk_level]
          )}>
            {action.risk_level === 'high' && <Shield className="h-2.5 w-2.5 mr-0.5" />}
            {action.risk_level}
          </span>
          
          {/* Cost indicator */}
          {action.cost_model !== 'free' && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              {costIcons[action.cost_model]}
              {action.credits_estimate && `${action.credits_estimate} Cr`}
            </span>
          )}
          
          {/* Confirmation indicator */}
          {needsConfirmation && (
            <span className="text-[10px] text-muted-foreground">
              • Bestätigung
            </span>
          )}
        </div>
        
        {/* Why hint */}
        {action.why && (
          <span className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
            {action.why}
          </span>
        )}
      </div>
      
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </Button>
  );
};

export default SuggestedActions;
