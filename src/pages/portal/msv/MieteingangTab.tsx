import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMSVPremium } from '@/hooks/useMSVPremium';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PaywallBanner } from '@/components/msv/PaywallBanner';
import { TemplateWizard } from '@/components/msv/TemplateWizard';
import { PaymentBookingDialog } from '@/components/msv/PaymentBookingDialog';
import { 
  Euro, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Plus, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  Send,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PropertyWithPayments {
  id: string;
  code: string | null;
  address: string;
  sollmiete: number;
  mieteingang: number;
  status: 'paid' | 'partial' | 'open' | 'overdue';
  leaseId: string | null;
  unitId: string | null;
  mieterName: string | null;
  payments: PaymentEntry[];
}

interface PaymentEntry {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  matched_source: string | null;
}

const MieteingangTab = () => {
  const navigate = useNavigate();
  const { isPremium, isLoading: premiumLoading } = useMSVPremium();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [templateWizardOpen, setTemplateWizardOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithPayments | null>(null);

  // Fetch property-centric payment data
  const { data: propertyPayments, isLoading } = useQuery({
    queryKey: ['msv-mieteingang-properties'],
    queryFn: async () => {
      // Fetch properties with units and leases
      const { data: propertiesData, error: propError } = await supabase
        .from('properties')
        .select(`
          id,
          code,
          address,
          units (
            id,
            unit_number,
            leases (
              id,
              monthly_rent,
              status,
              tenant_contact_id
            )
          )
        `)
        .order('address');

      if (propError) throw propError;

      // Fetch all recent payments for current month
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

      const { data: paymentsData } = await supabase
        .from('rent_payments')
        .select('*')
        .gte('due_date', monthStart)
        .lte('due_date', monthEnd);

      // Fetch contacts
      const contactIds: string[] = [];
      propertiesData?.forEach(p => {
        (p.units as any[])?.forEach(u => {
          (u.leases as any[])?.forEach(l => {
            if (l.tenant_contact_id) contactIds.push(l.tenant_contact_id);
          });
        });
      });

      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', contactIds.length > 0 ? contactIds : ['00000000-0000-0000-0000-000000000000']);

      const contactMap = new Map(contactsData?.map(c => [c.id, `${c.last_name}, ${c.first_name}`]) || []);

      // Build property-level aggregation
      const paymentsByLease = new Map<string, PaymentEntry[]>();
      paymentsData?.forEach(p => {
        const existing = paymentsByLease.get(p.lease_id) || [];
        existing.push(p);
        paymentsByLease.set(p.lease_id, existing);
      });

      return propertiesData?.map(prop => {
        let sollmiete = 0;
        let mieteingang = 0;
        let leaseId: string | null = null;
        let unitId: string | null = null;
        let mieterName: string | null = null;
        const payments: PaymentEntry[] = [];

        (prop.units as any[])?.forEach(unit => {
          (unit.leases as any[])?.filter(l => l.status === 'active').forEach(lease => {
            sollmiete += lease.monthly_rent || 0;
            leaseId = lease.id;
            unitId = unit.id;
            mieterName = contactMap.get(lease.tenant_contact_id) || null;

            const leasePayments = paymentsByLease.get(lease.id) || [];
            leasePayments.forEach(p => {
              mieteingang += p.status === 'paid' ? (p.amount || 0) : 0;
              payments.push(p);
            });
          });
        });

        // Determine status
        let status: 'paid' | 'partial' | 'open' | 'overdue' = 'open';
        if (mieteingang >= sollmiete && sollmiete > 0) {
          status = 'paid';
        } else if (mieteingang > 0) {
          status = 'partial';
        } else if (sollmiete > 0) {
          // Check if any payment is overdue
          const hasOverdue = payments.some(p => p.status === 'overdue');
          status = hasOverdue ? 'overdue' : 'open';
        }

        return {
          id: prop.id,
          code: prop.code,
          address: prop.address,
          sollmiete,
          mieteingang,
          status,
          leaseId,
          unitId,
          mieterName,
          payments
        };
      }).filter(p => p.sollmiete > 0) || [];
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

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-status-success"><CheckCircle className="h-3 w-3 mr-1" />Bezahlt</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Überfällig</Badge>;
      case 'partial':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Teilzahlung</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Offen</Badge>;
    }
  };

  const handlePaymentBooking = (property: PropertyWithPayments) => {
    setSelectedProperty(property);
    setPaymentDialogOpen(true);
  };

  const handleMahnung = (property: PropertyWithPayments) => {
    setSelectedProperty(property);
    setTemplateWizardOpen(true);
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
          features={['Automatische Mahnung am 10.', 'Mietbericht zum 15.', 'Kontoanbindung via FinAPI (Coming Soon)']}
        />
      )}

      {/* Object-centric Table with Accordion */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Objekt-Nr.</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Mieter</TableHead>
              <TableHead className="text-right">Sollmiete</TableHead>
              <TableHead className="text-right">Mieteingang</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : propertyPayments?.length === 0 ? (
              <>
                {/* Leerzeile mit Platzhaltern */}
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate('/portal/msv/objekte')}
                >
                  <TableCell className="text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">–</TableCell>
                  <TableCell className="text-muted-foreground">–</TableCell>
                  <TableCell className="text-muted-foreground">–</TableCell>
                  <TableCell className="text-right text-muted-foreground">–</TableCell>
                  <TableCell className="text-right text-muted-foreground">–</TableCell>
                  <TableCell>
                    <Badge variant="outline">–</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      Keine aktiven Mietverhältnisse — Mietvertrag in Objekte anlegen
                    </p>
                    <Button onClick={() => navigate('/portal/msv/objekte')}>
                      Zu Objekte wechseln
                    </Button>
                  </TableCell>
                </TableRow>
              </>
            ) : (
              propertyPayments?.map((row) => (
                <Collapsible key={row.id} asChild>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRow(row.id)}
                      >
                        <TableCell>
                          {expandedRows.has(row.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.code || '—'}
                        </TableCell>
                        <TableCell className="font-medium">{row.address}</TableCell>
                        <TableCell>{row.mieterName || '—'}</TableCell>
                        <TableCell className="text-right">
                          {row.sollmiete.toLocaleString('de-DE')} €
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {row.mieteingang.toLocaleString('de-DE')} €
                        </TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-4">
                            {/* Payment History */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Letzte Zahlungseingänge</h4>
                              {row.payments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Keine Zahlungen erfasst</p>
                              ) : (
                                <div className="rounded border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Fällig am</TableHead>
                                        <TableHead>Gezahlt am</TableHead>
                                        <TableHead className="text-right">Betrag</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Quelle</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {row.payments.slice(0, 10).map((payment) => (
                                        <TableRow key={payment.id}>
                                          <TableCell>
                                            {payment.due_date 
                                              ? format(new Date(payment.due_date), 'dd.MM.yyyy', { locale: de })
                                              : '—'}
                                          </TableCell>
                                          <TableCell>
                                            {payment.paid_date 
                                              ? format(new Date(payment.paid_date), 'dd.MM.yyyy', { locale: de })
                                              : '—'}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {payment.amount?.toLocaleString('de-DE')} €
                                          </TableCell>
                                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                          <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                              {payment.matched_source === 'finapi' ? 'Auto' : 'Manuell'}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2 border-t">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={!isPremium}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentBooking(row);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Zahlung buchen
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMahnung(row);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Mahnung erstellen
                              </Button>
                              <Button size="sm" variant="outline" disabled={!isPremium}>
                                <Send className="h-4 w-4 mr-2" />
                                Mietbericht senden
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TemplateWizard
        open={templateWizardOpen}
        onOpenChange={setTemplateWizardOpen}
        templateCode="MAHNUNG"
        unit={selectedProperty ? { 
          id: selectedProperty.unitId,
          property_id: selectedProperty.id,
          properties: { address: selectedProperty.address, code: selectedProperty.code }
        } : null}
      />

      {selectedProperty?.leaseId && (
        <PaymentBookingDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          leaseId={selectedProperty.leaseId}
          sollmiete={selectedProperty.sollmiete}
          mieterName={selectedProperty.mieterName}
        />
      )}
    </div>
  );
};

export default MieteingangTab;
