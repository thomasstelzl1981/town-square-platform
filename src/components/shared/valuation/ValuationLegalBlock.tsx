/**
 * ValuationLegalBlock — Displays Legal & Title information from SSOT
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import type { LegalTitleBlock } from '@/engines/valuation/spec';

interface Props {
  legalTitle: LegalTitleBlock | null;
  className?: string;
}

export function ValuationLegalBlock({ legalTitle, className }: Props) {
  if (!legalTitle) return null;

  const hasData = legalTitle.landRegisterCourt || legalTitle.parcelNumber || legalTitle.wegFlag;
  if (!hasData) return null;

  return (
    <Card className={className}>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Recht & Eigentum</span>
          <Badge variant="outline" className="ml-auto text-[10px]">SSOT</Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {legalTitle.landRegisterCourt && (
            <>
              <span className="text-muted-foreground">Grundbuchamt</span>
              <span className="font-medium">{legalTitle.landRegisterCourt}</span>
            </>
          )}
          {legalTitle.landRegisterSheet && (
            <>
              <span className="text-muted-foreground">Blatt</span>
              <span className="font-medium">{legalTitle.landRegisterSheet}</span>
            </>
          )}
          {legalTitle.landRegisterVolume && (
            <>
              <span className="text-muted-foreground">Band</span>
              <span className="font-medium">{legalTitle.landRegisterVolume}</span>
            </>
          )}
          {legalTitle.parcelNumber && (
            <>
              <span className="text-muted-foreground">Flurstück</span>
              <span className="font-medium">{legalTitle.parcelNumber}</span>
            </>
          )}
          {legalTitle.ownershipSharePercent != null && (
            <>
              <span className="text-muted-foreground">Eigentumsanteil</span>
              <span className="font-medium">{legalTitle.ownershipSharePercent}%</span>
            </>
          )}
          {legalTitle.wegFlag && (
            <>
              <span className="text-muted-foreground">WEG</span>
              <span className="font-medium">Ja {legalTitle.teNumber ? `(TE: ${legalTitle.teNumber})` : ''}</span>
            </>
          )}
          {legalTitle.meaShare != null && (
            <>
              <span className="text-muted-foreground">MEA</span>
              <span className="font-medium">{legalTitle.meaShare}</span>
            </>
          )}
        </div>

        {/* Document status */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={legalTitle.landRegisterExtractAvailable ? 'secondary' : 'outline'} className="text-[10px]">
            {legalTitle.landRegisterExtractAvailable ? '✓' : '✗'} Grundbuchauszug
          </Badge>
          <Badge variant={legalTitle.partitionDeclarationAvailable ? 'secondary' : 'outline'} className="text-[10px]">
            {legalTitle.partitionDeclarationAvailable ? '✓' : '✗'} Teilungserklärung
          </Badge>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-500/10 text-yellow-700 text-[10px]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{legalTitle.encumbrancesNote}</span>
        </div>
      </CardContent>
    </Card>
  );
}
