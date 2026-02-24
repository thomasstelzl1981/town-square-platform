import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Link2, XCircle, AlertTriangle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ScopePicker, AVAILABLE_SCOPES } from '@/components/admin/ScopePicker';
import { PdfExportFooter } from '@/components/pdf';
import { DESIGN } from '@/config/designManifest';

type OrgDelegation = Tables<'org_delegations'>;
type Organization = Tables<'organizations'>;
type DelegationStatus = Enums<'delegation_status'>;

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  revoked: 'Widerrufen',
  expired: 'Abgelaufen',
};

export default function DelegationsPage() {
  const { isPlatformAdmin, user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [delegations, setDelegations] = useState<OrgDelegation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<DelegationStatus | 'all'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newDelegation, setNewDelegation] = useState({
    delegate_org_id: '',
    target_org_id: '',
    scopes: [] as string[],
    expires_at: '',
  });

  const [viewTarget, setViewTarget] = useState<OrgDelegation | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<OrgDelegation | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [orgsRes, delegationsRes] = await Promise.all([
        supabase.from('organizations').select('*').order('name'),
        supabase.from('org_delegations').select('*').order('created_at', { ascending: false }),
      ]);

      if (orgsRes.error) throw orgsRes.error;
      if (delegationsRes.error) throw delegationsRes.error;

      setOrganizations(orgsRes.data || []);
      setDelegations(delegationsRes.data || []);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden der Daten');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const getOrgName = (orgId: string) => {
    return organizations.find(o => o.id === orgId)?.name || orgId;
  };

  const getStatusVariant = (status: DelegationStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'revoked': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'outline';
    }
  };

  const getScopeLabel = (scopeValue: string) => {
    return AVAILABLE_SCOPES.find(s => s.value === scopeValue)?.label || scopeValue;
  };

  const handleCreate = async () => {
    if (!newDelegation.delegate_org_id || !newDelegation.target_org_id) {
      setCreateError('Delegat- und Ziel-Organisation sind erforderlich');
      return;
    }

    if (newDelegation.delegate_org_id === newDelegation.target_org_id) {
      setCreateError('Delegat- und Ziel-Organisation müssen unterschiedlich sein');
      return;
    }

    if (newDelegation.scopes.length === 0) {
      setCreateError('Mindestens ein Scope muss ausgewählt werden');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const { error } = await supabase
        .from('org_delegations')
        .insert({
          delegate_org_id: newDelegation.delegate_org_id,
          target_org_id: newDelegation.target_org_id,
          scopes: newDelegation.scopes,
          granted_by: user!.id,
          expires_at: newDelegation.expires_at || null,
        });

      if (error) throw error;

      setCreateOpen(false);
      setNewDelegation({ delegate_org_id: '', target_org_id: '', scopes: [], expires_at: '' });
      fetchData();
    } catch (err: unknown) {
      setCreateError((err instanceof Error ? err.message : String(err)) || 'Delegierung konnte nicht erstellt werden');
    }
    setCreating(false);
  };

  const handleRevoke = async () => {
    if (!revokeTarget || !user) return;

    setRevoking(true);
    try {
      const { error } = await supabase
        .from('org_delegations')
        .update({
          status: 'revoked' as DelegationStatus,
          revoked_by: user.id,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', revokeTarget.id);

      if (error) throw error;
      fetchData();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Delegierung konnte nicht widerrufen werden');
    }
    setRevoking(false);
    setRevokeTarget(null);
  };

  const filteredDelegations = delegations.filter(d => 
    statusFilter === 'all' || d.status === statusFilter
  );

  const formatScopes = (scopes: any) => {
    if (Array.isArray(scopes)) {
      if (scopes.length === 0) return 'Keine';
      return scopes.slice(0, 2).map(s => getScopeLabel(s)).join(', ') + 
        (scopes.length > 2 ? ` +${scopes.length - 2}` : '');
    }
    return JSON.stringify(scopes);
  };

  return (
    <div className={DESIGN.SPACING.SECTION} ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Delegierungen</h2>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>Organisationsübergreifende Zugriffsrechte verwalten</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Delegierung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Delegierung erstellen</DialogTitle>
              <DialogDescription>
                Einer Organisation Zugriff auf die Ressourcen einer anderen gewähren.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delegate_org">Delegat-Organisation</Label>
                  <Select
                    value={newDelegation.delegate_org_id}
                    onValueChange={(value) => setNewDelegation(prev => ({ ...prev, delegate_org_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wer erhält Zugriff" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Wer erhält Zugriff</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_org">Ziel-Organisation</Label>
                  <Select
                    value={newDelegation.target_org_id}
                    onValueChange={(value) => setNewDelegation(prev => ({ ...prev, target_org_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auf wessen Ressourcen" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Auf wessen Ressourcen</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Scopes (Berechtigungen)</Label>
                <ScopePicker
                  value={newDelegation.scopes}
                  onChange={(scopes) => setNewDelegation(prev => ({ ...prev, scopes }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Ablaufdatum (optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={newDelegation.expires_at}
                  onChange={(e) => setNewDelegation(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Delegierungen sind unveränderliche Historie. Aktive Delegierungen können widerrufen, aber nicht gelöscht werden.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Alle Delegierungen</CardTitle>
              <CardDescription>
                {filteredDelegations.length} von {delegations.length} Delegationen
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DelegationStatus | 'all')}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status-Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="revoked">Widerrufen</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDelegations.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                {delegations.length === 0 ? 'Keine Delegierungen gefunden' : 'Keine Treffer für Filter'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegat → Ziel</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erteilt</TableHead>
                  <TableHead>Ablauf</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDelegations.map((delegation) => (
                  <TableRow key={delegation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getOrgName(delegation.delegate_org_id)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{getOrgName(delegation.target_org_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm text-muted-foreground truncate block">
                        {formatScopes(delegation.scopes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(delegation.status)}>
                        {STATUS_LABELS[delegation.status] || delegation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(delegation.granted_at), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {delegation.expires_at 
                        ? format(new Date(delegation.expires_at), 'dd.MM.yyyy', { locale: de })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewTarget(delegation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {delegation.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(delegation)}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delegierungs-Details</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delegat</p>
                  <p className="mt-1">{getOrgName(viewTarget.delegate_org_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ziel</p>
                  <p className="mt-1">{getOrgName(viewTarget.target_org_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(viewTarget.status)} className="mt-1">
                    {STATUS_LABELS[viewTarget.status] || viewTarget.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Erteilt</p>
                  <p className="mt-1">{format(new Date(viewTarget.granted_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Scopes ({Array.isArray(viewTarget.scopes) ? viewTarget.scopes.length : 0})</p>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(viewTarget.scopes) && viewTarget.scopes.map((scope: string) => (
                    <Badge key={scope} variant="secondary" className="text-xs">
                      {getScopeLabel(scope)}
                    </Badge>
                  ))}
                </div>
              </div>

              {viewTarget.status === 'revoked' && viewTarget.revoked_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Widerrufen</p>
                  <p className="mt-1 text-destructive">
                    {format(new Date(viewTarget.revoked_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Delegierungs-ID</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{viewTarget.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delegierung widerrufen</AlertDialogTitle>
            <AlertDialogDescription>
              Die Delegierung wird widerrufen und der Zugriff unterbunden. Der Eintrag bleibt zur Nachverfolgung erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={revoking}>
              {revoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Widerrufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfExportFooter
        contentRef={contentRef}
        documentTitle="Delegationen"
        subtitle={`${delegations.length} Cross-Org-Zugriffsrechte`}
        moduleName="Zone 1 Admin"
      />
    </div>
  );
}
