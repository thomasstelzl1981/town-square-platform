/**
 * ActionCard — Confirmation UI for Armstrong Actions
 * 
 * Displays proposed actions with risk level, cost estimate,
 * and confirm/cancel buttons for user approval.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Coins,
  Shield,
  FileText,
  Database
} from "lucide-react";
import { ArmstrongAction, getAction } from "@/manifests/armstrongManifest";

export interface ProposedAction {
  action_code: string;
  title?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  data_preview?: {
    reads: string[];
    writes: string[];
  };
  cost_estimate_cents?: number;
}

export interface ActionCardProps {
  action: ProposedAction;
  onConfirm: (actionCode: string, parameters?: Record<string, unknown>) => void;
  onCancel: (actionCode: string) => void;
  isExecuting?: boolean;
  className?: string;
}

const riskColors = {
  low: "bg-status-success/10 text-status-success border-status-success/20",
  medium: "bg-status-warning/10 text-status-warning border-status-warning/20",
  high: "bg-status-error/10 text-status-error border-status-error/20",
};

const riskLabels = {
  low: "Niedriges Risiko",
  medium: "Mittleres Risiko",
  high: "Hohes Risiko",
};

const costLabels = {
  free: "Kostenlos",
  metered: "Nach Verbrauch",
  premium: "Premium",
};

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onConfirm,
  onCancel,
  isExecuting = false,
  className,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  // Get action definition from manifest
  const actionDef = getAction(action.action_code);
  
  if (!actionDef) {
    return (
      <div className={cn("rounded-lg border border-destructive/50 bg-destructive/5 p-3", className)}>
        <p className="text-sm text-destructive">Unbekannte Aktion: {action.action_code}</p>
      </div>
    );
  }

  const riskLevel = actionDef.risk_level;
  const costModel = actionDef.cost_model;
  const requiresConfirmation = actionDef.execution_mode === 'execute_with_confirmation' || actionDef.execution_mode === 'draft_only';

  // Format cost estimate
  const formatCost = (cents?: number) => {
    if (!cents || cents === 0) return costLabels[costModel];
    return `~${(cents / 100).toFixed(2)} €`;
  };

  return (
    <div className={cn(
      "rounded-lg border bg-card/50 backdrop-blur-sm overflow-hidden",
      "transition-all duration-200",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono">
                {action.action_code.split('.').pop()}
              </Badge>
              {requiresConfirmation && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Bestätigung erforderlich
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm">
              {action.title || actionDef.title_de}
            </h4>
          </div>
          
          {/* Risk Badge */}
          <Badge 
            variant="outline" 
            className={cn("shrink-0 text-xs", riskColors[riskLevel])}
          >
            {riskLevel === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {riskLabels[riskLevel]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {action.description || actionDef.description_de}
        </p>

        {/* Data Access Preview */}
        {action.data_preview && (
          <div className="flex flex-wrap gap-2 text-xs">
            {action.data_preview.reads.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>Liest: {action.data_preview.reads.join(", ")}</span>
              </div>
            )}
            {action.data_preview.writes.length > 0 && (
              <div className="flex items-center gap-1 text-status-warning">
                <FileText className="h-3 w-3" />
                <span>Schreibt: {action.data_preview.writes.join(", ")}</span>
              </div>
            )}
          </div>
        )}

        {/* Cost Estimate */}
        <div className="flex items-center gap-2 text-xs">
          <Coins className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            Kosten: {formatCost(action.cost_estimate_cents)}
          </span>
          {actionDef.cost_hint_cents && (
            <span className="text-muted-foreground/60">
              (ca. {(actionDef.cost_hint_cents / 100).toFixed(2)} € {actionDef.cost_unit === 'per_page' ? '/Seite' : '/Aufruf'})
            </span>
          )}
        </div>

        {/* Expandable Details */}
        {action.parameters && Object.keys(action.parameters).length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? "Details ausblenden" : "Details anzeigen"}
          </button>
        )}

        {showDetails && action.parameters && (
          <div className="rounded-md bg-muted/50 p-2 text-xs font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(action.parameters, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCancel(action.action_code)}
          disabled={isExecuting}
        >
          <X className="h-4 w-4 mr-1" />
          Abbrechen
        </Button>
        <Button
          size="sm"
          onClick={() => onConfirm(action.action_code, action.parameters)}
          disabled={isExecuting}
          className={cn(
            riskLevel === "high" && "bg-status-error hover:bg-status-error/90"
          )}
        >
          {isExecuting ? (
            <>
              <span className="animate-spin mr-1">⏳</span>
              Wird ausgeführt...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Ausführen
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ActionCard;
