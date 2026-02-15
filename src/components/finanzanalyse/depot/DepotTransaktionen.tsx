/**
 * DepotTransaktionen — Recent demo transactions list
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEMO_TRANSACTIONS } from '@/hooks/useDemoDepot';
import { TABLE } from '@/config/designManifest';
import { ArrowDownLeft, ArrowUpRight, Banknote, PiggyBank } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: typeof ArrowDownLeft; color: string }> = {
  Kauf: { icon: ArrowDownLeft, color: 'text-red-400' },
  Verkauf: { icon: ArrowUpRight, color: 'text-emerald-500' },
  Dividende: { icon: PiggyBank, color: 'text-amber-500' },
  Einzahlung: { icon: Banknote, color: 'text-primary' },
};

export function DepotTransaktionen() {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
        <p className="text-base font-semibold">Letzte Transaktionen</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={TABLE.HEADER_BG}>
              <th className={TABLE.HEADER_CELL + ' text-left'}>Datum</th>
              <th className={TABLE.HEADER_CELL + ' text-left'}>Typ</th>
              <th className={TABLE.HEADER_CELL + ' text-left'}>Wertpapier</th>
              <th className={TABLE.HEADER_CELL + ' text-right hidden md:table-cell'}>Stück</th>
              <th className={TABLE.HEADER_CELL + ' text-right'}>Betrag</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_TRANSACTIONS.map((t, i) => {
              const cfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.Kauf;
              const Icon = cfg.icon;
              return (
                <tr key={i} className={`${TABLE.ROW_BORDER} ${TABLE.ROW_HOVER}`}>
                  <td className={TABLE.BODY_CELL + ' text-muted-foreground'}>{new Date(t.date).toLocaleDateString('de-DE')}</td>
                  <td className={TABLE.BODY_CELL}>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                      <span className="text-sm">{t.type}</span>
                    </div>
                  </td>
                  <td className={TABLE.BODY_CELL + ' font-medium'}>{t.security}</td>
                  <td className={TABLE.BODY_CELL + ' text-right hidden md:table-cell'}>{t.pieces?.toFixed(2) ?? '—'}</td>
                  <td className={TABLE.BODY_CELL + ' text-right font-medium'}>
                    <span className={t.amount >= 0 ? 'text-emerald-500' : 'text-red-400'}>
                      {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
