import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Loader2, LifeBuoy, Edit, AlertTriangle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { DESIGN } from '@/config/designManifest';

type Profile = Tables<'profiles'>;
type Organization = Tables<'organizations'>;
type Membership = Tables<'memberships'>;

interface ProfileWithMemberships extends Profile {
  memberships?: Membership[];
}

export default function SupportPage() {
  const { isPlatformAdmin } = useAuth();
  const [profiles, setProfiles] = useState<ProfileWithMemberships[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const [editTarget, setEditTarget] = useState<ProfileWithMemberships | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    active_tenant_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('organizations')
      .select('*')
      .order('name')
      .then(({ data }) => setOrganizations(data || []));
  }, []);

  if (!isPlatformAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Zugriff eingeschränkt</h2>
        <p className="text-muted-foreground">Der Support-Modus ist nur für Platform Admins verfügbar.</p>
      </div>
    );
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Bitte Suchbegriff eingeben');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(50);

      if (searchError) throw searchError;

      if (data && data.length > 0) {
        const userIds = data.map(p => p.id);
        const { data: membershipsData } = await supabase
          .from('memberships')
          .select('*')
          .in('user_id', userIds);

        const profilesWithMemberships = data.map(profile => ({
          ...profile,
          memberships: membershipsData?.filter(m => m.user_id === profile.id) || [],
        }));

        setProfiles(profilesWithMemberships);
      } else {
        setProfiles([]);
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Suche fehlgeschlagen');
    }
    setLoading(false);
  };

  const openEditDialog = (profile: ProfileWithMemberships) => {
    setEditTarget(profile);
    setEditForm({
      display_name: profile.display_name || '',
      active_tenant_id: profile.active_tenant_id || '',
    });
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editTarget) return;

    setSaving(true);
    setSaveError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name || null,
          active_tenant_id: editForm.active_tenant_id || null,
        })
        .eq('id', editTarget.id);

      if (updateError) throw updateError;

      setProfiles(prev => prev.map(p => 
        p.id === editTarget.id 
          ? { ...p, display_name: editForm.display_name || null, active_tenant_id: editForm.active_tenant_id || null }
          : p
      ));
      setEditTarget(null);
    } catch (err: unknown) {
      setSaveError((err instanceof Error ? err.message : String(err)) || 'Profil konnte nicht aktualisiert werden');
    }
    setSaving(false);
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return '—';
    return organizations.find(o => o.id === orgId)?.name || orgId;
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className={DESIGN.SPACING.SECTION}>
      <div>
        <h2 className={`${DESIGN.TYPOGRAPHY.PAGE_TITLE} flex items-center gap-2`}>
          <LifeBuoy className="h-6 w-6" />
          Support-Modus
        </h2>
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Benutzerprofile suchen und verwalten</p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Platform Admin Zugriff aktiv. Sie können alle Benutzerprofile einsehen und bearbeiten.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Benutzer suchen</CardTitle>
          <CardDescription>Nach E-Mail oder Anzeigename suchen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="E-Mail oder Name eingeben..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Suchen</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {searched && (
        <Card>
          <CardHeader>
          <CardTitle>Suchergebnisse</CardTitle>
            <CardDescription>
              {profiles.length} Benutzer gefunden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Keine Benutzer für Ihre Suche gefunden</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>E-Mail</TableHead>
                    <TableHead>Anzeigename</TableHead>
                    <TableHead>Aktiver Mandant</TableHead>
                    <TableHead>Rollen</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.email}</TableCell>
                      <TableCell>{profile.display_name || '—'}</TableCell>
                      <TableCell>{getOrgName(profile.active_tenant_id)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile.memberships?.map(m => (
                            <Badge 
                              key={m.id}
                              variant={m.role === 'platform_admin' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {formatRole(m.role)}
                            </Badge>
                          ))}
                          {(!profile.memberships || profile.memberships.length === 0) && (
                            <span className="text-xs text-muted-foreground">Keine Rollen</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(profile.created_at), 'dd.MM.yyyy', { locale: de })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(profile)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile Detail View */}
      {editTarget && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Benutzerkontext: {editTarget.email}
            </CardTitle>
            <CardDescription>
              Benutzerprofil einsehen und bearbeiten. Systemfelder sind schreibgeschützt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Read-only context */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Schreibgeschützter Kontext</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Benutzer-ID:</span>
                  <p className="font-mono">{editTarget.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">E-Mail:</span>
                  <p>{editTarget.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Erstellt:</span>
                  <p>{format(new Date(editTarget.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Aktualisiert:</span>
                  <p>{format(new Date(editTarget.updated_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Mitgliedschaften:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {editTarget.memberships?.map(m => (
                    <Badge key={m.id} variant="outline">
                      {getOrgName(m.tenant_id)}: {formatRole(m.role)}
                    </Badge>
                  ))}
                  {(!editTarget.memberships || editTarget.memberships.length === 0) && (
                    <span className="text-sm text-muted-foreground">Keine Mitgliedschaften</span>
                  )}
                </div>
              </div>
            </div>

            {saveError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            {/* Editable fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Anzeigename</Label>
                <Input
                  id="display_name"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Anzeigename des Benutzers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="active_tenant_id">Aktiver Mandant</Label>
                <Select
                  value={editForm.active_tenant_id}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, active_tenant_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aktiven Mandant wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Keine —</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Der Organisationskontext, den der Benutzer nach dem Login sieht
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}