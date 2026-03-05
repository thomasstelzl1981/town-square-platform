/**
 * R-3: All 4 Dialogs extracted from Inbox.tsx
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Route } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { InboundItem, RoutingRule, PostserviceMandate, Organization } from './inboxTypes';
import { getStatusBadge, getOrgName } from './inboxHelpers';

/* ── Assignment Dialog ── */
interface AssignDialogProps {
  item: InboundItem | null;
  organizations: Organization[];
  tenantId: string;
  notes: string;
  assigning: boolean;
  onTenantChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onAssign: () => void;
  onClose: () => void;
}

export function AssignDialog({ item, organizations, tenantId, notes, assigning, onTenantChange, onNotesChange, onAssign, onClose }: AssignDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post zuweisen</DialogTitle>
          <DialogDescription>Weisen Sie dieses Dokument einem Tenant zu.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Datei</Label>
            <p className="text-sm text-muted-foreground">{item?.file_name || 'Unbekannt'}</p>
          </div>
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select value={tenantId} onValueChange={onTenantChange}>
              <SelectTrigger><SelectValue placeholder="Tenant auswählen" /></SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notizen (optional)</Label>
            <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onAssign} disabled={assigning || !tenantId}>
            {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Zuweisen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── View Item Dialog ── */
interface ViewDialogProps {
  item: InboundItem | null;
  organizations: Organization[];
  onClose: () => void;
}

export function ViewItemDialog({ item, organizations, onClose }: ViewDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dokument-Details</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dateiname</p>
                <p className="mt-1">{item.file_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(item.status)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quelle</p>
                <p className="mt-1 capitalize">{item.source}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empfänger</p>
                <p className="mt-1">{getOrgName(item.assigned_tenant_id, organizations)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eingegangen</p>
                <p className="mt-1">{format(new Date(item.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
              </div>
              {item.routed_to_zone2_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zugestellt (Zone 2)</p>
                  <p className="mt-1">{format(new Date(item.routed_to_zone2_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{item.id}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Rule Dialog ── */
interface RuleDialogProps {
  ruleDialog: { mode: 'create' | 'edit'; rule?: RoutingRule } | null;
  organizations: Organization[];
  mandates: PostserviceMandate[];
  ruleName: string;
  ruleTargetTenant: string;
  ruleMandateId: string;
  ruleActive: boolean;
  rulePriority: number;
  savingRule: boolean;
  onNameChange: (v: string) => void;
  onTargetTenantChange: (v: string) => void;
  onMandateIdChange: (v: string) => void;
  onActiveChange: (v: boolean) => void;
  onPriorityChange: (v: number) => void;
  onSave: () => void;
  onClose: () => void;
  getOrgName: (tenantId: string | null) => string;
}

export function RuleDialog({
  ruleDialog, organizations, mandates, ruleName, ruleTargetTenant, ruleMandateId,
  ruleActive, rulePriority, savingRule, onNameChange, onTargetTenantChange,
  onMandateIdChange, onActiveChange, onPriorityChange, onSave, onClose, getOrgName: getOrg,
}: RuleDialogProps) {
  return (
    <Dialog open={!!ruleDialog} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ruleDialog?.mode === 'edit' ? 'Regel bearbeiten' : 'Neue Routing-Regel'}</DialogTitle>
          <DialogDescription>Bestimmt, an welchen Tenant eingehende Post zugestellt wird.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={ruleName} onChange={(e) => onNameChange(e.target.value)} placeholder="z.B. Postservice Müller GmbH" />
          </div>
          <div className="space-y-2">
            <Label>Ziel-Tenant</Label>
            <Select value={ruleTargetTenant} onValueChange={onTargetTenantChange}>
              <SelectTrigger><SelectValue placeholder="Tenant auswählen" /></SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mandat (optional)</Label>
            <Select value={ruleMandateId} onValueChange={onMandateIdChange}>
              <SelectTrigger><SelectValue placeholder="Kein Mandat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Kein Mandat</SelectItem>
                {mandates.filter(m => m.status !== 'cancelled').map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {getOrg(m.tenant_id)} — {m.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priorität</Label>
            <Input type="number" value={rulePriority} onChange={(e) => onPriorityChange(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Aktiv</Label>
            <Switch checked={ruleActive} onCheckedChange={onActiveChange} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onSave} disabled={savingRule || !ruleName || !ruleTargetTenant}>
            {savingRule && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {ruleDialog?.mode === 'edit' ? 'Speichern' : 'Erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Mandate Detail Dialog ── */
interface MandateDialogProps {
  mandate: PostserviceMandate | null;
  organizations: Organization[];
  mandateNotes: string;
  mandateStatus: string;
  savingMandate: boolean;
  onNotesChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  onCreateRule: (mandateId: string, tenantId: string) => void;
}

export function MandateDetailDialog({
  mandate, organizations, mandateNotes, mandateStatus, savingMandate,
  onNotesChange, onStatusChange, onSave, onClose, onCreateRule,
}: MandateDialogProps) {
  return (
    <Dialog open={!!mandate} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Auftrag bearbeiten</DialogTitle>
          <DialogDescription>Nachsendeauftrag verwalten und Status ändern</DialogDescription>
        </DialogHeader>
        {mandate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tenant</p>
                <p className="mt-1 font-medium">{getOrgName(mandate.tenant_id, organizations)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Postfach-Nr.</p>
                <p className="mt-1 font-mono">{mandate.tenant_id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eingereicht am</p>
                <p className="mt-1">{format(new Date(mandate.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                <p className="mt-1 text-sm">
                  {(mandate.payload_json as any)?.address || '—'}, {(mandate.payload_json as any)?.postal_code} {(mandate.payload_json as any)?.city}
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium mb-1">Vertragsbedingungen</div>
              <div className="text-muted-foreground space-y-1">
                <div>• Laufzeit: {(mandate.contract_terms as any)?.duration_months || 12} Monate</div>
                <div>• {(mandate.contract_terms as any)?.monthly_credits || 30} Credits / Monat</div>
                <div>• Abrechnung: Jährlich im Voraus (360 Credits)</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={mandateStatus} onValueChange={onStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested">Eingereicht</SelectItem>
                  <SelectItem value="setup_in_progress">In Bearbeitung</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="paused">Pausiert</SelectItem>
                  <SelectItem value="cancelled">Widerrufen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin-Notizen</Label>
              <Textarea value={mandateNotes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Notizen zur Einrichtung..." rows={3} />
            </div>

            {mandateStatus === 'active' && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => { onClose(); onCreateRule(mandate.id, mandate.tenant_id); }}>
                <Route className="h-4 w-4 mr-2" />
                Routing-Regel anlegen
              </Button>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={onSave} disabled={savingMandate}>
            {savingMandate && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
