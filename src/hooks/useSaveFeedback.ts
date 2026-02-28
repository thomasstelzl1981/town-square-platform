/**
 * useSaveFeedback — Shared Zone-2 Save-Feedback Hook
 * Wraps useMutation with automatic toast + query invalidation.
 */
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

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
      toast.error(errorMessage);
      userOnError?.(error, variables, context);
    },
  });
}
