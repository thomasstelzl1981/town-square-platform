import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Link2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

type OrgDelegation = Tables<'org_delegations'>;
type Organization = Tables<'organizations'>;
type DelegationStatus = Enums<'delegation_status'>;

export default function DelegationsPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [delegations, setDelegations] = useState<OrgDelegation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newDelegation, setNewDelegation] = useState({
    delegate_org_id: '',
    target_org_id: '',
    scopes: '["listings:read", "contacts:read"]',
    expires_at: '',
  });

  // Revoke confirmation
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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
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

  const handleCreate = async () => {
    if (!newDelegation.delegate_org_id || !newDelegation.target_org_id) {
      setCreateError('Delegate and target organizations are required');
      return;
    }

    if (newDelegation.delegate_org_id === newDelegation.target_org_id) {
      setCreateError('Delegate and target organizations must be different');
      return;
    }

    // Validate scopes JSON
    let parsedScopes;
    try {
      parsedScopes = JSON.parse(newDelegation.scopes);
      if (!Array.isArray(parsedScopes)) throw new Error('Scopes must be an array');
    } catch {
      setCreateError('Invalid scopes JSON. Must be a valid JSON array.');
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
          scopes: parsedScopes,
          granted_by: user!.id,
          expires_at: newDelegation.expires_at || null,
        });

      if (error) throw error;

      setCreateOpen(false);
      setNewDelegation({
        delegate_org_id: '',
        target_org_id: '',
        scopes: '["listings:read", "contacts:read"]',
        expires_at: '',
      });
      fetchData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create delegation');
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
    } catch (err: any) {
      setError(err.message || 'Failed to revoke delegation');
    }
    setRevoking(false);
    setRevokeTarget(null);
  };

  const formatScopes = (scopes: any) => {
    if (Array.isArray(scopes)) {
      return scopes.slice(0, 3).join(', ') + (scopes.length > 3 ? ` +${scopes.length - 3} more` : '');
    }
    return JSON.stringify(scopes);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delegations</h2>
          <p className="text-muted-foreground">Manage cross-organization access grants</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Delegation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Delegation</DialogTitle>
              <DialogDescription>
                Grant one organization access to another's resources.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delegate_org">Delegate Organization (who gets access)</Label>
                <Select
                  value={newDelegation.delegate_org_id}
                  onValueChange={(value) => setNewDelegation(prev => ({ ...prev, delegate_org_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_org">Target Organization (whose resources)</Label>
                <Select
                  value={newDelegation.target_org_id}
                  onValueChange={(value) => setNewDelegation(prev => ({ ...prev, target_org_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scopes">Scopes (JSON array)</Label>
                <Textarea
                  id="scopes"
                  value={newDelegation.scopes}
                  onChange={(e) => setNewDelegation(prev => ({ ...prev, scopes: e.target.value }))}
                  placeholder='["listings:read", "contacts:read"]'
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Example scopes: listings:read, listings:write, contacts:read, documents:read
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At (optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={newDelegation.expires_at}
                  onChange={(e) => setNewDelegation(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
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

      {/* Info about immutability */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Delegations are immutable history. Active delegations can be revoked but not deleted.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>All Delegations</CardTitle>
          <CardDescription>Cross-organization access grants and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : delegations.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No delegations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegate → Target</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegations.map((delegation) => (
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
                        {delegation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(delegation.granted_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {delegation.expires_at 
                        ? format(new Date(delegation.expires_at), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {delegation.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(delegation)}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      {delegation.status === 'revoked' && delegation.revoked_at && (
                        <span className="text-xs text-muted-foreground">
                          Revoked {format(new Date(delegation.revoked_at), 'MMM d')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Delegation</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the delegation, preventing further access. The delegation record will be preserved for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={revoking}>
              {revoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
