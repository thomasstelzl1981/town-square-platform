import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, ClipboardList, User, MapPin, Link2, Users, Calendar, Percent, Pencil, Briefcase, Euro } from 'lucide-react';
import { CreateContextDialog } from '@/components/shared';
import { PropertyContextAssigner } from '@/components/shared/PropertyContextAssigner';

interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
  tax_regime: string | null;
  is_default: boolean | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  hrb_number: string | null;
  ust_id: string | null;
  legal_form: string | null;
  tax_rate_percent: number | null;
  managing_director: string | null;
}

interface ContextMember {
  id: string;
  context_id: string;
  first_name: string;
  last_name: string;
  ownership_share: number | null;
  birth_name: string | null;
  birth_date: string | null;
  // NEU: Steuerdaten
  tax_class: string | null;
  profession: string | null;
  gross_income_yearly: number | null;
  church_tax: boolean | null;
}

export function KontexteTab() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContext, setEditingContext] = useState<LandlordContext | null>(null);
  const [assignerContext, setAssignerContext] = useState<{ id: string; name: string } | null>(null);

  // Fetch landlord contexts
  const { data: contexts = [], isLoading } = useQuery({
    queryKey: ['landlord-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('*')
        .eq('tenant_id', activeTenantId!)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as LandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  // Fetch context members for owner display - mit erweiterten Feldern
  const { data: membersByContext = new Map<string, ContextMember[]>() } = useQuery({
    queryKey: ['context-members', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('context_members')
        .select('id, context_id, first_name, last_name, ownership_share, birth_name, birth_date, tax_class, profession, gross_income_yearly, church_tax')
        .eq('tenant_id', activeTenantId!);
      
      if (error) throw error;
      
      // Group by context_id
      const byContext = new Map<string, ContextMember[]>();
      data?.forEach(m => {
        const list = byContext.get(m.context_id) || [];
        list.push(m as ContextMember);
        byContext.set(m.context_id, list);
      });
      return byContext;
    },
    enabled: !!activeTenantId,
  });

  // Fetch property counts per context
  const { data: contextPropertyCounts = {} } = useQuery({
    queryKey: ['context-property-counts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('context_property_assignment')
        .select('context_id, property_id')
        .eq('tenant_id', activeTenantId!);
      
      if (error) throw error;
      
      // Count properties per context
      const counts: Record<string, number> = {};
      data?.forEach(a => {
        counts[a.context_id] = (counts[a.context_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!activeTenantId,
  });

  const formatAddress = (ctx: LandlordContext) => {
    const parts = [ctx.street, ctx.house_number].filter(Boolean).join(' ');
    const cityParts = [ctx.postal_code, ctx.city].filter(Boolean).join(' ');
    return [parts, cityParts].filter(Boolean).join(', ') || null;
  };

  const formatBirthDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vermietereinheiten</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Vermietereinheit anlegen
        </Button>
      </div>

      {/* Context Cards Grid */}
      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            Lade Vermietereinheiten...
          </CardContent>
        </Card>
      ) : contexts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Keine Vermietereinheiten angelegt</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Erstellen Sie Vermietereinheiten, um Ihre Immobilien nach steuerlichen 
              oder organisatorischen Kriterien zu gruppieren (z.B. Ehepaar, GmbH).
            </p>
            <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Vermietereinheit anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contexts.map((ctx) => {
            const members = membersByContext.get(ctx.id) || [];
            const isPrivate = ctx.context_type === 'PRIVATE';
            
            return (
              <Card key={ctx.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {isPrivate ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{ctx.name}</CardTitle>
                      {ctx.legal_form && (
                        <CardDescription>{ctx.legal_form}</CardDescription>
                      )}
                    </div>
                    <Badge variant={isPrivate ? 'secondary' : 'default'}>
                      {isPrivate ? 'Privat' : 'Geschäftlich'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tax Rate */}
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{ctx.tax_rate_percent ?? 30}% Steuersatz</span>
                  </div>

                  {/* PRIVATE: Show owners with tax data */}
                  {isPrivate && members.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Eigentümer:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {members.map(member => (
                          <div key={member.id} className="text-sm space-y-0.5 p-2 bg-muted/30 rounded">
                            <p className="font-medium">
                              {member.first_name} {member.last_name}
                            </p>
                            {member.birth_name && (
                              <p className="text-xs text-muted-foreground">
                                geb. {member.birth_name}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              {member.birth_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  *{formatBirthDate(member.birth_date)}
                                </span>
                              )}
                              {member.tax_class && (
                                <Badge variant="outline" className="text-xs h-5">
                                  Stkl. {member.tax_class}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                              {member.profession && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {member.profession}
                                </span>
                              )}
                              {member.gross_income_yearly && (
                                <span className="flex items-center gap-1">
                                  <Euro className="h-3 w-3" />
                                  {formatCurrency(member.gross_income_yearly)}
                                </span>
                              )}
                            </div>
                            {member.ownership_share && (
                              <p className="text-xs font-medium">
                                {member.ownership_share}% Anteil
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BUSINESS: Show company details */}
                  {!isPrivate && (
                    <div className="pt-2 border-t space-y-1 text-sm">
                      {ctx.managing_director && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>GF: {ctx.managing_director}</span>
                        </div>
                      )}
                      {ctx.hrb_number && (
                        <p className="text-xs text-muted-foreground">HRB: {ctx.hrb_number}</p>
                      )}
                      {ctx.ust_id && (
                        <p className="text-xs text-muted-foreground">USt-ID: {ctx.ust_id}</p>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  {formatAddress(ctx) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {formatAddress(ctx)}
                    </div>
                  )}

                  {/* Property count & Actions */}
                  <div className="pt-2 flex items-center justify-between">
                    <Badge variant="secondary">
                      {contextPropertyCounts[ctx.id] || 0} Objekt(e)
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingContext(ctx)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAssignerContext({ id: ctx.id, name: ctx.name })}
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        Objekte zuordnen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info-Box */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Vermietereinheiten ermöglichen die Trennung von Objekten nach 
            unterschiedlichen steuerlichen Regimes oder Eigentümerstrukturen (z.B. Ehepaar, Gesellschaft). 
            Der hinterlegte Steuersatz wird für Renditeberechnungen verwendet.
          </p>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <CreateContextDialog 
        open={showCreateDialog || !!editingContext} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingContext(null);
          }
        }}
        editContext={editingContext}
      />

      {/* Property Assigner Dialog */}
      {assignerContext && (
        <PropertyContextAssigner
          open={!!assignerContext}
          onOpenChange={(open) => !open && setAssignerContext(null)}
          contextId={assignerContext.id}
          contextName={assignerContext.name}
        />
      )}
    </div>
  );
}
