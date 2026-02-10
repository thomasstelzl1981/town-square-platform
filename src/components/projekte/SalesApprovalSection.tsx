/**
 * Sales Approval Section - Vertriebsauftrag mit Agreement-Flow
 * MOD-13 PROJEKTE — nach MOD-04 VerkaufsauftragTab Vorbild
 * 
 * Flow: Switch → Agreement Panel expandiert → Consents + Provision → Sales Desk Request → Zone 1
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
  Clock,
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
  pending: { label: 'Freigabe ausstehend', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Freigegeben', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Abgelehnt', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  withdrawn: { label: 'Widerrufen', color: 'bg-muted text-muted-foreground border-border' },
};

export function SalesApprovalSection({
  projectId,
  projectName,
  projectAddress,
  totalUnits,
  projectVolume,
}: SalesApprovalSectionProps) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  // Agreement panel state
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [agreementState, setAgreementState] = useState({
    dataAccuracy: false,
    salesMandate: false,
    systemFee: false,
    commissionRate: [7],
  });
  const [isActivating, setIsActivating] = useState(false);

  // Fetch existing request for this project
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
    enabled: !!projectId,
  });

  const requestStatus = request?.status as string | undefined;
  const isApproved = requestStatus === 'approved';
  const isPending = requestStatus === 'pending';
  const isVertriebActive = requestStatus === 'approved' || requestStatus === 'pending';

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

  // ─── Activate Vertriebsauftrag ───
  async function activateVertriebsauftrag() {
    if (!allAgreementsAccepted || !projectId || !tenantId || !user) return;

    setIsActivating(true);
    try {
      // 1. Insert sales_desk_requests
      const { error: requestError } = await supabase
        .from('sales_desk_requests')
        .insert({
          project_id: projectId,
          tenant_id: tenantId,
          requested_by: user.id,
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

      toast.success('Vertriebsauftrag erteilt', {
        description: 'Freigabe durch Sales Desk ausstehend.',
      });
      setExpandedFeature(null);
      resetAgreementState();
      queryClient.invalidateQueries({ queryKey: ['sales-desk-request', projectId] });
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

      toast.success('Vertriebsauftrag widerrufen', {
        description: 'Projekt wurde aus der Vermarktung genommen.',
      });
      queryClient.invalidateQueries({ queryKey: ['sales-desk-request', projectId] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Widerruf';
      toast.error(message);
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
    // kaufy_projekt and landingpage are simple toggles — placeholder for now
  }

  const hasProject = !!projectId;

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
            const isActive = code === 'vertriebsfreigabe' ? isVertriebActive : false;
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
                        {isActive && requestStatus && (
                          <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[requestStatus]?.color || ''}`}>
                            {STATUS_CONFIG[requestStatus]?.label || requestStatus}
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
                          Erfordert: Vertrieb muss freigegeben sein
                        </p>
                      )}

                      {code === 'vertriebsfreigabe' && isPending && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Wird von Zone 1 (Sales Desk) geprüft
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
                <span>Vertriebsauftrag beantragt</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(request.requested_at).toLocaleDateString('de-DE')}
                </span>
              </div>
              {request.reviewed_at && (
                <div className="flex justify-between items-center">
                  <span>
                    {request.status === 'approved' ? 'Freigegeben' : request.status === 'rejected' ? 'Abgelehnt' : 'Aktualisiert'}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(request.reviewed_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              )}
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
