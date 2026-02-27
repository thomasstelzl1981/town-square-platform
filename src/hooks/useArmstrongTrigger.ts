/**
 * useArmstrongTrigger — "Frag Armstrong" context-menu integration
 * 
 * Provides a trigger to open Armstrong with a pre-filled prompt,
 * scoped to a specific entity (property, document, finance case).
 * 
 * Usage:
 *   const { openWithPrompt } = useArmstrongTrigger();
 *   <Button onClick={() => openWithPrompt('Analysiere diese Immobilie', 'property', propertyId)}>
 *     🤖 Frag Armstrong
 *   </Button>
 */
import { useCallback } from 'react';

interface ArmstrongTriggerEvent {
  prompt: string;
  entityType?: string;
  entityId?: string;
}

export function useArmstrongTrigger() {
  const openWithPrompt = useCallback((
    prompt: string,
    entityType?: string,
    entityId?: string
  ) => {
    const event = new CustomEvent<ArmstrongTriggerEvent>('armstrong:trigger', {
      detail: { prompt, entityType, entityId },
    });
    window.dispatchEvent(event);
  }, []);

  return { openWithPrompt };
}

/**
 * useArmstrongTriggerListener — Used by ChatPanel to listen for trigger events
 */
export function useArmstrongTriggerListener(
  onTrigger: (data: ArmstrongTriggerEvent) => void
) {
  const handler = useCallback((e: Event) => {
    const detail = (e as CustomEvent<ArmstrongTriggerEvent>).detail;
    if (detail?.prompt) onTrigger(detail);
  }, [onTrigger]);

  // Return handler for manual attachment in useEffect
  return { handler };
}
