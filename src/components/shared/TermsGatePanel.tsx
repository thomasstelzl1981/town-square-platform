/**
 * TermsGatePanel — Unified gate component for all commission/contract flows.
 * 
 * Displays contract preview, commission summary, and consent checkbox.
 * On accept: creates user_consent, stores contract in DMS, creates commission record.
 */

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  generateContract,
  calculatePlatformFee,
  formatEUR,
  storeContractAndCreateRecords,
  type ContractVariables,
  type GeneratedContract,
} from '@/lib/contractGenerator';

export interface TermsGatePanelProps {
  templateCode: string;
  templateVariables: ContractVariables;
  referenceId: string;
  referenceType: string;
  liableUserId: string;
  liableRole: 'owner' | 'finance_manager' | 'akquise_manager' | 'vertriebspartner';
  grossCommission: number;
  grossCommissionPct: number;
  commissionType: 'finance' | 'acquisition' | 'sales' | 'lead';
  tenantId: string;
  contactId?: string;
  pipelineId?: string;
  /** Called after consent + commission + contract are created */
  onAccept: (result: { consentId: string; commissionId: string; documentId: string }) => void;
  onCancel?: () => void;
  isPending?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Eigentümer',
  finance_manager: 'Finance Manager',
  akquise_manager: 'Akquise-Manager',
  vertriebspartner: 'Vertriebspartner',
};

const ROLE_PAYMENT_TEXT: Record<string, string> = {
  owner: 'Als Eigentümer zahlen Sie eine Plattformgebühr von 30% der Käufer-Provision bei erfolgreichem Verkauf.',
  finance_manager: 'Sie zahlen als Finance Manager eine Plattformgebühr von 30% Ihrer Bearbeitungsprovision.',
  akquise_manager: 'Sie zahlen als Akquise-Manager eine Plattformgebühr von 30% Ihrer Akquise-Provision.',
  vertriebspartner: 'Sie zahlen als Partner eine Plattformgebühr von 30% bei erfolgreicher Konversion.',
};

export function TermsGatePanel({
  templateCode,
  templateVariables,
  referenceId,
  referenceType,
  liableUserId,
  liableRole,
  grossCommission,
  grossCommissionPct,
  commissionType,
  tenantId,
  contactId,
  pipelineId,
  onAccept,
  onCancel,
  isPending: externalPending,
}: TermsGatePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { platformFee, netCommission } = calculatePlatformFee(grossCommission);

  // Load and render contract template
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const generated = await generateContract(templateCode, {
          ...templateVariables,
          gross_commission: formatEUR(grossCommission),
          gross_commission_pct: `${grossCommissionPct}`,
          platform_fee: formatEUR(platformFee),
          date: new Date().toLocaleDateString('de-DE'),
        });
        if (!cancelled) setContract(generated);
      } catch (err) {
        console.error('Failed to load contract template:', err);
        toast({
          title: 'Fehler',
          description: 'Vertragsvorlage konnte nicht geladen werden.',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [templateCode]);

  const handleAccept = async () => {
    if (!user?.id || !contract) return;
    setSubmitting(true);
    try {
      const result = await storeContractAndCreateRecords({
        tenantId,
        userId: user.id,
        contract,
        liableUserId,
        liableRole,
        grossCommission,
        grossCommissionPct,
        platformFee,
        referenceId,
        referenceType,
        commissionType,
        contactId,
        pipelineId,
      });
      toast({
        title: 'Vertrag akzeptiert',
        description: 'Der Vertrag wurde erstellt und die Provision erfasst.',
      });
      onAccept(result);
    } catch (err) {
      console.error('Failed to store contract:', err);
      toast({
        title: 'Fehler',
        description: 'Vertrag konnte nicht erstellt werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isProcessing = submitting || externalPending;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Vertragsvorlage wird geladen…</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-8 text-destructive">
        Vertragsvorlage konnte nicht geladen werden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{contract.title}</h3>
      </div>

      {/* Contract preview */}
      <ScrollArea className="h-[280px] rounded-xl border bg-muted/30 p-4">
        <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/80 leading-relaxed">
          {contract.content}
        </pre>
      </ScrollArea>

      <Separator />

      {/* Commission summary */}
      <div className="rounded-xl bg-muted/40 p-4 space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Zusammenfassung
        </h4>
        {grossCommission > 0 ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Brutto-Provision:</span>
            <span className="font-medium text-right">{formatEUR(grossCommission)}</span>

            <span className="text-muted-foreground">Plattformgebühr (30%):</span>
            <span className="font-medium text-right text-destructive">
              {formatEUR(platformFee)}
            </span>

            {liableRole !== 'owner' && (
              <>
                <span className="text-muted-foreground">Ihr Anteil:</span>
                <span className="font-semibold text-right text-primary">
                  {formatEUR(netCommission)}
                </span>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Die Vergütung wird bei Mandatsabschluss extern geregelt. Die Plattformgebühr von 30% gilt bei Provisionsauszahlung.
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
          <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {ROLE_PAYMENT_TEXT[liableRole] || ROLE_PAYMENT_TEXT.vertriebspartner}
        </p>
      </div>

      <Separator />

      {/* Consent checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms-consent"
          checked={accepted}
          onCheckedChange={(checked) => setAccepted(checked === true)}
          disabled={isProcessing}
        />
        <label
          htmlFor="terms-consent"
          className="text-sm leading-snug cursor-pointer select-none"
        >
          Ich akzeptiere die Vertragsbedingungen und die Plattformgebühr von 30%.
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Abbrechen
          </Button>
        )}
        <Button
          onClick={handleAccept}
          disabled={!accepted || isProcessing}
        >
          {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Vertrag akzeptieren
        </Button>
      </div>
    </div>
  );
}
