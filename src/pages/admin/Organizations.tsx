import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, Enums } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Building2, AlertTriangle, Users, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PdfExportFooter } from '@/components/pdf';
import { DESIGN } from '@/config/designManifest';

type Organization = Tables<'organizations'>;
type OrgType = Enums<'org_type'>;

interface OrgWithCounts extends Organization {
  memberCount: number;
  moduleCount: number;
}

const ORG_TYPE_HIERARCHY: Record<OrgType, OrgType[]> = {
  internal: ['partner'],
  partner: ['sub_partner', 'client'],
  sub_partner: ['client'],
  client: [],
  renter: [],
};

export default function Organizations() {
  const { isPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [organizations, setOrganizations] = useState<OrgWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  const [typeFilter, setTypeFilter] = useState<OrgType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    org_type: '' as OrgType | '',
    parent_id: '' as string,
  });

  async function fetchOrganizations() {
    setLoading(true);
    setError(null);
    try {
      const [orgsRes, membershipsRes, activationsRes] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('memberships').select('tenant_id'),
        supabase.from('tenant_tile_activation').select('tenant_id').eq('status', 'active'),
      ]);

      if (orgsRes.error) throw orgsRes.error;
      const orgs = orgsRes.data || [];
      const memberships = membershipsRes.data || [];
      const activations = activationsRes.data || [];

      const orgsWithCounts: OrgWithCounts[] = orgs.map(org => ({
        ...org,
        memberCount: memberships.filter(m => m.tenant_id === org.id).length,
        moduleCount: activations.filter(a => a.tenant_id === org.id).length,
      }));

      setOrganizations(orgsWithCounts);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const getOrgTypeVariant = (type: OrgType) => {
    switch (type) {
      case 'internal': return 'default';
      case 'partner': return 'secondary';
      default: return 'outline';
    }
  };

  const formatOrgType = (type: OrgType) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getAllowedChildTypes = (parentType: OrgType | null): OrgType[] => {
    if (!parentType) return ['internal'];
    return ORG_TYPE_HIERARCHY[parentType] || [];
  };

  const handleCreate = async () => {
    if (!newOrg.name || !newOrg.slug || !newOrg.org_type) {
      setCreateError('Alle Felder sind erforderlich');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const parent = newOrg.parent_id 
        ? organizations.find(o => o.id === newOrg.parent_id) 
        : null;

      const depth = parent ? parent.depth + 1 : 0;
      const materialized_path = parent 
        ? `${parent.materialized_path}${parent.id}/`
        : '/';

      const { error } = await supabase
        .from('organizations')
        .insert({
          name: newOrg.name,
          slug: newOrg.slug,
          org_type: newOrg.org_type as OrgType,
          parent_id: newOrg.parent_id || null,
          depth,
          materialized_path,
        } as any);

      if (error) throw error;

      setCreateOpen(false);
      setNewOrg({ name: '', slug: '', org_type: '', parent_id: '' });
      fetchOrganizations();
    } catch (err: unknown) {
      setCreateError((err instanceof Error ? err.message : String(err)) || 'Organisation konnte nicht erstellt werden');
    }
    setCreating(false);
  };

  const selectedParent = newOrg.parent_id 
    ? organizations.find(o => o.id === newOrg.parent_id) 
    : null;
  
  const filteredOrganizations = organizations.filter(org => {
    const matchesType = typeFilter === 'all' || org.org_type === typeFilter;
    const matchesSearch = searchQuery === '' || 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.public_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });
  const allowedTypes = getAllowedChildTypes(selectedParent?.org_type || null);

  return (
    <div className={DESIGN.SPACING.SECTION} ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Kunden & Tenants</h2>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>Mandanten, Partner und Benutzer verwalten</p>
        </div>
        {isPlatformAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neue Organisation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Organisation erstellen</DialogTitle>
                <DialogDescription>
                  Neue Organisation im System anlegen. Hierarchieregeln werden durchgesetzt.
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
                  <Label htmlFor="parent">Eltern-Organisation</Label>
                  <Select
                    value={newOrg.parent_id}
                    onValueChange={(value) => setNewOrg(prev => ({ 
                      ...prev, 
                      parent_id: value === 'none' ? '' : value,
                      org_type: ''
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Eltern-Organisation wählen (oder keine für Root)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Root (ohne Eltern) —</SelectItem>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} ({formatOrgType(org.org_type)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_type">Organisationstyp</Label>
                  <Select
                    value={newOrg.org_type}
                    onValueChange={(value) => setNewOrg(prev => ({ ...prev, org_type: value as OrgType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Typ wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {formatOrgType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {!newOrg.parent_id 
                      ? 'Root-Organisationen müssen vom Typ "Internal" sein' 
                      : `Erlaubt unter ${selectedParent?.org_type}: ${allowedTypes.map(formatOrgType).join(', ')}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    placeholder="acme-corp"
                  />
                  <p className="text-xs text-muted-foreground">URL-freundlicher Bezeichner</p>
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
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Alle Tenants</CardTitle>
              <CardDescription>
                {filteredOrganizations.length} von {organizations.length} Organisationen
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Suche nach Name, Slug oder Kunden-Nr..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as OrgType | 'all')}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Typ-Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="sub_partner">Sub Partner</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="renter">Renter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                {organizations.length === 0 ? 'Keine Organisationen gefunden' : 'Keine Treffer für Filter'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunden-Nr.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Users className="h-3 w-3" /> Mitglieder
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <LayoutGrid className="h-3 w-3" /> Module
                    </span>
                  </TableHead>
                  <TableHead>Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow 
                    key={org.id} 
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/organizations/${org.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {org.public_id || '—'}
                    </TableCell>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge variant={getOrgTypeVariant(org.org_type)}>
                        {formatOrgType(org.org_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{org.memberCount}</TableCell>
                    <TableCell className="text-right">{org.moduleCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(org.created_at), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PdfExportFooter
        contentRef={contentRef}
        documentTitle="Kunden & Tenants"
        subtitle={`${organizations.length} Organisationen im System`}
        moduleName="Zone 1 Admin"
      />
    </div>
  );
}
