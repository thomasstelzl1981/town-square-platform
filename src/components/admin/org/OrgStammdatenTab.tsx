/**
 * OrgStammdatenTab — Organization info, contact, hierarchy, lockdown
 * R-19 sub-component
 */
import { Link } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Shield, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type Organization = Tables<'organizations'>;

interface ProfileInfo {
  id: string;
  display_name: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
}

interface Props {
  organization: Organization;
  parent: Organization | null;
  children: Organization[];
  orgAdminProfile: ProfileInfo | null;
  canToggleLockdown: boolean;
  isTogglingLockdown: boolean;
  onLockdownToggle: (val: boolean) => void;
}

const formatOrgType = (type: string) => type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function OrgStammdatenTab({ organization, parent, children, orgAdminProfile, canToggleLockdown, isTogglingLockdown, onLockdownToggle }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Organisation</CardTitle><CardDescription>Tenant-Daten und Einstellungen</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm font-medium text-muted-foreground">Name</p><p className="text-sm font-medium">{organization.name}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Slug</p><p className="text-sm font-mono">{organization.slug}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Typ</p><Badge variant="outline">{formatOrgType(organization.org_type)}</Badge></div>
            <div><p className="text-sm font-medium text-muted-foreground">Kunden-Nr.</p><p className="text-sm font-mono">{organization.public_id || '—'}</p></div>
            <div><p className="text-sm font-medium text-muted-foreground">Tenant-Mode</p><Badge variant="outline">{(organization as any).tenant_mode || 'production'}</Badge></div>
            <div><p className="text-sm font-medium text-muted-foreground">Tiefe</p><p className="text-sm">{organization.depth}</p></div>
            <div className="col-span-2"><p className="text-sm font-medium text-muted-foreground">Erstellt</p><p className="text-sm">{format(new Date(organization.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p></div>
          </div>
          {organization.parent_id && (
            <div className={`p-4 rounded-lg border ${organization.parent_access_blocked ? 'bg-destructive/10 border-destructive/30' : 'bg-muted'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {organization.parent_access_blocked ? <Shield className="h-5 w-5 text-destructive" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <Label htmlFor="lockdown-toggle" className="text-sm font-medium">Parent-Zugriff blockieren</Label>
                    <p className="text-xs text-muted-foreground">Wenn aktiviert, kann kein übergeordneter Mandant auf diese Organisation zugreifen.</p>
                  </div>
                </div>
                <Switch id="lockdown-toggle" checked={organization.parent_access_blocked} onCheckedChange={onLockdownToggle} disabled={!canToggleLockdown || isTogglingLockdown} />
              </div>
            </div>
          )}
          <div className="p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2 mb-2"><Lock className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Immutable Fields</span></div>
            <p className="text-xs text-muted-foreground">org_type, parent_id, depth, materialized_path können nach Erstellung nicht geändert werden.</p>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Kontaktdaten (Org-Admin)</CardTitle><CardDescription>Hauptansprechpartner dieses Tenants</CardDescription></CardHeader>
          <CardContent>
            {orgAdminProfile ? (
              <div className="space-y-3">
                <div><p className="text-sm font-medium text-muted-foreground">Name</p><p className="text-sm font-medium">{orgAdminProfile.display_name || '—'}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">E-Mail</p><p className="text-sm">{orgAdminProfile.email || '—'}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Anschrift</p><p className="text-sm">{orgAdminProfile.street || '—'}{orgAdminProfile.city && <>, {orgAdminProfile.postal_code} {orgAdminProfile.city}</>}</p></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Kein Org-Admin zugewiesen</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Hierarchie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Parent</p>
              {parent ? <Button variant="outline" size="sm" asChild className="mt-1"><Link to={`/admin/organizations/${parent.id}`}>{parent.name}</Link></Button> : <p className="text-sm text-muted-foreground mt-1">— Root-Organisation —</p>}
            </div>
            {children.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Kind-Organisationen ({children.length})</p>
                <div className="space-y-1">
                  {children.map(child => (
                    <Button key={child.id} variant="ghost" size="sm" className="w-full justify-start" asChild>
                      <Link to={`/admin/organizations/${child.id}`}>{child.name}<Badge variant="outline" className="ml-auto">{formatOrgType(child.org_type)}</Badge></Link>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
