/**
 * FinanceDeskMonitorPage — FLC-powered Monitor (replaces legacy leads-based stats)
 */
import { Loader2 } from 'lucide-react';
import { useFLCMonitorCases } from '@/hooks/useFLCMonitorCases';
import { FinanceDeskMonitor } from './FinanceDeskMonitor';

export default function FinanceDeskMonitorPage() {
  const { cases, stuckCases, breachCases, loading, error } = useFLCMonitorCases();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 text-destructive">
        <p className="text-sm">Fehler beim Laden: {error}</p>
      </div>
    );
  }

  return <FinanceDeskMonitor cases={cases} stuckCases={stuckCases} breachCases={breachCases} />;
}
