import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, ClipboardList, User, MapPin, Link2, Users, Calendar, Percent, Pencil, Briefcase, Euro, Calculator, Baby, Church } from 'lucide-react';
import { CreateContextDialog } from '@/components/shared';
import { PropertyContextAssigner } from '@/components/shared/PropertyContextAssigner';
import { calculateTax, TaxAssessmentType } from '@/lib/taxCalculator';

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
  // Private tax basis fields (from DB)
  taxable_income_yearly?: number | null;
  tax_assessment_type?: string | null;
  church_tax?: boolean | null;
  children_count?: number | null;
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
      {/* Header - nur Titel, kein Button */}
      <div>
        <h2 className="text-lg font-semibold">Vermietereinheiten</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verwalten Sie Ihre steuerlichen Kontexte für die Immobilienbewertung
        </p>
      </div>

      {/* Context Cards Grid - horizontal flexbox with wrap */}
      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            Lade Vermietereinheiten...
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-4">
          {contexts.map((ctx) => {
            const members = membersByContext.get(ctx.id) || [];
            const isPrivate = ctx.context_type === 'PRIVATE';
            
            return (
              <Card key={ctx.id} className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]">
                {/* Header: Name + Badge kompakt */}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      {isPrivate ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base truncate">{ctx.name}</CardTitle>
                        <Badge variant={isPrivate ? 'secondary' : 'default'} className="shrink-0">
                          {isPrivate ? 'Privat' : 'Geschäftlich'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {/* Show calculated tax info for PRIVATE */}
                        {isPrivate && ctx.taxable_income_yearly ? (
                          <>
                            <Calculator className="inline h-3 w-3 mr-1" />
                            {ctx.tax_rate_percent ?? 30}% Grenzsteuersatz · zVE {formatCurrency(ctx.taxable_income_yearly)} 
                            · {ctx.tax_assessment_type === 'SPLITTING' ? 'Splitting' : 'Einzel'}
                            {ctx.children_count && ctx.children_count > 0 && (
                              <span className="ml-1">· {ctx.children_count} Kind(er)</span>
                            )}
                          </>
                        ) : (
                          <>
                            {ctx.tax_rate_percent ?? 30}% Steuersatz
                            {ctx.legal_form && ` · ${ctx.legal_form}`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 pt-0">
                  {/* PRIVATE: Kompakte Eigentümer-Anzeige */}
                  {isPrivate && members.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        {members.map(member => (
                          <div key={member.id} className="text-sm p-2 bg-muted/40 rounded-md space-y-0.5">
                            <p className="font-medium truncate">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[
                                member.birth_name && `geb. ${member.birth_name}`,
                                member.tax_class && `Stkl. ${member.tax_class}`,
                              ].filter(Boolean).join(' · ') || '–'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[
                                member.profession,
                                member.gross_income_yearly && formatCurrency(member.gross_income_yearly),
                              ].filter(Boolean).join(' · ') || '–'}
                            </p>
                            {member.ownership_share && (
                              <p className="text-xs font-medium text-primary">
                                {member.ownership_share}%
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BUSINESS: Kompakte Firmendaten */}
                  {!isPrivate && (
                    <div className="border-t pt-3 space-y-1 text-sm">
                      {ctx.managing_director && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">GF: {ctx.managing_director}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {[
                          ctx.hrb_number && `HRB: ${ctx.hrb_number}`,
                          ctx.ust_id && `USt-ID: ${ctx.ust_id}`,
                        ].filter(Boolean).join(' · ') || '–'}
                      </p>
                    </div>
                  )}

                  {/* Adresse */}
                  {formatAddress(ctx) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatAddress(ctx)}</span>
                    </div>
                  )}

                  {/* Footer: Objektzahl + Buttons in eigener Zeile */}
                  <div className="border-t pt-3 space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {contextPropertyCounts[ctx.id] || 0} Objekt(e) zugeordnet
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingContext(ctx)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Bearbeiten
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => setAssignerContext({ id: ctx.id, name: ctx.name })}
                      >
                        <Link2 className="mr-1.5 h-3.5 w-3.5" />
                        Zuordnen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add New Context Card */}
          <Card 
            className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
            onClick={() => setShowCreateDialog(true)}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 h-full min-h-[200px]">
              <div className="p-3 rounded-full bg-muted mb-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">Neue Vermietereinheit</p>
              <p className="text-xs text-muted-foreground mt-1">anlegen</p>
            </CardContent>
          </Card>
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
