/**
 * Project Sales Block (Block H)
 * Partner Performance & Commission Tracking
 * MOD-13 PROJEKTE
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, Euro, CheckCircle, Clock } from 'lucide-react';
import type { DevProjectReservation } from '@/types/projekte';

interface PartnerPerformance {
  id: string;
  name: string;
  reservations: number;
  completed: number;
  pending: number;
  totalVolume: number;
  totalCommission: number;
  conversionRate: number;
}

interface ProjectSalesBlockProps {
  projectId: string;
  reservations: DevProjectReservation[];
  commissionRate: number;
}

export function ProjectSalesBlock({ projectId, reservations, commissionRate }: ProjectSalesBlockProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Aggregate by partner
  const partnerMap = new Map<string, PartnerPerformance>();
  const noPartnerKey = 'direct';

  reservations.forEach((res) => {
    const partnerId = res.partner_org?.id || noPartnerKey;
    const partnerName = res.partner_org?.name || 'Direktvertrieb';

    if (!partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, {
        id: partnerId,
        name: partnerName,
        reservations: 0,
        completed: 0,
        pending: 0,
        totalVolume: 0,
        totalCommission: 0,
        conversionRate: 0,
      });
    }

    const partner = partnerMap.get(partnerId)!;
    partner.reservations++;
    
    if (res.status === 'completed') {
      partner.completed++;
      partner.totalVolume += res.reserved_price || 0;
      partner.totalCommission += res.commission_amount || (res.reserved_price || 0) * (commissionRate / 100);
    } else if (!['cancelled', 'expired'].includes(res.status)) {
      partner.pending++;
    }
  });

  // Calculate conversion rates
  partnerMap.forEach((partner) => {
    partner.conversionRate = partner.reservations > 0 
      ? Math.round((partner.completed / partner.reservations) * 100)
      : 0;
  });

  const partners = Array.from(partnerMap.values()).sort((a, b) => b.totalVolume - a.totalVolume);

  // Overall stats
  const totalCompleted = reservations.filter(r => r.status === 'completed').length;
  const totalPending = reservations.filter(r => !['completed', 'cancelled', 'expired'].includes(r.status)).length;
  const totalVolume = partners.reduce((sum, p) => sum + p.totalVolume, 0);
  const totalCommission = partners.reduce((sum, p) => sum + p.totalCommission, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>H. Vertrieb & Partner-Performance</CardTitle>
        </div>
        <Badge variant="secondary">{partners.length} Partner</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              Abgeschlossen
            </div>
            <div className="text-2xl font-bold text-green-700">{totalCompleted}</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <Clock className="h-4 w-4" />
              In Bearbeitung
            </div>
            <div className="text-2xl font-bold text-yellow-700">{totalPending}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Euro className="h-4 w-4" />
              Verkaufsvolumen
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-primary">
              <TrendingUp className="h-4 w-4" />
              Provisionen
            </div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalCommission)}</div>
          </div>
        </div>

        {/* Partner Performance Table */}
        {partners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Vertriebsdaten vorhanden</p>
            <p className="text-sm">Partner-Performance erscheint nach der ersten Reservierung.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {partners.map((partner) => (
              <div 
                key={partner.id} 
                className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.reservations} Reservierung{partner.reservations !== 1 && 'en'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(partner.totalVolume)}</p>
                    <p className="text-sm text-muted-foreground">
                      Provision: {formatCurrency(partner.totalCommission)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Conversion</span>
                      <span>{partner.conversionRate}%</span>
                    </div>
                    <Progress value={partner.conversionRate} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {partner.completed} verkauft
                    </Badge>
                    {partner.pending > 0 && (
                      <Badge variant="outline">
                        {partner.pending} offen
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
