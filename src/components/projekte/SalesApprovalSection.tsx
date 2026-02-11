/**
 * Sales Approval Section - Vertriebsauftrag mit Agreement-Flow
 * MOD-13 PROJEKTE — nach MOD-04 VerkaufsauftragTab Vorbild
 * 
 * Flow: Switch → Agreement Panel expandiert → Consents + Provision → Direkte Aktivierung → Listings erstellt
 * Zone 1 hat nur einen Kill-Switch (Deaktivierung), kein Approval-Gate.
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  FileCheck,
  ShoppingCart,
  Globe,
  Building2,
  CheckCircle2,
  Lock,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SalesApprovalSectionProps {
  projectId?: string;
  projectName?: string;
  projectAddress?: string;
  totalUnits?: number;
  projectVolume?: number;
  isDemo?: boolean;
}

interface FeatureConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAgreement: boolean;
  dependsOn?: string;
  comingSoon?: boolean;
}

const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  vertriebsfreigabe: {
    label: 'Vertrieb aktivieren',
    description: 'Erteilt den Auftrag zur Vermarktung dieses Projekts über unser Vertriebsnetzwerk.',
    icon: ShoppingCart,
    requiresAgreement: true,
  },
  kaufy_projekt: {
    label: 'Kaufy Marktplatz',
    description: 'Macht dieses Projekt zusätzlich auf dem öffentlichen Kaufy-Marktplatz sichtbar.',
    icon: Globe,
    requiresAgreement: false,
    dependsOn: 'vertriebsfreigabe',
  },
  projekt_landingpage: {
    label: 'Projekt-Landingpage',
    description: 'Erstellt eine dedizierte Landingpage für das Projekt mit Exposé und Kontaktformular.',
    icon: ExternalLink,
    requiresAgreement: false,
    dependsOn: 'vertriebsfreigabe',
    comingSoon: true,
  },
};

type FeatureCode = keyof typeof FEATURE_CONFIG;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  approved: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  withdrawn: { label: 'Widerrufen', color: 'bg-muted text-muted-foreground border-border' },
};

export function SalesApprovalSection({
  projectId,
  projectName,
  projectAddress,
  totalUnits,
  projectVolume,
  isDemo = false,
}: SalesApprovalSectionProps) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [agreementState, setAgreementState] = useState({
    dataAccuracy: false,
    salesMandate: false,
    systemFee: false,
    commissionRate: [7],
  });
  const [isActivating, setIsActivating] = useState(false);

  // Fetch existing request
  const { data: request } = useQuery({
    queryKey: ['sales-desk-request', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('sales_desk_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !isDemo,
  });

  const requestStatus = request?.status as string | undefined;
  const isApproved = requestStatus === 'approved';
  const isVertriebActive = requestStatus === 'approved';

  // Track Kaufy state
  const { data: projectData } = useQuery({
    queryKey: ['dev-project-kaufy', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase
        .from('dev_projects')
        .select('kaufy_listed')
        .eq('id', projectId)
        .maybeSingle();
      return data;
    },
    enabled: !!projectId && !isDemo,
  });

  const isKaufyActive = projectData?.kaufy_listed ?? false;

  const allAgreementsAccepted = useMemo(() => {
    return agreementState.dataAccuracy && agreementState.salesMandate && agreementState.systemFee;
  }, [agreementState]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  function resetAgreementState() {
    setAgreementState({
      dataAccuracy: false,
      salesMandate: false,
      systemFee: false,
      commissionRate: [7],
    });
  }

  // ─── Create listings for all project units ───
  async function createListingsForProject(commissionRate: number) {
    if (!projectId || !tenantId || !user) return;

    const { data: units, error: unitsError } = await supabase
      .from('dev_project_units')
      .select('*')
      .eq('project_id', projectId);
    
    if (unitsError || !units?.length) return;

    const { data: project } = await supabase
      .from('dev_projects')
      .select('name, city')
      .eq('id', projectId)
      .maybeSingle();

    const citySlug = (project?.city || 'stadt')
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-');

    for (const unit of units) {
      if (unit.status === 'verkauft') continue;

      let propertyId = unit.property_id;

      if (!propertyId) {
        const unitPublicId = `SOT-I-${unit.unit_number.replace(/[^a-zA-Z0-9]/g, '')}`;
        const { data: newProperty, error: propError } = await supabase
          .from('properties')
          .insert({
            tenant_id: tenantId,
            public_id: unitPublicId,
            code: unit.unit_number,
            address: projectAddress || 'Adresse nicht angegeben',
            city: project?.city || 'Stadt',
          })
          .select('id')
          .single();

        if (propError || !newProperty) continue;
        propertyId = newProperty.id;

        await supabase
          .from('dev_project_units')
          .update({ property_id: propertyId })
          .eq('id', unit.id);
      }

      const listingTitle = `${project?.name || 'Projekt'} – ${unit.unit_number}`;
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          unit_id: unit.unit_id || null,
          title: listingTitle,
          asking_price: unit.list_price,
          commission_rate: commissionRate,
          status: 'active',
          created_by: user.id,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (listingError || !listing) continue;

      const publicId = `${citySlug}-${listing.id.substring(0, 8)}`;
      await supabase
        .from('listings')
        .update({ public_id: publicId })
        .eq('id', listing.id);

      await supabase
        .from('listing_publications')
        .insert({
          listing_id: listing.id,
          tenant_id: tenantId,
          channel: 'partner_network',
          status: 'active',
          published_at: new Date().toISOString(),
        });
    }
  }

  // ─── Withdraw all listings for project ───
  async function withdrawListingsForProject() {
    if (!projectId || !tenantId) return;

    const { data: units } = await supabase
      .from('dev_project_units')
      .select('property_id')
      .eq('project_id', projectId)
      .not('property_id', 'is', null);

    if (!units?.length) return;
    const propertyIds = units.map(u => u.property_id!).filter(Boolean);

    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .in('property_id', propertyIds)
      .eq('tenant_id', tenantId);

    if (!listings?.length) return;
    const listingIds = listings.map(l => l.id);

    // Delete publications first (FK), then listings (hard-delete)
    await supabase
      .from('listing_publications')
      .delete()
      .in('listing_id', listingIds);

    await supabase
      .from('listings')
      .delete()
      .in('id', listingIds);

    await supabase
      .from('dev_projects')
      .update({ kaufy_listed: false })
      .eq('id', projectId);
  }

  // ─── Activate Vertriebsauftrag ───
  async function activateVertriebsauftrag() {
    if (!allAgreementsAccepted) return;

    if (isDemo) {
      toast.info('Demo-Modus', {
        description: 'Im Demo-Modus kann kein echter Vertriebsauftrag erteilt werden.',
      });
      return;
    }

    if (!projectId || !tenantId || !user) return;

    setIsActivating(true);
    try {
      // 1. Insert with status 'approved' directly (no pending)
      const { error: requestError } = await supabase
        .from('sales_desk_requests')
        .insert({
          project_id: projectId,
          tenant_id: tenantId,
          requested_by: user.id,
          status: 'approved',
          commission_agreement: {
            rate: agreementState.commissionRate[0],
            gross_rate: parseFloat((agreementState.commissionRate[0] * 1.19).toFixed(2)),
          },
        });
      if (requestError) throw requestError;

      // 2. Log consents
      const consentTemplates = ['SALES_MANDATE_V2', 'DATA_ACCURACY_CONSENT', 'SYSTEM_SUCCESS_FEE'];
      for (const code of consentTemplates) {
        const { data: template } = await supabase
          .from('agreement_templates')
          .select('id, version')
          .eq('code', code)
          .eq('is_active', true)
          .maybeSingle();

        if (template) {
          await supabase.from('user_consents').insert({
            tenant_id: tenantId,
            user_id: user.id,
            template_id: template.id,
            template_version: template.version,
            status: 'accepted',
            consented_at: new Date().toISOString(),
          });
        }
      }

      // 3. Create listings for all units
      await createListingsForProject(agreementState.commissionRate[0]);

      toast.success('Vertriebsauftrag aktiviert', {
        description: 'Projekt ist jetzt im Partnernetzwerk sichtbar.',
      });
      setExpandedFeature(null);
      resetAgreementState();
      queryClient.invalidateQueries({ queryKey: ['sales-desk-request', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-project-kaufy', projectId] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler bei der Aktivierung';
      toast.error(message);
    }
    setIsActivating(false);
  }

  // ─── Deactivate (Widerruf) ───
  async function deactivateVertriebsauftrag() {
    if (!request?.id) return;

    setIsActivating(true);
    try {
      const { error } = await supabase
        .from('sales_desk_requests')
        .update({ status: 'withdrawn' })
        .eq('id', request.id);
      if (error) throw error;

      await withdrawListingsForProject();

      toast.success('Vertriebsauftrag widerrufen', {
        description: 'Alle Listings und Publikationen deaktiviert.',
      });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-request', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-project-kaufy', projectId] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Widerruf';
      toast.error(message);
    }
    setIsActivating(false);
  }

  // ─── Kaufy Toggle ───
  async function handleKaufyToggle(enabled: boolean) {
    if (!projectId || !tenantId) return;
    setIsActivating(true);
    try {
      const { data: units } = await supabase
        .from('dev_project_units')
        .select('property_id')
        .eq('project_id', projectId)
        .not('property_id', 'is', null);

      if (units?.length) {
        const propertyIds = units.map(u => u.property_id!).filter(Boolean);
        const { data: listings } = await supabase
          .from('listings')
          .select('id')
          .in('property_id', propertyIds)
          .eq('tenant_id', tenantId)
          .eq('status', 'active');

        if (listings?.length) {
          for (const listing of listings) {
            if (enabled) {
              const { data: existing } = await supabase
                .from('listing_publications')
                .select('id')
                .eq('listing_id', listing.id)
                .eq('channel', 'kaufy')
                .maybeSingle();

              if (existing) {
                await supabase
                  .from('listing_publications')
                  .update({ status: 'active', published_at: new Date().toISOString() })
                  .eq('id', existing.id);
              } else {
                await supabase
                  .from('listing_publications')
                  .insert({
                    listing_id: listing.id,
                    tenant_id: tenantId,
                    channel: 'kaufy',
                    status: 'active',
                    published_at: new Date().toISOString(),
                  });
              }
            } else {
              await supabase
                .from('listing_publications')
                .update({ status: 'paused' })
                .eq('listing_id', listing.id)
                .eq('channel', 'kaufy');
            }
          }
        }
      }

      await supabase
        .from('dev_projects')
        .update({ kaufy_listed: enabled })
        .eq('id', projectId);

      toast.success(enabled ? 'Auf Kaufy veröffentlicht' : 'Von Kaufy entfernt');
      queryClient.invalidateQueries({ queryKey: ['dev-project-kaufy', projectId] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Fehler');
    }
    setIsActivating(false);
  }

  // ─── Feature toggle handler ───
  function handleFeatureToggle(code: string) {
    if (code === 'vertriebsfreigabe') {
      if (isVertriebActive) {
        deactivateVertriebsauftrag();
      } else {
        setExpandedFeature(code);
        resetAgreementState();
      }
    }
    if (code === 'kaufy_projekt') {
      handleKaufyToggle(!isKaufyActive);
    }
  }

  const hasProject = !!projectId || isDemo;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Vertriebsauftrag
          </CardTitle>
          <CardDescription>
            {hasProject
              ? 'Verwalten Sie die Vermarktung und Vertriebskanäle für dieses Projekt'
              : 'Erstellen Sie ein Projekt, um den Vertriebsauftrag zu aktivieren.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(FEATURE_CONFIG) as FeatureCode[]).map((code) => {
            const config = FEATURE_CONFIG[code];
            const isActive = code === 'vertriebsfreigabe' ? isVertriebActive
              : code === 'kaufy_projekt' ? isKaufyActive
              : false;
            const canActivate = code === 'vertriebsfreigabe'
              ? !config.comingSoon
              : isApproved && !config.comingSoon;
            const isExpanded = expandedFeature === code;
            const Icon = config.icon;

            return (
              <div
                key={code}
                className={`rounded-lg border transition-all ${
                  isExpanded ? 'border-primary bg-primary/5' : ''
                } ${config.comingSoon ? 'opacity-60' : ''}`}
              >
                {/* Feature row */}
                <div className="flex items-start justify-between p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium cursor-pointer">{config.label}</Label>
                        {code === 'vertriebsfreigabe' && isActive && requestStatus && (
                          <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[requestStatus]?.color || ''}`}>
                            {STATUS_CONFIG[requestStatus]?.label || requestStatus}
                          </Badge>
                        )}
                        {code === 'kaufy_projekt' && isKaufyActive && (
                          <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                            Aktiv
                          </Badge>
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

                      {config.dependsOn && !isApproved && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Erfordert: Vertrieb muss aktiviert sein
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => handleFeatureToggle(code)}
                    disabled={!hasProject || !canActivate || config.comingSoon || isActivating}
                  />
                </div>

                {/* ─── Expanded Agreement Panel ─── */}
                {isExpanded && code === 'vertriebsfreigabe' && (
                  <div className="px-4 pb-4">
                    <Separator className="mb-4" />
                    <div className="space-y-4">
                      <h4 className="font-medium">Vereinbarung zur Projektvermarktung</h4>
                      <p className="text-sm text-muted-foreground">
                        Mit der Aktivierung erteilen Sie den Auftrag, dieses Projekt über unser
                        Vertriebsnetzwerk zu vermarkten. Bitte bestätigen Sie die nachfolgenden Angaben.
                      </p>

                      {/* Project Summary */}
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <span className="font-medium">Projektdaten</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Projekt</p>
                            <p className="font-medium">{projectName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Adresse</p>
                            <p className="font-medium">{projectAddress || 'Nicht angegeben'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Einheiten</p>
                            <p className="font-medium">{totalUnits ?? '–'} WE</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Projektvolumen</p>
                            <p className="font-medium">{projectVolume ? formatCurrency(projectVolume) : 'Nicht berechnet'}</p>
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
                            id="proj-data-accuracy"
                            checked={agreementState.dataAccuracy}
                            onCheckedChange={(checked) =>
                              setAgreementState(prev => ({ ...prev, dataAccuracy: checked as boolean }))
                            }
                          />
                          <Label htmlFor="proj-data-accuracy" className="text-sm leading-relaxed cursor-pointer">
                            Ich bestätige die Richtigkeit aller Projektdaten und der Preisliste.
                          </Label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="proj-sales-mandate"
                            checked={agreementState.salesMandate}
                            onCheckedChange={(checked) =>
                              setAgreementState(prev => ({ ...prev, salesMandate: checked as boolean }))
                            }
                          />
                          <Label htmlFor="proj-sales-mandate" className="text-sm leading-relaxed cursor-pointer">
                            Ich erteile den Vertriebsauftrag gemäß den Allgemeinen Geschäftsbedingungen.
                          </Label>
                        </div>

                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="proj-system-fee"
                            checked={agreementState.systemFee}
                            onCheckedChange={(checked) =>
                              setAgreementState(prev => ({ ...prev, systemFee: checked as boolean }))
                            }
                          />
                          <Label htmlFor="proj-system-fee" className="text-sm leading-relaxed cursor-pointer">
                            Ich akzeptiere die Systemgebühr von 2.000 € netto pro verkaufter Einheit.
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
                          onClick={activateVertriebsauftrag}
                          className="gap-2"
                        >
                          {isActivating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {isActivating ? 'Aktiviere...' : 'Vertrieb aktivieren'}
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

      {/* History / Timeline */}
      {request && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Vertriebsauftrag erteilt</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(request.requested_at).toLocaleDateString('de-DE')}
                </span>
              </div>
              {request.status === 'withdrawn' && (
                <div className="flex justify-between items-center">
                  <span>Widerrufen</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(request.updated_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              )}
              {request.commission_agreement && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Provision</span>
                  <span>{(request.commission_agreement as any)?.rate ?? '–'}% netto</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
