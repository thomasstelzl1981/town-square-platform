import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  LayoutGrid, 
  Building,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface OverviewStats {
  organizations: number;
  profiles: number;
  properties: number;
  activeTiles: number;
}

interface OrgOverview {
  id: string;
  name: string;
  org_type: string;
  created_at: string;
  memberCount: number;
  propertyCount: number;
  activeTileCount: number;
}

export default function Oversight() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    organizations: 0,
    profiles: 0,
    properties: 0,
    activeTiles: 0,
  });
  const [orgOverviews, setOrgOverviews] = useState<OrgOverview[]>([]);

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch counts
      const [orgsRes, profilesRes, propertiesRes, tilesRes, membershipsRes, activationsRes] = await Promise.all([
        supabase.from('organizations').select('*'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('properties').select('*'),
        supabase.from('tenant_tile_activation').select('*').eq('status', 'active'),
        supabase.from('memberships').select('*'),
        supabase.from('tenant_tile_activation').select('*').eq('status', 'active'),
      ]);

      const orgs = orgsRes.data || [];
      const properties = propertiesRes.data || [];
      const memberships = membershipsRes.data || [];
      const activations = activationsRes.data || [];

      setStats({
        organizations: orgs.length,
        profiles: profilesRes.count || 0,
        properties: properties.length,
        activeTiles: tilesRes.data?.length || 0,
      });

      // Build org overviews
      const overviews: OrgOverview[] = orgs.map(org => ({
        id: org.id,
        name: org.name,
        org_type: org.org_type,
        created_at: org.created_at,
        memberCount: memberships.filter(m => m.tenant_id === org.id).length,
        propertyCount: properties.filter(p => p.tenant_id === org.id).length,
        activeTileCount: activations.filter(a => a.tenant_id === org.id).length,
      }));

      setOrgOverviews(overviews);
    } catch (error) {
      console.error('Error fetching oversight data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Oversight</h1>
        <p className="text-muted-foreground">
          Systemweite Übersicht über alle Tenants, Immobilien und Module (Read-only)
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organisationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.organizations}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Benutzer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.profiles}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Immobilien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.properties}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.activeTiles}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="properties">Immobilien</TabsTrigger>
          <TabsTrigger value="modules">Module</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Mitglieder</TableHead>
                  <TableHead className="text-right">Immobilien</TableHead>
                  <TableHead className="text-right">Module</TableHead>
                  <TableHead>Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgOverviews.map(org => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{org.org_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{org.memberCount}</TableCell>
                    <TableCell className="text-right">{org.propertyCount}</TableCell>
                    <TableCell className="text-right">{org.activeTileCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card className="p-8 text-center text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Immobilien-Übersicht</p>
            <p className="text-sm">
              Systemweite Sicht auf alle {stats.properties} Immobilien
            </p>
            <p className="text-xs mt-2">
              Detailansicht in Entwicklung
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card className="p-8 text-center text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Modul-Status</p>
            <p className="text-sm">
              {stats.activeTiles} aktive Modul-Aktivierungen im System
            </p>
            <p className="text-xs mt-2">
              Detailansicht in Entwicklung
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
