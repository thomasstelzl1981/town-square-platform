/**
 * VerwaltungPropertyAccordion — Collapsible property items for Anlage V
 * Extracted from VerwaltungTab R-30
 */
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { VVAnlageVForm } from '@/components/vv/VVAnlageVForm';
import { calculatePropertyResult } from '@/engines/vvSteuer/engine';

const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  properties: any[];
  openAccordions: Record<string, boolean>;
  contextTaxNumber: string;
  buildPropertyTaxData: (id: string) => any;
  onToggle: (propId: string) => void;
  onSave: (params: { propertyId: string; data: any; overrides: any; taxRefNumber: string; ownershipPercent: number }) => void;
  isSaving: boolean;
}

export function VerwaltungPropertyAccordion({
  properties, openAccordions, contextTaxNumber,
  buildPropertyTaxData, onToggle, onSave, isSaving,
}: Props) {
  return (
    <div className="space-y-3">
      {properties.map((prop: any) => {
        const taxData = buildPropertyTaxData(prop.id);
        const isConfirmed = taxData?.manualData?.confirmed ?? false;
        const isOpen = openAccordions[prop.id] ?? false;
        const result = taxData ? calculatePropertyResult(taxData) : null;

        return (
          <Collapsible key={prop.id} open={isOpen} onOpenChange={() => onToggle(prop.id)}>
            <CollapsibleTrigger asChild>
              <button className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                DESIGN.CARD.BASE,
                isOpen ? "ring-2 ring-primary border-primary" : "border-border/50 hover:border-primary/40",
                isConfirmed && !isOpen && "border-primary/30 bg-primary/5"
              )}>
                <div className="flex items-center gap-3">
                  {isConfirmed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{prop.code || prop.address}</span>
                      <Badge variant="outline" className="text-[10px]">{prop.property_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{prop.address} {prop.address_house_no}, {prop.postal_code} {prop.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {result && (
                    <span className={cn(
                      "text-sm font-semibold",
                      result.surplus >= 0 ? "text-primary" : "text-destructive"
                    )}>
                      {result.surplus >= 0 ? '+' : ''}{fmt(result.surplus)} €
                    </span>
                  )}
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {taxData && (
                <div className="pt-2 pb-4 px-1">
                  <VVAnlageVForm
                    taxData={taxData}
                    contextTaxNumber={contextTaxNumber}
                    onSave={(data, overrides, taxRef, ownershipPct) => onSave({ propertyId: taxData.propertyId, data, overrides, taxRefNumber: taxRef, ownershipPercent: ownershipPct })}
                    isSaving={isSaving}
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
