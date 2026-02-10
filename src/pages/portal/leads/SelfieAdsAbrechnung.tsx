/**
 * Selfie Ads Abrechnung — Zahlungen & Rechnungen (Zone 2)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, FileText, Download } from 'lucide-react';

const demoPayments = [
  { id: 1, mandat: 'Kapitalanleger München Q1', betrag: '2.500 €', datum: '28.02.2026', status: 'paid' },
  { id: 2, mandat: 'Vermögensaufbau Berlin', betrag: '4.000 €', datum: '28.12.2025', status: 'paid' },
  { id: 3, mandat: 'Rendite-Immobilien Hamburg', betrag: '3.000 €', datum: '15.03.2026', status: 'paid' },
  { id: 4, mandat: 'Neubau-Kapitalanlage Köln', betrag: '1.500 €', datum: '—', status: 'unpaid' },
];

export default function SelfieAdsAbrechnung() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Abrechnung</h1>
        <p className="text-muted-foreground mt-1">Zahlungen und Rechnungen für Selfie Ads Mandate</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gesamt bezahlt</p>
            <p className="text-2xl font-bold mt-1">9.500 €</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Offen</p>
            <p className="text-2xl font-bold mt-1">1.500 €</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Mandate gesamt</p>
            <p className="text-2xl font-bold mt-1">4</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment list */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2"><FileText className="h-4 w-4" /> Zahlungsübersicht</h3>
          <div className="space-y-2">
            {demoPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div>
                  <p className="text-sm font-medium">{p.mandat}</p>
                  <p className="text-xs text-muted-foreground">{p.datum}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{p.betrag}</span>
                  <Badge variant={p.status === 'paid' ? 'default' : 'destructive'}>
                    {p.status === 'paid' ? 'Bezahlt' : 'Offen'}
                  </Badge>
                  {p.status === 'paid' && (
                    <Button variant="ghost" size="sm"><Download className="h-3 w-3" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
