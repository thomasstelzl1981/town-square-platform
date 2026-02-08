/**
 * MessageRenderer — Response-Type-specific rendering for Armstrong messages
 * 
 * Handles different response types: EXPLAIN, DRAFT, SUGGEST_ACTIONS, 
 * CONFIRM_REQUIRED, RESULT, BLOCKED
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ChatMessage, SuggestedAction, DraftContent, ActionResult, BlockedInfo } from '@/hooks/useArmstrongAdvisor';
import { SuggestedActions } from './SuggestedActions';
import { ActionCard, type ProposedAction } from './ActionCard';

interface MessageRendererProps {
  message: ChatMessage;
  onActionSelect?: (action: SuggestedAction) => void;
  onConfirm?: (actionCode: string, params?: Record<string, unknown>) => void;
  onCancel?: (actionCode: string) => void;
  isExecuting?: boolean;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  message,
  onActionSelect,
  onConfirm,
  onCancel,
  isExecuting = false,
}) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return <UserMessage content={message.content} />;
  }

  return (
    <AssistantMessage
      message={message}
      onActionSelect={onActionSelect}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isExecuting={isExecuting}
    />
  );
};

// =============================================================================
// USER MESSAGE
// =============================================================================

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex gap-3 flex-row-reverse">
    <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-muted">
      <span className="text-xs font-medium">Du</span>
    </div>
    <div className="rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] armstrong-message-user">
      {content}
    </div>
  </div>
);

// =============================================================================
// ASSISTANT MESSAGE
// =============================================================================

interface AssistantMessageProps {
  message: ChatMessage;
  onActionSelect?: (action: SuggestedAction) => void;
  onConfirm?: (actionCode: string, params?: Record<string, unknown>) => void;
  onCancel?: (actionCode: string) => void;
  isExecuting?: boolean;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  onActionSelect,
  onConfirm,
  onCancel,
  isExecuting,
}) => {
  return (
    <div className="flex gap-3">
      <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-gradient-to-br from-[hsl(200_85%_45%/0.2)] to-[hsl(140_45%_40%/0.2)]">
        <Globe className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* Main content */}
        {message.content && (
          <div className="rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] armstrong-message-assistant">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Draft content */}
        {message.draft && (
          <DraftBox draft={message.draft} />
        )}

        {/* Pending action (CONFIRM_REQUIRED) */}
        {message.pendingAction && onConfirm && onCancel && (
          <ActionCard
            action={mapToProposedAction(message.pendingAction)}
            onConfirm={onConfirm}
            onCancel={onCancel}
            isExecuting={isExecuting}
            className="max-w-md"
          />
        )}

        {/* Result display */}
        {message.result && (
          <ResultBox result={message.result} />
        )}

        {/* Blocked info */}
        {message.blocked && (
          <BlockedBox blocked={message.blocked} />
        )}

        {/* Suggested actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && onActionSelect && (
          <SuggestedActions 
            actions={message.suggestedActions} 
            onSelect={onActionSelect}
          />
        )}
      </div>
    </div>
  );
};

// =============================================================================
// DRAFT BOX
// =============================================================================

const DraftBox: React.FC<{ draft: DraftContent }> = ({ draft }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      toast({
        title: 'Kopiert',
        description: 'Entwurf in Zwischenablage kopiert.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Fehler',
        description: 'Kopieren fehlgeschlagen.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="rounded-lg border bg-card/50 backdrop-blur-sm overflow-hidden max-w-md">
      <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{draft.title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-status-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="p-3 text-sm">
        {draft.format === 'markdown' ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{draft.content}</ReactMarkdown>
          </div>
        ) : draft.format === 'json' ? (
          <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/50 rounded p-2 overflow-x-auto">
            {typeof draft.content === 'string' 
              ? draft.content 
              : JSON.stringify(draft.content, null, 2)}
          </pre>
        ) : (
          <p className="whitespace-pre-wrap">{draft.content}</p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// RESULT BOX
// =============================================================================

const ResultBox: React.FC<{ result: ActionResult }> = ({ result }) => {
  const isSuccess = result.status === 'completed';

  return (
    <div className={cn(
      "rounded-lg border p-3 max-w-md",
      isSuccess 
        ? "bg-status-success/5 border-status-success/20" 
        : "bg-status-error/5 border-status-error/20"
    )}>
      <div className="flex items-start gap-2">
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4 text-status-success mt-0.5" />
        ) : (
          <XCircle className="h-4 w-4 text-status-error mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium",
            isSuccess ? "text-status-success" : "text-status-error"
          )}>
            {isSuccess ? 'Erfolgreich ausgeführt' : 'Ausführung fehlgeschlagen'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {result.message}
          </p>
          {result.output && Object.keys(result.output).length > 0 && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
              <pre className="whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BLOCKED BOX
// =============================================================================

const BlockedBox: React.FC<{ blocked: BlockedInfo }> = ({ blocked }) => (
  <div className="rounded-lg border border-status-warning/20 bg-status-warning/5 p-3 max-w-md">
    <div className="flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-status-warning mt-0.5" />
      <div>
        <Badge variant="outline" className="text-xs mb-1">
          {blocked.reason_code}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {blocked.message}
        </p>
      </div>
    </div>
  </div>
);

// =============================================================================
// HELPER
// =============================================================================

function mapToProposedAction(pending: ChatMessage['pendingAction']): ProposedAction {
  if (!pending) {
    return { action_code: '' };
  }
  
  return {
    action_code: pending.action_code,
    title: pending.title_de,
    description: pending.summary,
    parameters: pending.params,
    cost_estimate_cents: pending.cost_hint_cents,
  };
}

export default MessageRenderer;
