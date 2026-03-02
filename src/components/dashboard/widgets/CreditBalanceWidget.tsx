import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { subDays } from 'date-fns';
import { CreditTopUpDialog } from '@/components/shared/CreditTopUpDialog';
import { LOW_BALANCE_THRESHOLD } from '@/config/billingConstants';
import { toast } from 'sonner';

export function CreditBalanceWidget() {
  const { activeTenantId } = useAuth();
  const hasWarnedRef = React.useRef(false);

  const { data: balance } = useQuery({
    queryKey: ['credit-balance-widget', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data } = await supabase
        .from('tenant_credit_balance')
        .select('balance_credits')
        .eq('tenant_id', activeTenantId)
        .maybeSingle();
      return data;
    },
    enabled: !!activeTenantId,
  });

  // 7-day consumption
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { data: weekUsage } = useQuery({
    queryKey: ['credit-week-usage', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return 0;
      const { data } = await supabase
        .from('credit_ledger')
        .select('amount')
        .eq('tenant_id', activeTenantId)
        .eq('kind', 'debit')
        .gte('created_at', sevenDaysAgo);
      return (data || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    },
    enabled: !!activeTenantId,
  });

  const credits = balance?.balance_credits ?? 0;
  const isLow = credits < LOW_BALANCE_THRESHOLD;

  // Low balance toast (once per session)
  React.useEffect(() => {
    if (isLow && !hasWarnedRef.current && credits >= 0) {
      hasWarnedRef.current = true;
      toast.warning('Niedriges Credit-Guthaben', {
        description: `Nur noch ${credits} Credits verfügbar. Jetzt aufladen, um Unterbrechungen zu vermeiden.`,
        duration: 8000,
      });
    }
  }, [isLow, credits]);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Credits</span>
        </div>
        {isLow && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className={`text-3xl font-bold ${isLow ? 'text-destructive' : ''}`}>{credits}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {weekUsage != null && weekUsage > 0 ? (
              <span className="inline-flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                {weekUsage} Credits / 7 Tage
              </span>
            ) : (
              'Kein Verbrauch (7 Tage)'
            )}
          </p>
        </div>
        <CreditTopUpDialog />
      </div>
    </div>
  );
}
