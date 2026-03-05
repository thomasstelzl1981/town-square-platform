/**
 * FreischaltungReviewDialog — Approve/Reject dialog
 */
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { ManagerApplication } from './FreischaltungTables';
import { getRoleLabel, getRoleModules } from './FreischaltungTables';

interface FreischaltungReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedApp: ManagerApplication | null;
  reviewAction: 'approve' | 'reject' | null;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  processing: boolean;
  onConfirm: () => void;
}

export function FreischaltungReviewDialog({
  open, onOpenChange, selectedApp, reviewAction,
  rejectionReason, onRejectionReasonChange, processing, onConfirm,
}: FreischaltungReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reviewAction === 'approve' ? 'Manager-Bewerbung genehmigen' : 'Manager-Bewerbung ablehnen'}</DialogTitle>
          <DialogDescription>
            {selectedApp && (
              <>
                <strong>{selectedApp.user_display_name || selectedApp.user_email}</strong>
                {' '}beantragt die Rolle{' '}
                <strong>{getRoleLabel(selectedApp.requested_role)}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {reviewAction === 'approve' && selectedApp && (
            <div className="rounded-lg border p-4 bg-primary/5 space-y-2">
              <p className="text-sm font-medium text-primary">Bei Genehmigung werden folgende Schritte automatisch ausgeführt:</p>
              <ul className="text-xs text-primary/80 space-y-1 list-disc list-inside">
                {!selectedApp.user_id && (
                  <>
                    <li>Neuer Benutzer wird erstellt für <code>{selectedApp.applicant_email}</code></li>
                    <li>Zugangsdaten werden per E-Mail versendet (Password-Reset-Link)</li>
                  </>
                )}
                <li>Organisation wird auf <code>org_type: partner</code> upgegradet</li>
                <li>Mitgliedschaft wird auf <code>{selectedApp.requested_role}</code> gesetzt</li>
                <li>Manager-Modul(e) <code>{getRoleModules(selectedApp.requested_role)}</code> werden aktiviert</li>
              </ul>
              {selectedApp.source_brand && (
                <p className="text-xs text-muted-foreground mt-2">
                  Quelle: <Badge variant="outline" className="text-xs ml-1">{selectedApp.source_brand}</Badge>
                </p>
              )}
            </div>
          )}

          {reviewAction === 'reject' && (
            <div className="space-y-2">
              <Label>Ablehnungsgrund</Label>
              <Textarea value={rejectionReason} onChange={e => onRejectionReasonChange(e.target.value)} placeholder="Begründung für die Ablehnung…" rows={3} />
              <p className="text-xs text-muted-foreground">Der Bewerber erhält diesen Grund und kann sich erneut bewerben.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button
            variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={processing || (reviewAction === 'reject' && !rejectionReason.trim())}
          >
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {reviewAction === 'approve' ? 'Genehmigen & Freischalten' : 'Ablehnen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
