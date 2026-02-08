/**
 * VerkaufsauftragTab - Zentrale Steuerung für Immobilienvermarktung
 * 
 * Ersetzt den alten FeaturesTab mit integriertem Agreement-Flow.
 * Governance gemäß Golden Path 2.0:
 * - Vermarktung aktivieren → Objekt erscheint in MOD-06
 * - Kaufy-Sichtbarkeit → Request an Zone 1
 * - Scout24 → Coming Soon
 */
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  AlertTriangle, 
  ShoppingCart, 
  Globe, 
  ExternalLink,
  Building2,
  FileCheck,
  CheckCircle2,
  Lock,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface PropertyFeature {
  id: string;
  feature_code: string;
  status: string;
  activated_at: string;
  config?: Record<string, unknown> | null;
}

interface VerkaufsauftragTabProps {
  propertyId: string;
  tenantId: string;
  unitId?: string;
  askingPrice?: number;
  propertyAddress?: string;
  propertyCity?: string;
  onUpdate?: () => void;
}

interface FeatureConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAgreement: boolean;
  comingSoon?: boolean;
  dependsOn?: string;
}

const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  verkaufsauftrag: {
    label: 'Vermarktung aktivieren',
    description: 'Erteilt den Auftrag zur Vermarktung dieser Immobilie über unser Kapitalanlage-Vertriebsnetzwerk.',
    icon: ShoppingCart,
    requiresAgreement: true,
  },
  kaufy_sichtbarkeit: {
    label: 'Kaufy-Marktplatz',
    description: 'Macht diese Immobilie zusätzlich auf dem öffentlichen Kaufy-Marktplatz sichtbar (kostenfrei).',
    icon: Globe,
    requiresAgreement: false,
    dependsOn: 'verkaufsauftrag',
  },
  immoscout24: {
    label: 'ImmobilienScout24',
    description: 'Veröffentlicht das Exposé automatisch auf ImmobilienScout24 (API-Integration).',
    icon: ExternalLink,
    requiresAgreement: true,
    comingSoon: true,
  },
};

type FeatureCode = keyof typeof FEATURE_CONFIG;

