import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DossierHeaderProps {
  unitCode: string;
  status: 'VERMIETET' | 'LEERSTAND' | 'IN_NEUVERMIETUNG';
  asofDate?: string;
  dataQuality: 'OK' | 'PRUEFEN';
  // Legacy props — accepted but no longer rendered
  address?: string;
  locationLabel?: string;
}

export function DossierHeader({
  unitCode,
  status,
  asofDate,
  dataQuality,
}: DossierHeaderProps) {
  const statusConfig = {
    VERMIETET: { label: 'Vermietet', variant: 'default' as const, className: 'bg-green-600' },
    LEERSTAND: { label: 'Leerstand', variant: 'destructive' as const, className: '' },
    IN_NEUVERMIETUNG: { label: 'In Neuvermietung', variant: 'secondary' as const, className: 'bg-amber-500 text-white' },
  };

  const statusInfo = statusConfig[status] || statusConfig.LEERSTAND;

  return (
    <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/40">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight">{unitCode}</h1>
        <Badge className={statusInfo.className} variant={statusInfo.variant}>
          {statusInfo.label}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        {asofDate && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">Stand: {asofDate}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {dataQuality === 'OK' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs text-green-600">Daten OK</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-500">Prüfen</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
