/**
 * CarsVersicherungen — Widget-based: Existing insurance left, Hector offer right
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus, Search, ShieldCheck, ShieldAlert, ArrowRight, 
  ExternalLink, Sparkles, Car, Euro, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CoverageType = 'liability_only' | 'liability_tk' | 'liability_vk';
type InsuranceStatus = 'active' | 'expired' | 'cancelled' | 'draft';

interface Insurance {
  id: string;
  insurer_name: string;
  policy_number: string;
  coverage_type: CoverageType;
  sf_liability: number;
  annual_premium_cents: number;
  status: InsuranceStatus;
  vehicle: {
    id: string;
    license_plate: string;
    make: string | null;
    model: string | null;
  } | null;
}

const coverageLabels: Record<CoverageType, string> = {
  liability_only: 'KH',
  liability_tk: 'KH + TK',
  liability_vk: 'KH + VK',
};

const statusLabels: Record<InsuranceStatus, string> = {
  active: 'Aktiv',
  expired: 'Abgelaufen',
  cancelled: 'Gekündigt',
  draft: 'Entwurf',
};

const statusColors: Record<InsuranceStatus, string> = {
  active: 'bg-status-success/10 text-status-success border-status-success/20',
  expired: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-muted-foreground/20',
  draft: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

// Demo Hector.global offers
const HECTOR_OFFERS = [
  {
    id: 'h1',
    insurer: 'HUK-COBURG',
    coverage: 'KH + VK',
    annual: 68900,
    monthly: 5742,
    sf: 12,
    savings_percent: 18,
    highlight: 'Bester Preis',
  },
  {
    id: 'h2',
    insurer: 'Allianz',
    coverage: 'KH + VK',
    annual: 72400,
    monthly: 6033,
    sf: 12,
    savings_percent: 14,
    highlight: 'Premium-Schutz',
  },
  {
    id: 'h3',
    insurer: 'DEVK',
    coverage: 'KH + TK',
    annual: 54200,
    monthly: 4517,
    sf: 12,
    savings_percent: 22,
    highlight: 'Sparsieger',
  },
];

export function CarsVersicherungen() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const [search, setSearch] = useState('');

  const { data: insurances, isLoading } = useQuery({
    queryKey: ['cars_insurances', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('cars_insurances')
        .select(`
          id, insurer_name, policy_number, coverage_type,
          sf_liability, annual_premium_cents, status,
          vehicle:cars_vehicles(id, license_plate, make, model)
        `)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Insurance[];
    },
    enabled: !!activeTenantId,
  });

  const filteredInsurances = insurances?.filter((i) => {
    const searchLower = search.toLowerCase();
    return (
      i.insurer_name.toLowerCase().includes(searchLower) ||
      i.policy_number.toLowerCase().includes(searchLower) ||
      i.vehicle?.license_plate.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (cents: number) =>
    (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!insurances || insurances.length === 0) {
    return (
      <Card className="glass-card border-dashed border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Noch keine Versicherungen</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Erfassen Sie Ihre Kfz-Versicherungen und erhalten Sie sofort Vergleichsangebote über Hector.global.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Police erfassen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Versicherer, Kennzeichen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Neue Police
        </Button>
      </div>

      {/* Insurance Widget Cards — 2-column: existing | offer */}
      <div className="space-y-4">
        {filteredInsurances?.map((insurance) => (
          <div key={insurance.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT: Existing Insurance */}
            <Card className="glass-card border-primary/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Aktuelle Police
                  </CardTitle>
                  <Badge variant="outline" className={cn("text-[9px]", statusColors[insurance.status])}>
                    {statusLabels[insurance.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Vehicle info */}
                {insurance.vehicle && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs font-medium">{insurance.vehicle.license_plate}</span>
                    {insurance.vehicle.make && (
                      <span className="text-xs text-muted-foreground">
                        {insurance.vehicle.make} {insurance.vehicle.model}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Versicherer</p>
                    <p className="text-sm font-medium">{insurance.insurer_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Policennr.</p>
                    <p className="text-sm font-mono">{insurance.policy_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deckung</p>
                    <Badge variant="outline" className="text-[9px]">{coverageLabels[insurance.coverage_type]}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">SF-Klasse</p>
                    <p className="text-sm font-medium">SF {insurance.sf_liability}</p>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Jahresbeitrag</p>
                      <p className="text-lg font-bold">{formatCurrency(insurance.annual_premium_cents)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Monatlich</p>
                      <p className="text-sm font-medium">{formatCurrency(Math.round(insurance.annual_premium_cents / 12))}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: Hector.global Offer */}
            <Card className="glass-card border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Hector.global Vergleich
                  </CardTitle>
                  <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                    3 Angebote
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {HECTOR_OFFERS.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{offer.insurer}</span>
                        {offer.highlight && (
                          <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 text-primary border-primary/20">
                            {offer.highlight}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{offer.coverage} · SF {offer.sf}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-bold">{formatCurrency(offer.annual)}<span className="text-[9px] font-normal text-muted-foreground">/Jahr</span></p>
                      <p className="text-[10px] text-status-success font-medium">−{offer.savings_percent}% Ersparnis</p>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full gap-2 mt-2 text-xs" size="sm">
                  <ExternalLink className="h-3 w-3" />
                  Alle Angebote bei Hector.global
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