export function VerkaufsauftragTab({ 
  propertyId, 
  tenantId, 
  unitId,
  askingPrice = 0,
  propertyAddress = '',
  propertyCity = '',
  onUpdate 
}: VerkaufsauftragTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [features, setFeatures] = useState<PropertyFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Agreement expansion state
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [agreementState, setAgreementState] = useState({
    dataAccuracy: false,
    salesMandate: false,
    systemFee: false,
    commissionRate: [7],
  });
  const [isActivating, setIsActivating] = useState(false);

  // Fetch features
  async function fetchFeatures() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('property_features')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId);

      if (fetchError) throw fetchError;
      // Cast to ensure type compatibility
      setFeatures((data || []).map(f => ({
        ...f,
        config: f.config as Record<string, unknown> | null
      })));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden';
      setError(message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchFeatures();
  }, [propertyId, tenantId]);

  const isFeatureActive = (code: string) => {
    const feature = features.find(f => f.feature_code === code);
    return feature?.status === 'active';
  };

  const getFeature = (code: string) => {
    return features.find(f => f.feature_code === code);
  };

  const canActivateFeature = (code: string): boolean => {
    const config = FEATURE_CONFIG[code];
    if (!config) return false;
    if (config.comingSoon) return false;
    if (config.dependsOn && !isFeatureActive(config.dependsOn)) return false;
    return true;
  };

  // Check if all agreements are accepted
  const allAgreementsAccepted = useMemo(() => {
    return agreementState.dataAccuracy && 
           agreementState.salesMandate && 
           agreementState.systemFee;
  }, [agreementState]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Activate sales order with agreements
  async function activateVerkaufsauftrag() {
    if (!allAgreementsAccepted) return;
    
    setIsActivating(true);
    try {
      // 1. Get or create listing
      let listingId: string | null = null;
      
      const { data: existingListing } = await supabase
        .from('listings')
        .select('id')
        .eq('property_id', propertyId)
        .in('status', ['draft', 'active', 'reserved'])
        .maybeSingle();

      if (existingListing) {
        listingId = existingListing.id;
        // Update listing to active
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            status: 'active',
            commission_rate: agreementState.commissionRate[0]
          })
          .eq('id', listingId);
        if (updateError) throw updateError;
      } else {
        // Create new listing
        const { data: newListing, error: insertError } = await supabase
          .from('listings')
          .insert({
            property_id: propertyId,
            unit_id: unitId || null,
            tenant_id: tenantId,
            title: `${propertyAddress}, ${propertyCity}`.trim() || 'Immobilie',
            status: 'active',
            asking_price: askingPrice || null,
            commission_rate: agreementState.commissionRate[0]
          })
          .select('id')
          .single();
        if (insertError) throw insertError;
        listingId = newListing.id;
      }

      // 2. Upsert property feature
      const existingFeature = getFeature('verkaufsauftrag');
      if (existingFeature) {
        const { error: updateError } = await supabase
          .from('property_features')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            deactivated_at: null,
            config: { commission_rate: agreementState.commissionRate[0] }
          })
          .eq('id', existingFeature.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('property_features')
          .insert({
            property_id: propertyId,
            tenant_id: tenantId,
            feature_code: 'verkaufsauftrag',
            status: 'active',
            activated_at: new Date().toISOString(),
            config: { commission_rate: agreementState.commissionRate[0] }
          });
        if (insertError) throw insertError;
      }

      // 3. Log consents
      const consentTemplates = ['SALES_MANDATE_V2', 'DATA_ACCURACY_CONSENT', 'SYSTEM_SUCCESS_FEE'];
      for (const code of consentTemplates) {
        const { data: template } = await supabase
          .from('agreement_templates')
          .select('id, version')
          .eq('code', code)
          .eq('is_active', true)
          .maybeSingle();

        if (template && user?.id) {
          await supabase.from('user_consents').insert({
            tenant_id: tenantId,
            user_id: user.id,
            template_id: template.id,
            template_version: template.version,
            status: 'accepted',
            consented_at: new Date().toISOString()
          });
        }
      }

      toast.success('Verkaufsauftrag erteilt – Objekt ist jetzt zur Vermarktung freigegeben');
      setExpandedFeature(null);
      resetAgreementState();
      await fetchFeatures();
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      onUpdate?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler bei der Aktivierung';
      toast.error(message);
    }
    setIsActivating(false);
  }

  // Simple toggle for features without agreement
  async function toggleSimpleFeature(code: string, currentlyActive: boolean) {
    try {
      const existingFeature = getFeature(code);

      if (existingFeature) {
        const { error: updateError } = await supabase
          .from('property_features')
          .update({
            status: currentlyActive ? 'inactive' : 'active',
            ...(currentlyActive 
              ? { deactivated_at: new Date().toISOString() }
              : { activated_at: new Date().toISOString(), deactivated_at: null }
            ),
          })
          .eq('id', existingFeature.id);

        if (updateError) throw updateError;
      } else if (!currentlyActive) {
        const { error: insertError } = await supabase
          .from('property_features')
          .insert({
            property_id: propertyId,
            tenant_id: tenantId,
            feature_code: code,
            status: 'active',
            activated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      const label = FEATURE_CONFIG[code]?.label || code;
      toast.success(currentlyActive ? `${label} deaktiviert` : `${label} aktiviert`);
      await fetchFeatures();
      onUpdate?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren';
      toast.error(message);
    }
  }

  function resetAgreementState() {
    setAgreementState({
      dataAccuracy: false,
      salesMandate: false,
      systemFee: false,
      commissionRate: [7],
    });
  }

  // Deactivate Verkaufsauftrag - withdraws listing and pauses publications
  async function deactivateVerkaufsauftrag() {
    const feature = getFeature('verkaufsauftrag');
    if (!feature) return;

    setIsActivating(true);
    try {
      // 1. Deactivate feature
      const { error: updateError } = await supabase
        .from('property_features')
        .update({
          status: 'inactive',
          deactivated_at: new Date().toISOString(),
          deactivated_by: user?.id || null
        })
        .eq('id', feature.id);

      if (updateError) throw updateError;

      // 2. Withdraw listings
      const { error: listingError } = await supabase
        .from('listings')
        .update({ status: 'withdrawn' })
        .eq('property_id', propertyId)
        .in('status', ['draft', 'active', 'reserved']);

      if (listingError) throw listingError;

      // 3. Pause all publications
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('property_id', propertyId);

      if (listings?.length) {
        await supabase
          .from('listing_publications')
          .update({ 
            status: 'paused', 
            removed_at: new Date().toISOString() 
          })
          .in('listing_id', listings.map(l => l.id));
      }

      // 4. Also deactivate Kaufy visibility if active
      const kaufyFeature = getFeature('kaufy_sichtbarkeit');
      if (kaufyFeature && kaufyFeature.status === 'active') {
        await supabase
          .from('property_features')
          .update({
            status: 'inactive',
            deactivated_at: new Date().toISOString(),
            deactivated_by: user?.id || null
          })
          .eq('id', kaufyFeature.id);
      }

      toast.success('Verkaufsauftrag widerrufen – Objekt wurde aus der Vermarktung genommen');
      await fetchFeatures();
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      onUpdate?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Deaktivieren';
      toast.error(message);
    }
    setIsActivating(false);
  }

  function handleFeatureToggle(code: string, isActive: boolean) {
    const config = FEATURE_CONFIG[code];
    if (!config) return;

    if (code === 'verkaufsauftrag') {
      if (isActive) {
        // Currently active → Deactivate
        deactivateVerkaufsauftrag();
      } else {
        // Currently inactive → Expand agreement panel
        setExpandedFeature(code);
        resetAgreementState();
      }
    } else if (!isActive && config.requiresAgreement && !config.comingSoon) {
      // Expand for agreement (other features)
      setExpandedFeature(code);
      resetAgreementState();
    } else if (isActive || !config.requiresAgreement) {
      // Direct toggle for simple features
      toggleSimpleFeature(code, isActive);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const isVerkaufsauftragActive = isFeatureActive('verkaufsauftrag');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Verkaufsauftrag
          </CardTitle>
          <CardDescription>
            Verwalten Sie die Vermarktung dieser Immobilie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(FEATURE_CONFIG) as FeatureCode[]).map((code) => {
            const config = FEATURE_CONFIG[code];
            const isActive = isFeatureActive(code);
            const canActivate = canActivateFeature(code);
            const isExpanded = expandedFeature === code;
            const Icon = config.icon;

            return (
              <div 
                key={code} 
                className={`rounded-lg border transition-all ${
                  isExpanded ? 'border-primary bg-primary/5' : ''
                } ${config.comingSoon ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium cursor-pointer">
                          {config.label}
                        </Label>
                        {isActive && (
                          <Badge variant="default" className="text-xs">Aktiv</Badge>
                        )}
                        {config.comingSoon && (
                          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                        )}
                        {!canActivate && !config.comingSoon && config.dependsOn && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            Voraussetzung fehlt
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      
                      {/* Dependency hint */}
                      {config.dependsOn && !isFeatureActive(config.dependsOn) && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Erfordert: {FEATURE_CONFIG[config.dependsOn]?.label}
                        </p>
                      )}
                      
                      {/* Kaufy Zone 1 hint */}
                      {code === 'kaufy_sichtbarkeit' && isActive && (
                        <p className="text-xs text-warning mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Freigabe durch Zone 1 erforderlich
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleFeatureToggle(code, isActive)}
                      disabled={!canActivate || config.comingSoon || isActivating}
                    />
                  </div>
                </div>

                {/* Expanded Agreement Panel for Verkaufsauftrag */}
                {isExpanded && code === 'verkaufsauftrag' && (
                  <div className="px-4 pb-4">
                    <Separator className="mb-4" />
                    <div className="space-y-4">
                      <h4 className="font-medium">Vereinbarung zur Vermarktung</h4>
                      <p className="text-sm text-muted-foreground">
                        Mit der Aktivierung erteilen Sie uns den Auftrag, 
                        Ihre Immobilie über unser Kapitalanlage-Vertriebsnetzwerk zu vermarkten.
                      </p>

                      {/* Object Summary */}
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <span className="font-medium">Objektdaten</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Objekt</p>
                            <p className="font-medium">{propertyAddress || 'N/A'}, {propertyCity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Kaufpreis</p>
                            <p className="font-medium">{askingPrice ? formatCurrency(askingPrice) : 'Nicht angegeben'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Commission Slider */}
                      <div className="space-y-2">
                        <Label>Käufer-Provision: {agreementState.commissionRate[0].toFixed(1)}% netto</Label>
                        <Slider
                          value={agreementState.commissionRate}
                          onValueChange={(val) => setAgreementState(prev => ({ ...prev, commissionRate: val }))}
                          min={3}
                          max={15}
                          step={0.5}
                          className="py-3"
                        />
                        <p className="text-xs text-muted-foreground">
                          Brutto: {(agreementState.commissionRate[0] * 1.19).toFixed(2)}% inkl. MwSt.
                        </p>
                      </div>

                      {/* Consents */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="data-accuracy" 
                            checked={agreementState.dataAccuracy}
                            onCheckedChange={(checked) => 
                              setAgreementState(prev => ({ ...prev, dataAccuracy: checked as boolean }))
                            }
                          />
                          <Label htmlFor="data-accuracy" className="text-sm leading-relaxed cursor-pointer">
                            Ich bestätige die Richtigkeit aller Angaben im Exposé.
                          </Label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="sales-mandate" 
                            checked={agreementState.salesMandate}
                            onCheckedChange={(checked) => 
                              setAgreementState(prev => ({ ...prev, salesMandate: checked as boolean }))
                            }
                          />
                          <Label htmlFor="sales-mandate" className="text-sm leading-relaxed cursor-pointer">
                            Ich erteile den Verkaufsauftrag gemäß den Allgemeinen Geschäftsbedingungen.
                          </Label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="system-fee" 
                            checked={agreementState.systemFee}
                            onCheckedChange={(checked) => 
                              setAgreementState(prev => ({ ...prev, systemFee: checked as boolean }))
                            }
                          />
                          <Label htmlFor="system-fee" className="text-sm leading-relaxed cursor-pointer">
                            Ich akzeptiere die Systemgebühr von 2.000 € netto bei erfolgreichem Abschluss.
                          </Label>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setExpandedFeature(null);
                            resetAgreementState();
                          }}
                          disabled={isActivating}
                        >
                          Abbrechen
                        </Button>
                        <Button 
                          size="sm"
                          disabled={!allAgreementsAccepted || isActivating}
                          onClick={activateVerkaufsauftrag}
                          className="gap-2"
                        >
                          {isActivating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {isActivating ? 'Aktiviere...' : 'Vermarktung aktivieren'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feature History */}
      {features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {features.map(f => (
                <div key={f.id} className="flex justify-between items-center">
                  <span className="font-mono">{f.feature_code}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={f.status === 'active' ? 'default' : 'secondary'}>
                      {f.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      seit {new Date(f.activated_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info about next steps */}
      {isVerkaufsauftragActive && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Verkaufsauftrag aktiv. Sie können jetzt das Exposé im{' '}
            <a href="/portal/verkauf/objekte" className="text-primary hover:underline font-medium">
              Verkaufsmodul
            </a>{' '}
            bearbeiten.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default VerkaufsauftragTab;
