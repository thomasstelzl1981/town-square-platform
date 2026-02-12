import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Link2, Shield, ExternalLink, Download, Loader2, FileArchive, Rocket } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { PdfExportFooter } from '@/components/pdf';
import { toast } from 'sonner';
interface Stats {
  organizations: number;
  profiles: number;
  memberships: number;
  delegations: number;
  // Breakdown by org type
  orgsByType: Record<string, number>;
  // Breakdown by role
  membershipsByRole: Record<string, number>;
  // Active vs inactive delegations
  activeDelegations: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, memberships, isPlatformAdmin, activeOrganization } = useAuth();
  const [stats, setStats] = useState<Stats>({
    organizations: 0, 
    profiles: 0, 
    memberships: 0, 
    delegations: 0,
    orgsByType: {},
    membershipsByRole: {},
    activeDelegations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportingEngineering, setExportingEngineering] = useState(false);
  const [engineeringExportUrl, setEngineeringExportUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [orgsRes, profilesRes, membershipsRes, delegationsRes, orgsDetailRes, membershipsDetailRes, activeDelegationsRes] = await Promise.all([
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('memberships').select('id', { count: 'exact', head: true }),
          supabase.from('org_delegations').select('id', { count: 'exact', head: true }),
          // Breakdown by org_type
          supabase.from('organizations').select('org_type'),
          // Breakdown by role
          supabase.from('memberships').select('role'),
          // Active delegations only
          supabase.from('org_delegations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ]);
        
        // Count orgs by type
        const orgsByType: Record<string, number> = {};
        (orgsDetailRes.data || []).forEach((org: any) => {
          orgsByType[org.org_type] = (orgsByType[org.org_type] || 0) + 1;
        });
        
        // Count memberships by role
        const membershipsByRole: Record<string, number> = {};
        (membershipsDetailRes.data || []).forEach((m: any) => {
          membershipsByRole[m.role] = (membershipsByRole[m.role] || 0) + 1;
        });
        
        setStats({
          organizations: orgsRes.count || 0,
          profiles: profilesRes.count || 0,
          memberships: membershipsRes.count || 0,
          delegations: delegationsRes.count || 0,
          orgsByType,
          membershipsByRole,
          activeDelegations: activeDelegationsRes.count || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    }
    
    fetchStats();
  }, []);

  const handleExportDocs = async () => {
    setExporting(true);
    setExportUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke('sot-docs-export');
      
      if (error) throw error;
      
      if (data?.success && data?.url) {
        setExportUrl(data.url);
        toast.success('Dokumentation exportiert', {
          description: `${data.file_count} Dateien im ZIP-Archiv`,
        });
      } else {
        throw new Error(data?.error || 'Export fehlgeschlagen');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportEngineering = async () => {
    setExportingEngineering(true);
    setEngineeringExportUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke('sot-docs-export-engineering');
      
      if (error) throw error;
      
      if (data?.success && data?.url) {
        setEngineeringExportUrl(data.url);
        toast.success('Engineering-Export erstellt', {
          description: `${data.file_count} Dateien (${Math.round(data.byte_size / 1024)} KB)`,
        });
      } else {
        throw new Error(data?.error || 'Export fehlgeschlagen');
      }
    } catch (error) {
      console.error('Engineering export error:', error);
      toast.error('Export fehlgeschlagen', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    } finally {
      setExportingEngineering(false);
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={DESIGN.SPACING.SECTION} ref={contentRef}>
      <div>
        <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Dashboard</h2>
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Welcome to the System of a Town Admin Portal</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Schnellzugriff auf alle Bereiche</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Portal Super User Entry */}
          <div>
            <p className="text-sm font-medium mb-2">Zone 2 – Portal</p>
            <Button 
              variant="default" 
              onClick={() => window.location.href = '/portal'}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Portal Super User öffnen
            </Button>
          </div>

          {/* Zone 3 Websites */}
          <div>
            <p className="text-sm font-medium mb-2">Zone 3 – Websites</p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/website/kaufy')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Kaufy
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/website/sot')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                System of a Town
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/website/miety')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Miety
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/website/futureroom')}
                className="gap-2"
              >
                <Rocket className="h-4 w-4" />
                Future Room
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/website/acquiary')}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                Acquiary
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Go-live: kaufy.app | systemofatown.app | miety.app | futureroom.app
            </p>
          </div>

          {/* Published Kaufy Preview Link */}
          {isPlatformAdmin && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Published Preview</p>
              <Button 
                variant="outline" 
                onClick={() => window.open(`${window.location.origin}/website/kaufy`, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Kaufy Preview (Published)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PIN-geschützt (Code: 4409) – öffnet in neuem Tab
              </p>
            </div>
          )}
          {/* Documentation Export */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Dokumentation</p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button 
                variant="outline" 
                onClick={handleExportDocs}
                disabled={exporting}
                className="gap-2"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileArchive className="h-4 w-4" />
                )}
                {exporting ? 'Exportiere...' : 'Baseline-Docs'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleExportEngineering}
                disabled={exportingEngineering}
                className="gap-2"
              >
                {exportingEngineering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileArchive className="h-4 w-4" />
                )}
                {exportingEngineering ? 'Exportiere...' : 'Engineering + RFP'}
              </Button>
              
              {exportUrl && (
                <Button 
                  variant="default" 
                  onClick={() => window.open(exportUrl, '_blank')}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baseline ZIP
                </Button>
              )}
              
              {engineeringExportUrl && (
                <Button 
                  variant="default" 
                  onClick={() => window.open(engineeringExportUrl, '_blank')}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Engineering ZIP
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Baseline = Specs & Module | Engineering = SSOT, Inventories, Gaps, Workbench
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current User Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Session
          </CardTitle>
          <CardDescription>Your authentication and authorization context</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={DESIGN.FORM_GRID.FULL}>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Display Name</p>
              <p className="text-sm">{profile?.display_name || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Tenant</p>
              <p className="text-sm">{activeOrganization?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Roles</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {memberships.map(m => (
                  <Badge 
                    key={m.id} 
                    variant={m.role === 'platform_admin' ? 'default' : 'secondary'}
                  >
                    {formatRole(m.role)}
                  </Badge>
                ))}
                {memberships.length === 0 && <span className="text-sm text-muted-foreground">No memberships</span>}
              </div>
            </div>
          </div>
          {isPlatformAdmin && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">🔓 Platform Admin Mode Active</p>
              <p className="text-xs text-muted-foreground mt-1">
                You have unrestricted access to all organizations, users, and data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.organizations}</div>
            {!loading && Object.keys(stats.orgsByType).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(stats.orgsByType).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.profiles}</div>
            <p className="text-xs text-muted-foreground">Registered profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memberships</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.memberships}</div>
            {!loading && Object.keys(stats.membershipsByRole).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(stats.membershipsByRole).map(([role, count]) => (
                  <Badge key={role} variant={role === 'platform_admin' ? 'default' : 'secondary'} className="text-xs">
                    {formatRole(role)}: {count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delegations</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : stats.delegations}</div>
            {!loading && (
              <div className="flex gap-2 mt-2">
                <Badge variant="default" className="text-xs">
                  Active: {stats.activeDelegations}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Revoked: {stats.delegations - stats.activeDelegations}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PDF Export */}
      <PdfExportFooter
        contentRef={contentRef}
        documentTitle="Admin Dashboard"
        subtitle="System of a Town – Übersicht"
        moduleName="Zone 1 Admin"
      />
    </div>
  );
}
