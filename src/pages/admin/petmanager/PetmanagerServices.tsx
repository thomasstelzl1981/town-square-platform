/**
 * Zone 1 — Pet Governance: Service-Moderation
 * Freigabe/Ablehnung neuer Services, Katalog-Übersicht
 */
import { useState, useEffect } from 'react';
import { ClipboardList, Check, X, Eye } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ServiceWithProvider {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  price_cents: number;
  price_type: string;
  species_allowed: string[];
  is_active: boolean;
  created_at: string;
  provider?: { company_name: string; status: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  grooming: 'Pflege', walking: 'Gassi', sitting: 'Betreuung', training: 'Training',
  veterinary: 'Tierarzt', boarding: 'Pension', daycare: 'Tagesbetreuung', other: 'Sonstiges',
};

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export default function PetmanagerServices() {
  const [services, setServices] = useState<ServiceWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pet_services')
      .select('*, pet_providers!inner(company_name, status)')
      .order('created_at', { ascending: false });

    setServices(
      (data || []).map((s: any) => ({ ...s, provider: s.pet_providers })) as ServiceWithProvider[]
    );
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('pet_services').update({ is_active: !isActive } as any).eq('id', id);
    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success(isActive ? 'Service deaktiviert' : 'Service freigegeben');
      fetchServices();
    }
  };

  const filtered = filter === 'all' ? services :
    filter === 'active' ? services.filter(s => s.is_active) :
    services.filter(s => !s.is_active);

  const activeCount = services.filter(s => s.is_active).length;
  const inactiveCount = services.filter(s => !s.is_active).length;

  return (
    <OperativeDeskShell
      title="Service-Moderation"
      subtitle="Katalog · Qualitätskontrolle · Freigaben"
      moduleCode="MOD-05"
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{services.length}</p><p className="text-xs text-muted-foreground">Services gesamt</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{activeCount}</p><p className="text-xs text-muted-foreground">Aktiv</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{inactiveCount}</p><p className="text-xs text-muted-foreground">Inaktiv / Zur Prüfung</p></CardContent></Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle ({services.length})</SelectItem>
              <SelectItem value="active">Aktiv ({activeCount})</SelectItem>
              <SelectItem value="inactive">Inaktiv ({inactiveCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Service Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Dauer</TableHead>
                  <TableHead>Preis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Keine Services gefunden</TableCell></TableRow>
                ) : filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.species_allowed?.join(', ')}</p>
                    </TableCell>
                    <TableCell className="text-sm">{s.provider?.company_name || '—'}</TableCell>
                    <TableCell><Badge variant="secondary">{CATEGORY_LABELS[s.category] || s.category}</Badge></TableCell>
                    <TableCell className="text-sm">{s.duration_minutes} Min.</TableCell>
                    <TableCell className="font-medium">{formatCents(s.price_cents)}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? 'default' : 'outline'}>
                        {s.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(s.id, s.is_active)}>
                        {s.is_active ? <><X className="h-3 w-3 mr-1" />Deaktivieren</> : <><Check className="h-3 w-3 mr-1" />Freigeben</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </OperativeDeskShell>
  );
}
