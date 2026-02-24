import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Loader2, AlertTriangle, Lock, Shield, ShieldOff,
  Users, LayoutGrid, CreditCard, FileText, ExternalLink,
  CheckCircle2, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { DESIGN } from '@/config/designManifest';

type Organization = Tables<'organizations'>;
type Membership = Tables<'memberships'>;

interface ProfileInfo {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
}

interface TileActivation {
  tile_code: string;
  tile_name: string;
  status: string;
  activated_at: string;
}

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPlatformAdmin } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [parent, setParent] = useState<Organization | null>(null);
  const [children, setChildren] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileInfo>>(new Map());
  const [tileActivations, setTileActivations] = useState<TileActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lockdown toggle state
  const [lockdownDialogOpen, setLockdownDialogOpen] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [pendingLockdownValue, setPendingLockdownValue] = useState(false);
  const [isTogglingLockdown, setIsTogglingLockdown] = useState(false);
  const [canToggleLockdown, setCanToggleLockdown] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch org, parent, children, memberships, activations in parallel
        const [orgRes, childrenRes, membershipRes, activationsRes, catalogRes] = await Promise.all([
          supabase.from('organizations').select('*').eq('id', id).maybeSingle(),
          supabase.from('organizations').select('*').eq('parent_id', id).order('name'),
          supabase.from('memberships').select('*').eq('tenant_id', id),
          supabase.from('tenant_tile_activation').select('*').eq('tenant_id', id),
          supabase.from('tile_catalog').select('tile_code, title'),
        ]);

        if (orgRes.error) throw orgRes.error;
        if (!orgRes.data) throw new Error('Organisation nicht gefunden');
        
        const org = orgRes.data;
        setOrganization(org);
        setChildren(childrenRes.data || []);
        setMemberships(membershipRes.data || []);

        // Fetch parent if exists
        if (org.parent_id) {
          const { data: parentData } = await supabase
            .from('organizations').select('*').eq('id', org.parent_id).maybeSingle();
          setParent(parentData);
        }

        // Build tile activations with names from catalog
        const catalog = catalogRes.data || [];
        const acts = (activationsRes.data || []).map(a => ({
          tile_code: a.tile_code,
          tile_name: catalog.find(c => c.tile_code === a.tile_code)?.title || a.tile_code,
          status: a.status,
          activated_at: a.activated_at || a.created_at,
        }));
        setTileActivations(acts.sort((a, b) => a.tile_code.localeCompare(b.tile_code)));

        // Fetch profiles for members
        const memberUserIds = (membershipRes.data || []).map(m => m.user_id);
        if (memberUserIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, display_name, email, avatar_url, street, city, postal_code')
            .in('id', memberUserIds);
          
          const profileMap = new Map<string, ProfileInfo>();
          (profileData || []).forEach(p => profileMap.set(p.id, p as ProfileInfo));
          setProfiles(profileMap);
        }

        // Check lockdown permissions
        if (user) {
          if (isPlatformAdmin) {
            setCanToggleLockdown(true);
          } else {
            const { data: directMembership } = await supabase
              .from('memberships').select('role')
              .eq('user_id', user.id).eq('tenant_id', id).eq('role', 'org_admin')
              .maybeSingle();
            setCanToggleLockdown(!!directMembership);
          }
        }
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden');
      }
      setLoading(false);
    }

    fetchData();
  }, [id, user, isPlatformAdmin]);

  const handleLockdownToggle = (newValue: boolean) => {
    setPendingLockdownValue(newValue);
    setLockdownReason('');
    setLockdownDialogOpen(true);
  };

  const confirmLockdownChange = async () => {
    if (!organization || !user) return;
    
    setIsTogglingLockdown(true);
    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ parent_access_blocked: pendingLockdownValue })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      if (lockdownReason.trim()) {
        await supabase.from('audit_events').insert({
          actor_user_id: user.id,
          target_org_id: organization.id,
          event_type: 'parent_access_blocked_reason',
          payload: { reason: lockdownReason.trim() }
        });
      }

      setOrganization({ ...organization, parent_access_blocked: pendingLockdownValue });
      toast.success(pendingLockdownValue 
        ? 'Parent-Zugriff blockiert' 
        : 'Parent-Zugriff wiederhergestellt'
      );
      setLockdownDialogOpen(false);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler');
    }
    setIsTogglingLockdown(false);
  };

  const formatOrgType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Find the org_admin profile for contact display
  const orgAdminMembership = memberships.find(m => m.role === 'org_admin');
  const orgAdminProfile = orgAdminMembership ? profiles.get(orgAdminMembership.user_id) : null;

  const activeModuleCount = tileActivations.filter(t => t.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Organisation nicht gefunden'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={DESIGN.SPACING.SECTION}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>{organization.name}</h2>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>
            Kunden-Nr: {organization.public_id || '—'} · {formatOrgType(organization.org_type)} · Seit {format(new Date(organization.created_at), 'dd.MM.yyyy', { locale: de })}
          </p>
        </div>
        <Badge>{formatOrgType(organization.org_type)}</Badge>
      </div>

      {/* 4-Tab System */}
      <Tabs defaultValue="stammdaten">
        <TabsList>
          <TabsTrigger value="stammdaten" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Stammdaten
          </TabsTrigger>
          <TabsTrigger value="mitglieder" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Mitglieder ({memberships.length})
          </TabsTrigger>
          <TabsTrigger value="module" className="gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Module ({activeModuleCount})
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Credits & Billing
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Stammdaten */}
        <TabsContent value="stammdaten" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Organisation</CardTitle>
                <CardDescription>Tenant-Daten und Einstellungen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{organization.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Slug</p>
                    <p className="text-sm font-mono">{organization.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Typ</p>
                    <Badge variant="outline">{formatOrgType(organization.org_type)}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kunden-Nr.</p>
                    <p className="text-sm font-mono">{organization.public_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tenant-Mode</p>
                    <Badge variant="outline">{(organization as any).tenant_mode || 'production'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tiefe</p>
                    <p className="text-sm">{organization.depth}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Erstellt</p>
                    <p className="text-sm">{format(new Date(organization.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                  </div>
                </div>

                {/* Lockdown Toggle */}
                {organization.parent_id && (
                  <div className={`p-4 rounded-lg border ${organization.parent_access_blocked ? 'bg-destructive/10 border-destructive/30' : 'bg-muted'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {organization.parent_access_blocked ? (
                          <Shield className="h-5 w-5 text-destructive" />
                        ) : (
                          <ShieldOff className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <Label htmlFor="lockdown-toggle" className="text-sm font-medium">
                            Parent-Zugriff blockieren
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Wenn aktiviert, kann kein übergeordneter Mandant auf diese Organisation zugreifen.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="lockdown-toggle"
                        checked={organization.parent_access_blocked}
                        onCheckedChange={handleLockdownToggle}
                        disabled={!canToggleLockdown || isTogglingLockdown}
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Immutable Fields</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    org_type, parent_id, depth, materialized_path können nach Erstellung nicht geändert werden.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Kontaktdaten & Hierarchie */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktdaten (Org-Admin)</CardTitle>
                  <CardDescription>Hauptansprechpartner dieses Tenants</CardDescription>
                </CardHeader>
                <CardContent>
                  {orgAdminProfile ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">{orgAdminProfile.display_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                        <p className="text-sm">{orgAdminProfile.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Anschrift</p>
                        <p className="text-sm">
                          {orgAdminProfile.street || '—'}
                          {orgAdminProfile.city && (
                            <>, {orgAdminProfile.postal_code} {orgAdminProfile.city}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Kein Org-Admin zugewiesen</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hierarchie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Parent</p>
                    {parent ? (
                      <Button variant="outline" size="sm" asChild className="mt-1">
                        <Link to={`/admin/organizations/${parent.id}`}>{parent.name}</Link>
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">— Root-Organisation —</p>
                    )}
                  </div>
                  {children.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Kind-Organisationen ({children.length})</p>
                      <div className="space-y-1">
                        {children.map(child => (
                          <Button key={child.id} variant="ghost" size="sm" className="w-full justify-start" asChild>
                            <Link to={`/admin/organizations/${child.id}`}>
                              {child.name}
                              <Badge variant="outline" className="ml-auto">{formatOrgType(child.org_type)}</Badge>
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Mitglieder */}
        <TabsContent value="mitglieder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mitglieder</CardTitle>
              <CardDescription>
                {memberships.length} Benutzer in dieser Organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Keine Mitglieder gefunden</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benutzer</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Erstellt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map(m => {
                      const profile = profiles.get(m.user_id);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            {profile?.display_name || m.user_id.substring(0, 8) + '…'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {profile?.email || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={m.role === 'platform_admin' ? 'default' : m.role === 'org_admin' ? 'secondary' : 'outline'}>
                              {formatRole(m.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(m.created_at), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Module */}
        <TabsContent value="module" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aktive Module</CardTitle>
                  <CardDescription>
                    {activeModuleCount} von {tileActivations.length} Modulen aktiv
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/tiles">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Modul-Katalog
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Module werden automatisch über Rollen zugewiesen (sync_tiles_for_user). Änderungen erfolgen über den Modul-Katalog.
              </p>
              {tileActivations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Keine Module aktiviert</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {tileActivations.map(t => (
                    <div
                      key={t.tile_code}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                        t.status === 'active' ? 'bg-muted/30' : 'opacity-50'
                      }`}
                    >
                      {t.status === 'active' ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.tile_name}</p>
                        <p className="text-xs text-muted-foreground">{t.tile_code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Credits & Billing */}
        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credits & Billing</CardTitle>
              <CardDescription>Verbrauch und Abrechnung für diesen Tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Noch nicht verfügbar</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  Das Credit- und Billing-System wird in einer späteren Phase implementiert. 
                  Hier werden dann Saldo, Transaktions-Historie und monatliche Abrechnungen angezeigt.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-sm">
                  <div className="p-4 rounded-lg border bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                    <p className="text-xs text-muted-foreground">Aktueller Saldo</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                    <p className="text-xs text-muted-foreground">Verbrauch (Monat)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lockdown Confirmation Dialog */}
      <Dialog open={lockdownDialogOpen} onOpenChange={setLockdownDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingLockdownValue ? 'Parent-Zugriff blockieren?' : 'Parent-Zugriff wiederherstellen?'}
            </DialogTitle>
            <DialogDescription>
              {pendingLockdownValue 
                ? 'Kein übergeordneter Mandant kann dann auf diese Organisation zugreifen. Platform-Admins sind ausgenommen.'
                : 'Parent-Organisationen erhalten wieder Zugriff basierend auf der Hierarchie.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Begründung (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Begründung eingeben..."
              value={lockdownReason}
              onChange={(e) => setLockdownReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockdownDialogOpen(false)} disabled={isTogglingLockdown}>
              Abbrechen
            </Button>
            <Button 
              variant={pendingLockdownValue ? 'destructive' : 'default'}
              onClick={confirmLockdownChange}
              disabled={isTogglingLockdown}
            >
              {isTogglingLockdown && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingLockdownValue ? 'Blockieren' : 'Wiederherstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
