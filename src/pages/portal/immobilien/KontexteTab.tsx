import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight, Plus, ClipboardList, User, MapPin, Link2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
}

export function KontexteTab() {
  const navigate = useNavigate();
  const { activeOrganization, activeTenantId } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [assignerContext, setAssignerContext] = useState<{ id: string; name: string } | null>(null);

  // Fetch landlord contexts
  const { data: contexts = [], isLoading } = useQuery({
    queryKey: ['landlord-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('*')
        .eq('tenant_id', activeTenantId!)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as LandlordContext[];
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

  // Standard-Kontext aus der aktuellen Organisation (wenn keine landlord_contexts existieren)
  const defaultContext = {
    name: activeOrganization?.name || 'Meine Firma',
    type: activeOrganization?.org_type === 'client' ? 'BUSINESS' : 'PRIVATE',
    regime: 'FIBU',
  };

  const additionalContexts = contexts.filter(c => !c.is_default);
  const primaryContext = contexts.find(c => c.is_default);

  const formatAddress = (ctx: LandlordContext) => {
    const parts = [ctx.street, ctx.house_number].filter(Boolean).join(' ');
    const cityParts = [ctx.postal_code, ctx.city].filter(Boolean).join(' ');
    return [parts, cityParts].filter(Boolean).join(', ') || null;
  };

  return (
    <div className="space-y-6">
      {/* Standard-Kontext (aus Stammdaten oder primary landlord_context) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Standard-Kontext</CardTitle>
              <CardDescription>
                {primaryContext ? 'Ihr primärer Vermieter-Kontext' : 'Automatisch aus Ihren Firmendaten übernommen'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Name" value={primaryContext?.name || defaultContext.name} />
            <InfoItem 
              label="Typ" 
              value={
                <Badge variant={(primaryContext?.context_type || defaultContext.type) === 'BUSINESS' ? 'default' : 'secondary'}>
                  {(primaryContext?.context_type || defaultContext.type) === 'BUSINESS' ? 'Geschäftlich' : 'Privat'}
                </Badge>
              } 
            />
            <InfoItem 
              label="Regime" 
              value={
                <Badge variant="outline">{primaryContext?.tax_regime || defaultContext.regime}</Badge>
              } 
            />
            <InfoItem label="Objekte" value="– (alle nicht zugeordneten)" />
          </div>

          {primaryContext && formatAddress(primaryContext) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {formatAddress(primaryContext)}
            </div>
          )}

          {primaryContext?.hrb_number && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>HRB: {primaryContext.hrb_number}</span>
              {primaryContext.ust_id && <span>USt-ID: {primaryContext.ust_id}</span>}
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/portal/stammdaten/firma')}
          >
            Stammdaten bearbeiten
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Weitere Kontexte */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Weitere Kontexte</h2>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Kontext anlegen
          </Button>
        </div>

        {isLoading ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Lade Kontexte...
            </CardContent>
          </Card>
        ) : additionalContexts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Keine weiteren Kontexte angelegt</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Erstellen Sie zusätzliche Vermieter-Kontexte, um Objekte nach steuerlichen 
                oder organisatorischen Kriterien zu gruppieren.
              </p>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Kontext anlegen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {additionalContexts.map((ctx) => (
              <Card key={ctx.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {ctx.context_type === 'BUSINESS' ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{ctx.name}</CardTitle>
                      {ctx.legal_form && (
                        <CardDescription>{ctx.legal_form}</CardDescription>
                      )}
                    </div>
                    <Badge variant={ctx.context_type === 'BUSINESS' ? 'default' : 'secondary'}>
                      {ctx.context_type === 'BUSINESS' ? 'Geschäftlich' : 'Privat'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">{ctx.tax_regime || 'EÜR'}</Badge>
                    {ctx.hrb_number && <span className="text-muted-foreground text-xs">{ctx.hrb_number}</span>}
                    <Badge variant="secondary" className="ml-auto">
                      {contextPropertyCounts[ctx.id] || 0} Objekt(e)
                    </Badge>
                  </div>
                  {formatAddress(ctx) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {formatAddress(ctx)}
                    </div>
                  )}
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAssignerContext({ id: ctx.id, name: ctx.name })}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Objekte zuordnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info-Box */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Vermieter-Kontexte ermöglichen die Trennung von Objekten nach 
            unterschiedlichen steuerlichen Regimes (FIBU, EÜR, Vermögensverwaltung) oder 
            Eigentümerstrukturen. Alle Objekte ohne explizite Zuordnung gehören zum Standard-Kontext.
          </p>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateContextDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
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

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}
