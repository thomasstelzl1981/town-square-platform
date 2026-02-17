/**
 * AccountsWidget — Bank account & depot balances overview
 * Shows connected account balances from applicant_profiles or msv_bank_accounts.
 * Falls back to applicant_profiles when no real bank accounts are linked.
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, Briefcase, PiggyBank, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AccountRow {
  label: string;
  sublabel: string;
  balance: number;
  icon: React.ElementType;
  type: 'giro' | 'depot' | 'savings';
}

function fmt(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const typeColor: Record<string, string> = {
  giro: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  depot: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  savings: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

export const AccountsWidget = memo(function AccountsWidget() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();

  // Fetch applicant profile financial data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['accounts-widget-profile', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('bank_savings, securities_value, life_insurance_value')
        .eq('tenant_id', activeTenantId)
        .eq('party_role', 'primary')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  // Check if real bank accounts exist (msv_bank_accounts)
  const { data: bankAccountsCount, isLoading: bankLoading } = useQuery({
    queryKey: ['accounts-widget-bank', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return 0;
      const { count, error } = await supabase
        .from('msv_bank_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!activeTenantId,
  });

  const isLoading = profileLoading || bankLoading;
  const isDemo = (bankAccountsCount ?? 0) === 0;

  const accounts: AccountRow[] = profileData
    ? [
        {
          label: 'Bankguthaben',
          sublabel: 'Spareinlagen',
          balance: profileData.bank_savings ?? 0,
          icon: Landmark,
          type: 'giro',
        },
        {
          label: 'Wertpapiere',
          sublabel: 'Depot',
          balance: profileData.securities_value ?? 0,
          icon: Briefcase,
          type: 'depot',
        },
        {
          label: 'Lebensversicherung',
          sublabel: 'Rückkaufswert',
          balance: profileData.life_insurance_value ?? 0,
          icon: PiggyBank,
          type: 'savings',
        },
      ]
    : [];

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <Card
      className="h-[260px] md:h-auto md:aspect-square bg-gradient-to-br from-muted/80 to-muted/40 dark:from-muted/30 dark:to-muted/10 border-border/40 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate('/portal/finanzanalyse/dashboard')}
    >
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Konten</span>
          </div>
          {!isLoading && isDemo && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">
              Demo
            </span>
          )}
        </div>

        {/* Account rows */}
        <div className="flex-1 flex flex-col gap-2.5">
          {isLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2.5 w-14" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </>
          ) : (
            accounts.map((acc) => {
              const Icon = acc.icon;
              return (
                <div key={acc.label} className="flex items-center gap-2.5">
                  <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', typeColor[acc.type])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{acc.label}</div>
                    <div className="text-[10px] text-muted-foreground">{acc.sublabel}</div>
                  </div>
                  <span className="text-sm font-mono tabular-nums font-medium whitespace-nowrap">
                    {fmt(acc.balance)} €
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Total */}
        <div className="pt-2 mt-auto border-t border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Gesamt</span>
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <span className="text-sm font-mono tabular-nums font-bold">
                {fmt(total)} €
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
