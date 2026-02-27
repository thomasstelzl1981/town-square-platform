/**
 * ArmstrongAskButton — Reusable "Frag Armstrong" context button
 * 
 * Dispatches an armstrong:trigger event that opens the chat panel
 * with a pre-filled prompt scoped to a specific entity.
 * 
 * Usage:
 *   <ArmstrongAskButton
 *     prompt="Analysiere diese Immobilie"
 *     entityType="property"
 *     entityId={propertyId}
 *   />
 */
import { useArmstrongTrigger } from '@/hooks/useArmstrongTrigger';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ArmstrongAskButtonProps {
  /** Pre-filled prompt text sent to Armstrong */
  prompt: string;
  /** Entity type (property, mandate, finance_case, document, etc.) */
  entityType?: string;
  /** Entity UUID */
  entityId?: string;
  /** Visual variant */
  variant?: 'icon' | 'compact' | 'full';
  /** Custom label override */
  label?: string;
  /** Additional className */
  className?: string;
}

export function ArmstrongAskButton({
  prompt,
  entityType,
  entityId,
  variant = 'compact',
  label = 'Frag Armstrong',
  className,
}: ArmstrongAskButtonProps) {
  const { openWithPrompt } = useArmstrongTrigger();

  const handleClick = () => {
    openWithPrompt(prompt, entityType, entityId);
  };

  if (variant === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 w-8 p-0', className)}
            onClick={handleClick}
          >
            <Bot className="h-4 w-4 text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === 'full') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        onClick={handleClick}
      >
        <Bot className="h-4 w-4 text-primary" />
        <span>{label}</span>
      </Button>
    );
  }

  // compact (default)
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('gap-1.5 text-xs text-muted-foreground hover:text-primary', className)}
      onClick={handleClick}
    >
      <Bot className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Button>
  );
}
