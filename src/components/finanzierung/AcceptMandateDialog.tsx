/**
 * MOD-11: Accept Mandate Dialog
 * Uses TermsGatePanel for unified commission confirmation
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TermsGatePanel } from '@/components/shared/TermsGatePanel';
import { useAuth } from '@/contexts/AuthContext';

interface AcceptMandateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanAmount: number | null;
  applicantName: string;
  mandateId?: string;
  tenantId?: string;
  onAccept: () => Promise<void>;
  isPending: boolean;
}

export function AcceptMandateDialog({
  open,
  onOpenChange,
  loanAmount,
  applicantName,
  mandateId,
  tenantId,
  onAccept,
  isPending,
}: AcceptMandateDialogProps) {
  const { user, profile } = useAuth();
  const grossCommission = loanAmount ? loanAmount * 0.005 : 0;
  const partnerName = profile?.display_name || user?.email || 'Finance Manager';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mandat annehmen</DialogTitle>
          <DialogDescription>
            Bitte bestätigen Sie die Provisionsvereinbarung, um das Mandat anzunehmen.
          </DialogDescription>
        </DialogHeader>

        <TermsGatePanel
          templateCode="FIN_MANDATE_ACCEPTANCE_V1"
          templateVariables={{
            partner_name: partnerName,
            partner_email: user?.email || '',
            applicant_name: applicantName,
            loan_amount: loanAmount?.toLocaleString('de-DE') || '0',
            mandate_id: mandateId || '',
          }}
          referenceId={mandateId || ''}
          referenceType="finance_mandate"
          liableUserId={user?.id || ''}
          liableRole="finance_manager"
          grossCommission={grossCommission}
          grossCommissionPct={0.5}
          commissionType="finance"
          tenantId={tenantId || ''}
          onAccept={async () => {
            await onAccept();
          }}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
