/**
 * Pet Desk — Kunden Tab: Z1-Kundendatenbank mit verknüpften Tieren
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, PawPrint, ChevronDown, ChevronRight, Globe, UserCheck, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: 'Neu', color: 'bg-blue-100 text-blue-700', icon: Clock },
  qualified: { label: 'Qualifiziert', color: 'bg-amber-100 text-amber-700', icon: UserCheck },
  assigned: { label: 'Zugewiesen', color: 'bg-green-100 text-green-700', icon: UserCheck },
};

const speciesLabels: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', small_animal: 'Kleintier', reptile: 'Reptil', other: 'Sonstiges',
};

export default function PetDeskKunden() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['pet-z1-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_z1_customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: petsMap = {} } = useQuery({
    queryKey: ['pet-z1-pets-map', customers.map(c => c.id)],
    enabled: customers.length > 0,
    queryFn: async () => {
      const ids = customers.map(c => c.id);
      const { data } = await (supabase.from('pet_z1_pets' as any) as any)
        .select('*')
        .in('z1_customer_id', ids);
      const map: Record<string, any[]> = {};
      (data || []).forEach((p: any) => {
        if (!map[p.z1_customer_id]) map[p.z1_customer_id] = [];
        map[p.z1_customer_id].push(p);
      });
      return map;
    },
  });

  return (
    <div className="space-y-6">
      {/* Zone Flow Indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-teal-100 text-teal-700 font-medium">Z3 Website</span>
        <span className="text-muted-foreground">→</span>
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">Z1 Pet Desk</span>
        <span className="text-muted-foreground">→</span>
        <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">Z2 Provider</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Kundendatenbank
            {customers.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{customers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : customers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Globe className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">Noch keine Kunden über die Website registriert.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Kunden registrieren sich auf lennoxandfriends.de und erscheinen hier.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map(customer => {
                const status = statusConfig[customer.status] || statusConfig.new;
                const pets = petsMap[customer.id] || [];
                const isExpanded = expandedId === customer.id;

                return (
                  <div key={customer.id} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {customer.first_name?.[0]}{customer.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{customer.first_name} {customer.last_name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email} {customer.phone ? `· ${customer.phone}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pets.length > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <PawPrint className="h-3 w-3" /> {pets.length}
                          </Badge>
                        )}
                        <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t">
                        {/* Details */}
                        <div className="grid grid-cols-3 gap-3 pt-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Adresse</span>
                            <p className="font-medium">{customer.address || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quelle</span>
                            <p className="font-medium">{customer.source}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Erstellt</span>
                            <p className="font-medium">{new Date(customer.created_at).toLocaleDateString('de-DE')}</p>
                          </div>
                        </div>

                        {customer.notes && (
                          <div className="text-xs bg-muted/30 rounded p-2">
                            <span className="text-muted-foreground">Notizen: </span>{customer.notes}
                          </div>
                        )}

                        {/* Pets */}
                        {pets.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <PawPrint className="h-3 w-3" /> Tiere ({pets.length})
                            </p>
                            {pets.map((pet: any) => (
                              <div key={pet.id} className="flex items-center gap-2 bg-muted/20 rounded px-2 py-1.5 text-xs">
                                <PawPrint className="h-3.5 w-3.5 text-primary/50" />
                                <span className="font-medium">{pet.name}</span>
                                <Badge variant="outline" className="text-[10px]">{speciesLabels[pet.species] || pet.species}</Badge>
                                {pet.breed && <span className="text-muted-foreground">{pet.breed}</span>}
                                {pet.chip_number && <span className="text-muted-foreground">Chip: {pet.chip_number}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
