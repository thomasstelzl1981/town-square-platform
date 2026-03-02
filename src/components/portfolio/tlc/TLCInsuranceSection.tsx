/**
 * TLC Section: Versicherungskoordination (Policen + Claims)
 * via useInsuranceCoordination
 */
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Shield, AlertTriangle, Euro, FileWarning } from 'lucide-react';
import { useInsuranceCoordination, INSURANCE_TYPE_LABELS } from '@/hooks/useInsuranceCoordination';

interface Props {
  propertyId: string;
}

export function TLCInsuranceSection({ propertyId }: Props) {
  const [open, setOpen] = useState(false);
  const { activePolicies, renewalAlerts, costSummary, claimAnalysis, openClaims, typeLabels } = useInsuranceCoordination();

  const urgentRenewals = renewalAlerts.filter(r => r.urgency === 'urgent' || r.urgency === 'expired');

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Versicherungen
            {urgentRenewals.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{urgentRenewals.length}</Badge>
            )}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-1 pt-2">
        {activePolicies.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            <Shield className="h-6 w-6 mx-auto mb-1 text-muted-foreground/40" />
            <p>Keine Versicherungspolicen hinterlegt</p>
          </div>
        ) : (
          <>
            {/* Cost overview */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 rounded p-2">
                <p className="text-muted-foreground">Policen aktiv</p>
                <p className="font-semibold">{activePolicies.length}</p>
              </div>
              <div className="bg-muted/40 rounded p-2">
                <p className="text-muted-foreground">Jahresprämie gesamt</p>
                <p className="font-semibold">{costSummary.totalAnnualPremium.toFixed(2)} €</p>
              </div>
            </div>

            {/* Renewal alerts */}
            {urgentRenewals.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-destructive uppercase">Dringende Verlängerungen</p>
                {urgentRenewals.map(r => (
                  <div key={r.policy.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-destructive/10">
                    <div>
                      <p className="font-medium">{typeLabels[r.policy.type]}</p>
                      <p className="text-muted-foreground">{r.policy.insurer} — #{r.policy.policyNumber}</p>
                    </div>
                    <Badge variant={r.urgency === 'expired' ? 'destructive' : 'outline'} className="text-[10px]">
                      {r.urgency === 'expired' ? 'Abgelaufen' : `${r.daysUntilExpiry}T`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Policies list */}
            <div className="space-y-1 pt-1">
              {activePolicies.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                  <div>
                    <p className="font-medium">{typeLabels[p.type]}</p>
                    <p className="text-muted-foreground">{p.insurer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{p.premium.toFixed(0)} €/a</p>
                    <p className="text-muted-foreground">SB: {p.deductible.toFixed(0)} €</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Claims summary */}
            {claimAnalysis.totalClaims > 0 && (
              <div className="pt-2 border-t text-xs">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Schadensfälle</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/40 rounded p-1.5 text-center">
                    <p className="text-muted-foreground">Gesamt</p>
                    <p className="font-semibold">{claimAnalysis.totalClaims}</p>
                  </div>
                  <div className="bg-muted/40 rounded p-1.5 text-center">
                    <p className="text-muted-foreground">Quote</p>
                    <p className="font-semibold">{claimAnalysis.approvalRate}%</p>
                  </div>
                  <div className="bg-muted/40 rounded p-1.5 text-center">
                    <p className="text-muted-foreground">Ausgezahlt</p>
                    <p className="font-semibold">{claimAnalysis.totalPaid.toFixed(0)} €</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
