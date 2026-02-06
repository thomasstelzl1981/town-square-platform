/**
 * NetworkTab — MOD-09 Vertriebspartner Netzwerk & Provisionen
 * Zeigt abgeschlossene Deals und Provisionsansprüche aus der DB
 */
import { Check, Clock, UserPlus, Users, Info, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HowItWorks } from '@/components/vertriebspartner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Commission {
  id: string;
  property: string;
  customer: string;
  closedAt: Date;
  amount: number;
  status: 'paid' | 'pending';
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

const NetworkTab = () => {
  // Fetch won deals as commissions (partner_deals with stage = 'won')
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['partner-commissions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      
      // Get user's active tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .eq('id', user.id)
        .single();
        
      if (!profile?.active_tenant_id) return [];
      
      // Fetch won deals as commissions
      const { data, error } = await supabase
        .from('partner_deals')
        .select(`
          id, stage, deal_value, commission_rate, actual_close_date, notes, created_at,
          contacts (first_name, last_name, company),
          properties (address, city)
        `)
        .eq('tenant_id', profile.active_tenant_id)
        .eq('stage', 'won')
        .order('actual_close_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(d => {
        const contact = d.contacts as any;
        const property = d.properties as any;
        const commissionAmount = (d.deal_value || 0) * ((d.commission_rate || 0) / 100);
        
        return {
          id: d.id,
          property: property ? `${property.address}, ${property.city}` : (d.notes || 'Objekt'),
          customer: contact 
            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.company || 'Kunde'
            : 'Kunde',
          closedAt: d.actual_close_date ? new Date(d.actual_close_date) : new Date(d.created_at),
          amount: commissionAmount,
          // Simulation: 50% als bezahlt markieren (basierend auf Datum > 30 Tage)
          status: d.actual_close_date && 
            new Date(d.actual_close_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            ? 'paid' as const
            : 'pending' as const
        };
      });
    }
  });

  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <HowItWorks variant="network" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abschlüsse</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {commissions.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt (2026)</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalCommissions)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Offen</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{formatCurrency(pendingCommissions)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ausgezahlt</CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(paidCommissions)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Provisionen</CardTitle>
          <CardDescription>
            Provisionsansprüche aus gewonnenen Deals
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objekt</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Abschluss</TableHead>
                  <TableHead className="text-right">Provision</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Noch keine abgeschlossenen Provisionen. Gewonnene Deals erscheinen hier automatisch.
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {commission.property}
                      </TableCell>
                      <TableCell>{commission.customer}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(commission.closedAt, 'dd.MM.yyyy', { locale: de })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(commission.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {commission.status === 'paid' ? (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="mr-1 h-3 w-3" />
                            Bezahlt
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Offen
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Team Section (Phase 2 Placeholder) */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mein Team
              </CardTitle>
              <CardDescription>Eigene Vertriebspartner einladen</CardDescription>
            </div>
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Einladen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Phase 2</AlertTitle>
            <AlertDescription>
              Diese Funktion wird in einer späteren Version verfügbar sein. 
              Sie können dann eigene Vertriebspartner einladen, die unter Ihrem Account arbeiten.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Customer Portal Section (Phase 2 Placeholder) */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Kunden einladen
              </CardTitle>
              <CardDescription>Kundenportale erstellen</CardDescription>
            </div>
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Einladen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Phase 2</AlertTitle>
            <AlertDescription>
              Diese Funktion wird in einer späteren Version verfügbar sein. 
              Sie können dann Ihren Kunden ein eigenes Portal einrichten.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkTab;
