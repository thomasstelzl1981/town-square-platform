/**
 * AdminSessionCard — Current user session info for Admin Dashboard
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

const formatRole = (role: string) => role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

interface Props {
  profile: any;
  memberships: any[];
  isPlatformAdmin: boolean;
  activeOrganization: any;
}

export function AdminSessionCard({ profile, memberships, isPlatformAdmin, activeOrganization }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Aktuelle Sitzung</CardTitle>
        <CardDescription>Authentifizierungs- und Autorisierungskontext</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={DESIGN.FORM_GRID.FULL}>
          <div><p className="text-sm font-medium text-muted-foreground">E-Mail</p><p className="text-sm">{profile?.email}</p></div>
          <div><p className="text-sm font-medium text-muted-foreground">Anzeigename</p><p className="text-sm">{profile?.display_name || '—'}</p></div>
          <div><p className="text-sm font-medium text-muted-foreground">Aktiver Mandant</p><p className="text-sm">{activeOrganization?.name || '—'}</p></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rollen</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {memberships.map((m: any) => (
                <Badge key={m.id} variant={m.role === 'platform_admin' ? 'default' : 'secondary'}>{formatRole(m.role)}</Badge>
              ))}
              {memberships.length === 0 && <span className="text-sm text-muted-foreground">Keine Mitgliedschaften</span>}
            </div>
          </div>
        </div>
        {isPlatformAdmin && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary">🔓 Platform Admin Modus aktiv</p>
            <p className="text-xs text-muted-foreground mt-1">Uneingeschränkter Zugriff auf alle Organisationen, Benutzer und Daten.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
