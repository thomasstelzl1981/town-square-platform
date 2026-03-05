/**
 * FMMandateCards — Pending mandate cards for FM Dashboard
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Inbox, Loader2 } from 'lucide-react';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

interface Props {
  mandates: any[];
  loading: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

export function FMMandateCards({ mandates, loading, onAccept, onDecline, isAccepting, isDeclining }: Props) {
  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (mandates.length === 0) {
    return (
      <WidgetGrid>
        <WidgetCell>
          <Card className="glass-card border-dashed border-2 h-full flex flex-col items-center justify-center opacity-50">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"><Inbox className="h-5 w-5 text-muted-foreground" /></div>
              <p className="text-sm font-medium text-muted-foreground">Keine neuen Mandate</p>
              <p className="text-[10px] text-muted-foreground">Neue Mandate erscheinen hier nach Zuweisung</p>
            </CardContent>
          </Card>
        </WidgetCell>
      </WidgetGrid>
    );
  }

  return (
    <WidgetGrid>
      {mandates.map((m: any) => {
        const req = m.finance_requests;
        const ap = req?.applicant_profiles?.[0];
        const name = ap?.first_name && ap?.last_name ? `${ap.first_name} ${ap.last_name}` : 'Unbekannt';
        const loan = ap?.loan_amount_requested;
        return (
          <WidgetCell key={m.id}>
            <Card className="border-primary/20 h-full">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{m.public_id || m.id.slice(0, 8)}</span>
                  <Badge variant="outline">{m.status === 'delegated' ? 'Zugewiesen' : 'Angefragt'}</Badge>
                </div>
                <div><p className="font-medium text-sm">{name}</p>{loan && <p className="text-xs text-muted-foreground">{eurFormat.format(loan)}</p>}</div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => onAccept(m.id)} disabled={isAccepting}><Check className="h-3 w-3 mr-1" />Annehmen</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onDecline(m.id)} disabled={isDeclining}><X className="h-3 w-3 mr-1" />Ablehnen</Button>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        );
      })}
    </WidgetGrid>
  );
}
