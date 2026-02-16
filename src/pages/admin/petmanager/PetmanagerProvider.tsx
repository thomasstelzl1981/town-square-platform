/**
 * Zone 1 — Pet Governance: Provider-Verwaltung
 * Provider-Tabelle mit Verifizierungs-Workflow (pending → active → suspended)
 */
import { useState, useEffect } from 'react';
import { Users2, ShieldCheck, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Provider {
  id: string;
  company_name: string;
  provider_type: string;
  status: string;
  verified_at: string | null;
  rating_avg: number;
  bio: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ausstehend', variant: 'outline' },
  active: { label: 'Aktiv', variant: 'default' },
  suspended: { label: 'Gesperrt', variant: 'destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  individual: 'Einzelunternehmer', company: 'Unternehmen', franchise: 'Franchise-Partner',
};

export default function PetmanagerProvider() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pet_providers')
      .select('*')
      .order('created_at', { ascending: false });
    setProviders((data as Provider[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProviders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'active') updates.verified_at = new Date().toISOString();
    const { error } = await supabase.from('pet_providers').update(updates).eq('id', id);
    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success(`Provider ${status === 'active' ? 'verifiziert' : status === 'suspended' ? 'gesperrt' : 'aktualisiert'}`);
      fetchProviders();
    }
  };

  const pending = providers.filter(p => p.status === 'pending').length;
  const active = providers.filter(p => p.status === 'active').length;
  const suspended = providers.filter(p => p.status === 'suspended').length;

  return (
    <OperativeDeskShell
      title="Provider-Verwaltung"
      subtitle="Verzeichnis · Verifizierung · Onboarding"
      moduleCode="MOD-05"
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-primary">{active}</p>
              <p className="text-xs text-muted-foreground">Aktive Provider</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{pending}</p>
              <p className="text-xs text-muted-foreground">Ausstehende Verifizierung</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-destructive">{suspended}</p>
              <p className="text-xs text-muted-foreground">Gesperrt</p>
            </CardContent>
          </Card>
        </div>

        {/* Provider Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unternehmen</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bewertung</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden…</TableCell></TableRow>
                ) : providers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Keine Provider registriert</TableCell></TableRow>
                ) : providers.map(p => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{p.company_name}</p>
                        {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                      </TableCell>
                      <TableCell className="text-sm">{TYPE_LABELS[p.provider_type] || p.provider_type}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell>{p.rating_avg > 0 ? `${p.rating_avg.toFixed(1)} ★` : '—'}</TableCell>
                      <TableCell className="text-sm">{format(new Date(p.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {p.status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'active')}>
                              <Check className="h-3 w-3 mr-1" />Verifizieren
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => updateStatus(p.id, 'suspended')}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {p.status === 'active' && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateStatus(p.id, 'suspended')}>
                            Sperren
                          </Button>
                        )}
                        {p.status === 'suspended' && (
                          <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'active')}>
                            Reaktivieren
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </OperativeDeskShell>
  );
}
