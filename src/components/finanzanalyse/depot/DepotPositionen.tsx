/**
 * DepotPositionen — Table of demo securities positions
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEMO_POSITIONS } from '@/hooks/useDemoDepot';
import { TABLE } from '@/config/designManifest';

export function DepotPositionen() {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
        <p className="text-base font-semibold">Positionen</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={TABLE.HEADER_BG}>
              <th className={TABLE.HEADER_CELL + ' text-left'}>Wertpapier</th>
              <th className={TABLE.HEADER_CELL + ' text-left hidden md:table-cell'}>ISIN</th>
              <th className={TABLE.HEADER_CELL + ' text-right hidden md:table-cell'}>Stück</th>
              <th className={TABLE.HEADER_CELL + ' text-right hidden md:table-cell'}>Kurs</th>
              <th className={TABLE.HEADER_CELL + ' text-right'}>Wert</th>
              <th className={TABLE.HEADER_CELL + ' text-right'}>Perf.</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_POSITIONS.map((p, i) => (
              <tr key={i} className={`${TABLE.ROW_BORDER} ${TABLE.ROW_HOVER}`}>
                <td className={TABLE.BODY_CELL + ' font-medium'}>{p.name}</td>
                <td className={TABLE.BODY_CELL + ' text-muted-foreground hidden md:table-cell font-mono text-xs'}>{p.isin}</td>
                <td className={TABLE.BODY_CELL + ' text-right hidden md:table-cell'}>{p.pieces?.toFixed(2) ?? '—'}</td>
                <td className={TABLE.BODY_CELL + ' text-right hidden md:table-cell'}>{p.price ? `${p.price.toFixed(2)} €` : '—'}</td>
                <td className={TABLE.BODY_CELL + ' text-right font-medium'}>{p.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                <td className={TABLE.BODY_CELL + ' text-right'}>
                  {p.performance !== null ? (
                    <Badge variant="outline" className={p.performance >= 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}>
                      {p.performance >= 0 ? '+' : ''}{p.performance.toFixed(2)}%
                    </Badge>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
