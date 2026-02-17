/**
 * AccountsWidget — Bank account & depot balances overview
 * Shows connected account balances (Girokonto, Depot, Tagesgeld etc.)
 * Demo data until bank integration (finAPI) is live.
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, Briefcase, PiggyBank, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountRow {
  label: string;
  bank: string;
  balance: number;
  icon: React.ElementType;
  type: 'giro' | 'depot' | 'savings';
}

const DEMO_ACCOUNTS: AccountRow[] = [
  { label: 'Girokonto', bank: 'ING', balance: 4_832.50, icon: Landmark, type: 'giro' },
  { label: 'Depot', bank: 'Trade Republic', balance: 28_415.00, icon: Briefcase, type: 'depot' },
  { label: 'Tagesgeld', bank: 'ING', balance: 12_500.00, icon: PiggyBank, type: 'savings' },
];

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
  const total = DEMO_ACCOUNTS.reduce((s, a) => s + a.balance, 0);

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
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">
            Demo
          </span>
        </div>

        {/* Account rows */}
        <div className="flex-1 flex flex-col gap-2.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            return (
              <div key={acc.label + acc.bank} className="flex items-center gap-2.5">
                <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', typeColor[acc.type])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{acc.label}</div>
                  <div className="text-[10px] text-muted-foreground">{acc.bank}</div>
                </div>
                <span className="text-sm font-mono tabular-nums font-medium whitespace-nowrap">
                  {fmt(acc.balance)} €
                </span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="pt-2 mt-auto border-t border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Gesamt</span>
            <span className="text-sm font-mono tabular-nums font-bold">
              {fmt(total)} €
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
