import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

interface IdentityBlockProps {
  unitCode: string;
  propertyType?: string;
  buildYear?: number;
  wegFlag?: boolean;
  meaOrTeNo?: string;
}

export function IdentityBlock({
  unitCode,
  propertyType,
  buildYear,
  wegFlag,
  meaOrTeNo,
}: IdentityBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Identität
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Akten-ID</span>
          <span className="font-mono font-medium">{unitCode}</span>
        </div>
        {propertyType && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Objektart</span>
            <span>{propertyType}</span>
          </div>
        )}
        {buildYear && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Baujahr</span>
            <span>{buildYear}</span>
          </div>
        )}
        {wegFlag !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">WEG</span>
            <span>{wegFlag ? 'Ja' : 'Nein'}</span>
          </div>
        )}
        {meaOrTeNo && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">MEA/TE-Nr.</span>
            <span className="font-mono">{meaOrTeNo}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
