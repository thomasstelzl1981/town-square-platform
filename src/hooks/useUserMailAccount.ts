/**
 * useUserMailAccount — checks if the current user has a connected mail account.
 * Used to display send-via hint in outbound email UIs.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserMailAccountInfo {
  hasAccount: boolean;
  accountEmail: string | null;
  accountId: string | null;
  isLoading: boolean;
}

export function useUserMailAccount(): UserMailAccountInfo {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-mail-account', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // mail_accounts has no is_default/status column — just grab the first account for this user
      const { data: accounts } = await supabase
        .from('mail_accounts')
        .select('id, email_address')
        .eq('user_id', user.id)
        .limit(1);

      const account = accounts?.[0];
      return account ? { id: account.id, email: account.email_address } : null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    hasAccount: !!data,
    accountEmail: data?.email ?? null,
    accountId: data?.id ?? null,
    isLoading,
  };
}
