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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, ShieldCheck } from 'lucide-react';

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

const statusVariants: Record<InsuranceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  expired: 'destructive',
  cancelled: 'outline',
  draft: 'secondary',
};

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
          id,
          insurer_name,
          policy_number,
          coverage_type,
          sf_liability,
          annual_premium_cents,
          status,
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

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!insurances || insurances.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Noch keine Versicherungen</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Erfassen Sie Ihre Kfz-Versicherungen, um den Überblick zu behalten und
            Vergleichsangebote einzuholen.
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Versicherer, Nummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Neue Police erfassen
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Versicherungen ({filteredInsurances?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fahrzeug</TableHead>
                <TableHead>Versicherer</TableHead>
                <TableHead>Nummer</TableHead>
                <TableHead>Deckung</TableHead>
                <TableHead>SF-KH</TableHead>
                <TableHead className="text-right">Jahresbeitrag</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsurances?.map((insurance) => (
                <TableRow
                  key={insurance.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/portal/cars/versicherungen/${insurance.id}`)}
                >
                  <TableCell className="font-medium">
                    {insurance.vehicle ? (
                      <>
                        {insurance.vehicle.license_plate}
                        {insurance.vehicle.make && (
                          <span className="text-muted-foreground text-sm ml-1">
                            ({insurance.vehicle.make})
                          </span>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{insurance.insurer_name}</TableCell>
                  <TableCell className="font-mono text-sm">{insurance.policy_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{coverageLabels[insurance.coverage_type]}</Badge>
                  </TableCell>
                  <TableCell>{insurance.sf_liability}</TableCell>
                  <TableCell className="text-right">{formatCurrency(insurance.annual_premium_cents)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[insurance.status]}>
                      {statusLabels[insurance.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
