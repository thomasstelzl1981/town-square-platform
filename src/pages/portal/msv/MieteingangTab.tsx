import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
import { PaywallBanner } from '@/components/msv/PaywallBanner';
import { Euro, CheckCircle, AlertCircle, Clock, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const MieteingangTab = () => {
  const [isPremium] = useState(false); // TODO: Check from msv_enrollments

  const { data: payments, isLoading } = useQuery({
    queryKey: ['msv-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rent_payments')
        .select(`
          id,
          amount,
          due_date,
          paid_date,
          status,
          matched_source,
          lease_id
        `)
        .order('due_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch lease details
      const leaseIds = data?.map(p => p.lease_id).filter(Boolean) || [];
      const { data: leasesData } = await supabase
        .from('leases')
        .select('id, unit_id, tenant_contact_id, monthly_rent')
        .in('id', leaseIds);

      // Fetch units
      const unitIds = leasesData?.map(l => l.unit_id).filter(Boolean) || [];
      const { data: unitsData } = await supabase
        .from('units')
        .select('id, unit_number, property_id')
        .in('id', unitIds);

      // Fetch properties
      const propertyIds = unitsData?.map(u => u.property_id).filter(Boolean) || [];
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, address')
        .in('id', propertyIds);

      // Fetch contacts
      const contactIds = leasesData?.map(l => l.tenant_contact_id).filter(Boolean) || [];
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', contactIds);

      // Build maps
      const propertyMap = new Map(propertiesData?.map(p => [p.id, p]) || []);
      const unitMap = new Map(unitsData?.map(u => [u.id, { ...u, property: propertyMap.get(u.property_id) }]) || []);
      const contactMap = new Map(contactsData?.map(c => [c.id, c]) || []);
      const leaseMap = new Map(leasesData?.map(l => [l.id, {
        ...l,
        unit: unitMap.get(l.unit_id),
        contact: contactMap.get(l.tenant_contact_id)
      }]) || []);

      return data?.map(payment => ({
        ...payment,
        lease: leaseMap.get(payment.lease_id)
      })) || [];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['msv-payment-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rent_payments')
        .select('status, amount');
      
      const paid = data?.filter(p => p.status === 'paid') || [];
      const pending = data?.filter(p => p.status === 'pending') || [];
      const overdue = data?.filter(p => p.status === 'overdue') || [];

      return {
        paidCount: paid.length,
        paidAmount: paid.reduce((s, p) => s + (p.amount || 0), 0),
        pendingCount: pending.length,
        pendingAmount: pending.reduce((s, p) => s + (p.amount || 0), 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((s, p) => s + (p.amount || 0), 0)
      };
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-status-success"><CheckCircle className="h-3 w-3 mr-1" />Bezahlt</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Überfällig</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Offen</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-status-success" />
              <div>
                <p className="text-xs text-muted-foreground">Eingegangen</p>
                <p className="font-semibold">{stats?.paidAmount?.toLocaleString('de-DE')} €</p>
                <p className="text-xs text-muted-foreground">{stats?.paidCount} Zahlungen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-status-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Offen</p>
                <p className="font-semibold">{stats?.pendingAmount?.toLocaleString('de-DE')} €</p>
                <p className="text-xs text-muted-foreground">{stats?.pendingCount} Zahlungen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats?.overdueCount ? 'border-status-error/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-status-error" />
              <div>
                <p className="text-xs text-muted-foreground">Überfällig</p>
                <p className="font-semibold">{stats?.overdueAmount?.toLocaleString('de-DE')} €</p>
                <p className="text-xs text-muted-foreground">{stats?.overdueCount} Zahlungen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <PaywallBanner
          title="Automatisches Mahnwesen"
          description="Mit Premium werden überfällige Zahlungen automatisch erkannt und Mahnungen zum 10. des Monats versendet."
          features={['Automatische Mahnung', 'Mietbericht zum 15.', 'Kontoanbindung (Coming Soon)']}
        />
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Zahlungsübersicht</h3>
        <Button size="sm" disabled={!isPremium}>
          <Plus className="h-4 w-4 mr-2" />
          Zahlung buchen
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Objekt / Einheit</TableHead>
              <TableHead>Mieter</TableHead>
              <TableHead>Fällig am</TableHead>
              <TableHead>Betrag</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quelle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Keine Zahlungen vorhanden
                </TableCell>
              </TableRow>
            ) : (
              payments?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.lease?.unit?.property?.address || '—'}</p>
                      <p className="text-xs text-muted-foreground">{row.lease?.unit?.unit_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.lease?.contact 
                      ? `${row.lease.contact.first_name} ${row.lease.contact.last_name}` 
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {row.due_date ? format(new Date(row.due_date), 'dd.MM.yyyy', { locale: de }) : '—'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{row.amount?.toLocaleString('de-DE')} €</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(row.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {row.matched_source === 'finapi' ? 'Auto' : 'Manuell'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MieteingangTab;
