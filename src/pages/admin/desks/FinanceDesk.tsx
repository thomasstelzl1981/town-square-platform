/**
 * Finance Desk — Consolidated redirect to FutureRoom (Zone-1)
 * 
 * Legacy: Previously a standalone desk with hardcoded KPI data.
 * Since all financing operations are now managed in FutureRoom,
 * this component serves as a redirect/info banner.
 */
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, ArrowRight } from 'lucide-react';

export default function FinanceDesk() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase">Finance Desk</h1>
        <p className="text-muted-foreground">
          Finanzierungsmanagement — konsolidiert im FutureRoom
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-lg font-semibold">In FutureRoom konsolidiert</h2>
            <p className="text-sm text-muted-foreground">
              Alle Finanzierungsoperationen — Inbox, Berater-Zuweisung, Monitoring und Vertragsmanagement — 
              werden zentral im FutureRoom verwaltet.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/futureroom">
              FutureRoom öffnen <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
