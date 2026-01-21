import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Home, ShoppingCart, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyFeature {
  id: string;
  feature_code: string;
  status: string;
  activated_at: string;
}

interface FeaturesTabProps {
  propertyId: string;
  tenantId: string;
  onUpdate?: () => void;
}

const FEATURE_CONFIG = {
  msv: {
    label: 'MSV (Miety)',
    description: 'Aktiviert die Mieterverwaltung und das Mieterportal für diese Immobilie.',
    icon: Home,
  },
  kaufy: {
    label: 'Kaufy (Verkauf)',
    description: 'Aktiviert den Verkaufsauftrag und die Vertriebspartner-Sichtbarkeit.',
    icon: ShoppingCart,
  },
  website_visibility: {
    label: 'Website-Sichtbarkeit',
    description: 'Macht diese Immobilie auf der öffentlichen Website sichtbar.',
    icon: Globe,
  },
} as const;

type FeatureCode = keyof typeof FEATURE_CONFIG;

export function FeaturesTab({ propertyId, tenantId, onUpdate }: FeaturesTabProps) {
  const { isPlatformAdmin } = useAuth();
  const [features, setFeatures] = useState<PropertyFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setFeatures(data || []);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Features');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchFeatures();
  }, [propertyId, tenantId]);

  const isFeatureActive = (code: FeatureCode) => {
    const feature = features.find(f => f.feature_code === code);
    return feature?.status === 'active';
  };

  const getFeature = (code: FeatureCode) => {
    return features.find(f => f.feature_code === code);
  };

  async function toggleFeature(code: FeatureCode, currentlyActive: boolean) {
    setUpdating(code);
    try {
      const existingFeature = getFeature(code);

      if (existingFeature) {
        // Update existing feature
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
      } else {
        // Create new feature (only if activating)
        if (!currentlyActive) {
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
      }

      toast.success(currentlyActive 
        ? `${FEATURE_CONFIG[code].label} deaktiviert`
        : `${FEATURE_CONFIG[code].label} aktiviert`
      );
      
      await fetchFeatures();
      onUpdate?.();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Aktualisieren');
    }
    setUpdating(null);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Features</CardTitle>
          <CardDescription>
            Aktivieren oder deaktivieren Sie Module für diese Immobilie (ADR-021 Option B)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(FEATURE_CONFIG) as FeatureCode[]).map((code) => {
            const config = FEATURE_CONFIG[code];
            const isActive = isFeatureActive(code);
            const isUpdating = updating === code;
            const Icon = config.icon;

            return (
              <div 
                key={code} 
                className="flex items-start justify-between p-4 rounded-lg border"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={code} className="font-medium cursor-pointer">
                        {config.label}
                      </Label>
                      {isActive && (
                        <Badge variant="default" className="text-xs">Aktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Switch
                    id={code}
                    checked={isActive}
                    onCheckedChange={() => toggleFeature(code, isActive)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feature History */}
      {features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature-Verlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {features.map(f => (
                <div key={f.id} className="flex justify-between items-center">
                  <span className="font-mono">{f.feature_code}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={f.status === 'active' ? 'default' : 'secondary'}>
                      {f.status}
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
    </div>
  );
}
