/**
 * DelegationDialogs — Create, View, Revoke dialogs for Delegations page
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ScopePicker, AVAILABLE_SCOPES } from '@/components/admin/ScopePicker';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Tables, Enums } from '@/integrations/supabase/types';

type OrgDelegation = Tables<'org_delegations'>;
type Organization = Tables<'organizations'>;
type DelegationStatus = Enums<'delegation_status'>;

const STATUS_LABELS: Record<string, string> = { active: 'Aktiv', revoked: 'Widerrufen', expired: 'Abgelaufen' };

const getStatusVariant = (status: DelegationStatus) => {
  switch (status) { case 'active': return 'default'; case 'revoked': return 'destructive'; case 'expired': return 'secondary'; default: return 'outline'; }
};

const getScopeLabel = (v: string) => AVAILABLE_SCOPES.find(s => s.value === v)?.label || v;

interface CreateProps { open: boolean; onOpenChange: (v: boolean) => void; organizations: Organization[]; onCreated: () => void; }

export function DelegationCreateDialog({ open, onOpenChange, organizations, onCreated }: CreateProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({ delegate_org_id: '', target_org_id: '', scopes: [] as string[], expires_at: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.delegate_org_id || !form.target_org_id) { setError('Delegat- und Ziel-Organisation sind erforderlich'); return; }
    if (form.delegate_org_id === form.target_org_id) { setError('Delegat- und Ziel-Organisation müssen unterschiedlich sein'); return; }
    if (form.scopes.length === 0) { setError('Mindestens ein Scope muss ausgewählt werden'); return; }
    setCreating(true); setError(null);
    try {
      const { error: e } = await supabase.from('org_delegations').insert({ delegate_org_id: form.delegate_org_id, target_org_id: form.target_org_id, scopes: form.scopes, granted_by: user!.id, expires_at: form.expires_at || null });
      if (e) throw e;
      onOpenChange(false); setForm({ delegate_org_id: '', target_org_id: '', scopes: [], expires_at: '' }); onCreated();
    } catch (err: unknown) { setError((err instanceof Error ? err.message : String(err))); }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Delegierung erstellen</DialogTitle><DialogDescription>Einer Organisation Zugriff auf die Ressourcen einer anderen gewähren.</DialogDescription></DialogHeader>
        {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Delegat-Organisation</Label><Select value={form.delegate_org_id} onValueChange={v => setForm(p => ({ ...p, delegate_org_id: v }))}><SelectTrigger><SelectValue placeholder="Wer erhält Zugriff" /></SelectTrigger><SelectContent>{organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Wer erhält Zugriff</p></div>
            <div className="space-y-2"><Label>Ziel-Organisation</Label><Select value={form.target_org_id} onValueChange={v => setForm(p => ({ ...p, target_org_id: v }))}><SelectTrigger><SelectValue placeholder="Auf wessen Ressourcen" /></SelectTrigger><SelectContent>{organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Auf wessen Ressourcen</p></div>
          </div>
          <div className="space-y-2"><Label>Scopes (Berechtigungen)</Label><ScopePicker value={form.scopes} onChange={s => setForm(p => ({ ...p, scopes: s }))} /></div>
          <div className="space-y-2"><Label>Ablaufdatum (optional)</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button><Button onClick={handleCreate} disabled={creating}>{creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Erstellen</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DetailProps { delegation: OrgDelegation | null; onClose: () => void; getOrgName: (id: string) => string; }

export function DelegationDetailDialog({ delegation, onClose, getOrgName }: DetailProps) {
  return (
    <Dialog open={!!delegation} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Delegierungs-Details</DialogTitle></DialogHeader>
        {delegation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm font-medium text-muted-foreground">Delegat</p><p className="mt-1">{getOrgName(delegation.delegate_org_id)}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Ziel</p><p className="mt-1">{getOrgName(delegation.target_org_id)}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground">Status</p><Badge variant={getStatusVariant(delegation.status)} className="mt-1">{STATUS_LABELS[delegation.status] || delegation.status}</Badge></div>
              <div><p className="text-sm font-medium text-muted-foreground">Erteilt</p><p className="mt-1">{format(new Date(delegation.granted_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p></div>
            </div>
            <div><p className="text-sm font-medium text-muted-foreground mb-2">Scopes ({Array.isArray(delegation.scopes) ? delegation.scopes.length : 0})</p><div className="flex flex-wrap gap-1">{Array.isArray(delegation.scopes) && delegation.scopes.map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{getScopeLabel(s)}</Badge>)}</div></div>
            {delegation.status === 'revoked' && delegation.revoked_at && <div><p className="text-sm font-medium text-muted-foreground">Widerrufen</p><p className="mt-1 text-destructive">{format(new Date(delegation.revoked_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p></div>}
            <div><p className="text-sm font-medium text-muted-foreground">Delegierungs-ID</p><p className="mt-1 font-mono text-xs text-muted-foreground">{delegation.id}</p></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RevokeProps { delegation: OrgDelegation | null; onClose: () => void; onRevoked: () => void; }

export function DelegationRevokeDialog({ delegation, onClose, onRevoked }: RevokeProps) {
  const { user } = useAuth();
  const [revoking, setRevoking] = useState(false);
  const handleRevoke = async () => {
    if (!delegation || !user) return;
    setRevoking(true);
    try {
      const { error } = await supabase.from('org_delegations').update({ status: 'revoked' as DelegationStatus, revoked_by: user.id, revoked_at: new Date().toISOString() }).eq('id', delegation.id);
      if (error) throw error;
      onRevoked();
    } catch {} finally { setRevoking(false); onClose(); }
  };
  return (
    <AlertDialog open={!!delegation} onOpenChange={() => onClose()}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delegierung widerrufen</AlertDialogTitle><AlertDialogDescription>Die Delegierung wird widerrufen und der Zugriff unterbunden.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Abbrechen</AlertDialogCancel><AlertDialogAction onClick={handleRevoke} disabled={revoking}>{revoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Widerrufen</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  );
}
