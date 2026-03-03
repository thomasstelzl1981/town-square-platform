/**
 * useSaveFeedback — Shared Zone-2 Save-Feedback Hook
 * Wraps useMutation with automatic toast + query invalidation.
 * Intercepts demo-mode RLS errors with a user-friendly message.
 */
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isDemoSession } from '@/config/demoAccountConfig';

interface SaveFeedbackOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onSuccess' | 'onError'> {
  /** Toast message on success (default: 'Gespeichert') */
  successMessage?: string;
  /** Toast message on error (default: 'Fehler beim Speichern') */
  errorMessage?: string;
  /** Query keys to invalidate on success */
  invalidateKeys?: string[][];
  /** Additional onSuccess callback */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  /** Additional onError callback */
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
}

/** Check if an error is a demo-mode RLS write block */
function isDemoRlsError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    (msg.includes('row-level security') || msg.includes('violates row-level security')) &&
    isDemoSession()
  );
}

export function useSaveFeedback<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: SaveFeedbackOptions<TData, TError, TVariables, TContext>,
) {
  const queryClient = useQueryClient();
  const {
    successMessage = 'Gespeichert',
    errorMessage = 'Fehler beim Speichern',
    invalidateKeys = [],
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      toast.success(successMessage);
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      userOnSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (isDemoRlsError(error)) {
        toast.info('Demo-Modus: Änderungen können nicht gespeichert werden.', {
          description: 'Erstellen Sie einen eigenen Account, um alle Funktionen zu nutzen.',
          duration: 4000,
        });
      } else {
        toast.error(errorMessage);
      }
      userOnError?.(error, variables, context);
    },
  });
}
