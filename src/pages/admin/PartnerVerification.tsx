import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ShieldCheck, 
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PartnerVerification {
  id: string;
  partner_org_id: string;
  partner_name?: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  notes: string | null;
}

export default function PartnerVerification() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<PartnerVerification[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  });

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [verificationsRes, orgsRes] = await Promise.all([
        supabase.from('partner_verifications').select('*'),
        supabase.from('organizations').select('id, name'),
      ]);

      const verificationsData = verificationsRes.data || [];
      const orgs = orgsRes.data || [];

      const enriched = verificationsData.map(v => ({
        ...v,
        partner_name: orgs.find(o => o.id === v.partner_org_id)?.name || 'Unknown',
      }));

      setVerifications(enriched);

      setStats({
        pending: verificationsData.filter(v => v.status === 'pending' || v.status === 'documents_submitted' || v.status === 'under_review').length,
        approved: verificationsData.filter(v => v.status === 'approved').length,
        rejected: verificationsData.filter(v => v.status === 'rejected').length,
        expired: verificationsData.filter(v => v.status === 'expired').length,
      });
    } catch (error) {
      console.error('Error fetching verification data:', error);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      case 'documents_submitted':
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />Dokumente eingereicht</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-500"><Eye className="h-3 w-3 mr-1" />In Prüfung</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Abgelehnt</Badge>;
      case 'expired':
        return <Badge variant="outline">Abgelaufen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Partner-Verifizierung</h1>
        <p className="text-muted-foreground">
          Verifizierungsstatus aller Vertriebspartner verwalten
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Genehmigt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.approved}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abgelehnt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{stats.rejected}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abgelaufen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.expired}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verifizierungen</CardTitle>
          <CardDescription>{verifications.length} Partner im System</CardDescription>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Verifizierungen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Eingereicht</TableHead>
                  <TableHead>Geprüft</TableHead>
                  <TableHead>Ablauf</TableHead>
                  <TableHead>Notizen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.partner_name}</TableCell>
                    <TableCell>{getStatusBadge(v.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.submitted_at ? format(new Date(v.submitted_at), 'dd.MM.yyyy', { locale: de }) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.reviewed_at ? format(new Date(v.reviewed_at), 'dd.MM.yyyy', { locale: de }) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.expires_at ? format(new Date(v.expires_at), 'dd.MM.yyyy', { locale: de }) : '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{v.notes || '—'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(v.status === 'pending' || v.status === 'documents_submitted' || v.status === 'under_review') && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
