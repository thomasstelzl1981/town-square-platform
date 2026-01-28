import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DossierHeaderProps {
  unitCode: string;
  address: string;
  locationLabel?: string;
  status: 'VERMIETET' | 'LEERSTAND' | 'IN_NEUVERMIETUNG';
  asofDate?: string;
  dataQuality: 'OK' | 'PRUEFEN';
}

export function DossierHeader({
  unitCode,
  address,
  locationLabel,
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
    <div className="border-b pb-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{unitCode}</h1>
            <Badge className={statusInfo.className} variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{address}</span>
            {locationLabel && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>{locationLabel}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          {asofDate && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Stand: {asofDate}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {dataQuality === 'OK' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Daten OK</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-500">Prüfen</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
