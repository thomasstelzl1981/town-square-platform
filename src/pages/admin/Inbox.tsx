import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Inbox as InboxIcon,
  Mail,
  FileText,
  Upload,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Filter
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface InboundItem {
  id: string;
  source: 'caya' | 'email' | 'upload' | 'api';
  external_id: string | null;
  sender_info: unknown;
  recipient_info: unknown;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  metadata: unknown;
  status: 'pending' | 'assigned' | 'archived' | 'rejected';
  assigned_tenant_id: string | null;
  assigned_contact_id: string | null;
  assigned_property_id: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  notes: string | null;
  created_at: string;
}

interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  match_conditions: unknown;
  action_type: string;
  action_config: unknown;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function InboxPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InboundItem[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Assignment dialog
  const [assignItem, setAssignItem] = useState<InboundItem | null>(null);
  const [assignTenantId, setAssignTenantId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Detail dialog
  const [viewItem, setViewItem] = useState<InboundItem | null>(null);

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, rulesRes, orgsRes] = await Promise.all([
        supabase.from('inbound_items').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('inbound_routing_rules').select('*').order('priority', { ascending: false }),
        supabase.from('organizations').select('id, name').order('name'),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (rulesRes.error) throw rulesRes.error;
      if (orgsRes.error) throw orgsRes.error;

      setItems(itemsRes.data || []);
      setRules(rulesRes.data || []);
      setOrganizations(orgsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  const getOrgName = (tenantId: string | null) => {
    if (!tenantId) return '—';
    return organizations.find(o => o.id === tenantId)?.name || tenantId.slice(0, 8) + '...';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'caya':
        return <Mail className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'upload':
        return <Upload className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'assigned':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-muted-foreground" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'assigned':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
    return true;
  });

  const openAssignDialog = (item: InboundItem) => {
    setAssignItem(item);
    setAssignTenantId(item.assigned_tenant_id || '');
    setAssignNotes(item.notes || '');
  };

  const handleAssign = async () => {
    if (!assignItem || !assignTenantId) return;
    setAssigning(true);
    try {
      const { error } = await supabase
        .from('inbound_items')
        .update({
          status: 'assigned',
          assigned_tenant_id: assignTenantId,
          assigned_by: user?.id,
          assigned_at: new Date().toISOString(),
          notes: assignNotes || null,
        })
        .eq('id', assignItem.id);

      if (error) throw error;
      setAssignItem(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async (item: InboundItem, newStatus: 'archived' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('inbound_items')
        .update({ status: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

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

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const assignedCount = items.filter(i => i.status === 'assigned').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post & Documents</h1>
        <p className="text-muted-foreground">
          Eingehende Dokumente verwalten und zuweisen (Caya, Email, Upload)
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zugewiesen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{assignedCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <InboxIcon className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{items.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Routing-Regeln</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</span>
              <span className="text-muted-foreground text-sm">aktiv</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Posteingang</TabsTrigger>
          <TabsTrigger value="rules">Routing-Regeln</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="pending">Ausstehend</SelectItem>
                      <SelectItem value="assigned">Zugewiesen</SelectItem>
                      <SelectItem value="archived">Archiviert</SelectItem>
                      <SelectItem value="rejected">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Quelle:</Label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="caya">Caya</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="upload">Upload</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eingehende Dokumente</CardTitle>
              <CardDescription>
                {filteredItems.length} von {items.length} Elementen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Dokumente gefunden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quelle</TableHead>
                      <TableHead>Datei</TableHead>
                      <TableHead>Größe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zugewiesen an</TableHead>
                      <TableHead>Eingegangen</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSourceIcon(item.source)}
                            <span className="capitalize">{item.source}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium truncate max-w-[200px] block">
                            {item.file_name || '—'}
                          </span>
                          {item.mime_type && (
                            <span className="text-xs text-muted-foreground">{item.mime_type}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(item.file_size_bytes)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            <Badge variant={getStatusVariant(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getOrgName(item.assigned_tenant_id)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(item.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAssignDialog(item)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(item, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {item.status === 'assigned' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(item, 'archived')}
                            >
                              <Archive className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Alert>
            <Filter className="h-4 w-4" />
            <AlertDescription>
              Routing-Regeln definieren automatische Zuweisungen basierend auf Absender, Empfänger oder Metadaten.
              (Phase 2: Vollständige Regel-Engine)
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle>Aktive Regeln</CardTitle>
              <CardDescription>{rules.length} Regeln definiert</CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Routing-Regeln vorhanden</p>
                  <p className="text-sm text-muted-foreground">
                    Regel-Management wird in Phase 2 implementiert
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Priorität</TableHead>
                      <TableHead>Aktion</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.action_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={!!assignItem} onOpenChange={() => setAssignItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokument zuweisen</DialogTitle>
            <DialogDescription>
              Weise dieses Dokument einem Tenant zu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Datei</Label>
              <p className="text-sm text-muted-foreground">{assignItem?.file_name || 'Unbekannt'}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant</Label>
              <Select value={assignTenantId} onValueChange={setAssignTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tenant auswählen" />
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
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Textarea
                id="notes"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Zusätzliche Informationen..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignItem(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleAssign} disabled={assigning || !assignTenantId}>
              {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dokument-Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quelle</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getSourceIcon(viewItem.source)}
                    <span className="capitalize">{viewItem.source}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getStatusIcon(viewItem.status)}
                    <Badge variant={getStatusVariant(viewItem.status)}>
                      {viewItem.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dateiname</p>
                  <p className="mt-1">{viewItem.file_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Größe</p>
                  <p className="mt-1">{formatFileSize(viewItem.file_size_bytes)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">MIME-Typ</p>
                  <p className="mt-1 text-sm">{viewItem.mime_type || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eingegangen</p>
                  <p className="mt-1">
                    {format(new Date(viewItem.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
              </div>
              {viewItem.assigned_tenant_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zugewiesen an</p>
                  <p className="mt-1">{getOrgName(viewItem.assigned_tenant_id)}</p>
                  {viewItem.assigned_at && (
                    <p className="text-xs text-muted-foreground">
                      am {format(new Date(viewItem.assigned_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                  )}
                </div>
              )}
              {viewItem.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notizen</p>
                  <p className="mt-1 text-sm">{viewItem.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{viewItem.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}