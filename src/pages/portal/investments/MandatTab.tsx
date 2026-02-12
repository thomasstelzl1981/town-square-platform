/**
 * MandatTab — MOD-08 Investment Search Mandate Management
 * 
 * Entry point for users to create and view their acquisition mandates
 */
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, FileSignature, Loader2, Building2, MapPin, 
  Clock, CheckCircle2, ArrowRight, Eye
} from 'lucide-react';
import { useMyAcqMandates, useSubmitAcqMandate } from '@/hooks/useAcqMandate';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { MANDATE_STATUS_CONFIG, ASSET_FOCUS_OPTIONS } from '@/types/acquisition';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function MandatTab() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useMyAcqMandates();
  const submitMandate = useSubmitAcqMandate();

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getAssetFocusLabels = (focus: string[] | null) => {
    if (!focus || focus.length === 0) return '–';
    return focus.map(f => {
      const option = ASSET_FOCUS_OPTIONS.find(o => o.value === f);
      return option?.label || f;
    }).join(', ');
  };

  const handleSubmit = async (mandateId: string) => {
    await submitMandate.mutateAsync(mandateId);
  };

  // Separate mandates by status
  const draftMandates = mandates?.filter(m => m.status === 'draft') || [];
  const activeMandates = mandates?.filter(m => 
    m.status === 'submitted_to_zone1' || 
    m.status === 'assigned' || 
    m.status === 'active'
  ) || [];
  const closedMandates = mandates?.filter(m => 
    m.status === 'paused' || m.status === 'closed'
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="SUCHMANDAT"
        description="Beauftragen Sie einen AkquiseManager mit der Suche nach Ihrem Wunschobjekt"
        actions={
          <Button onClick={() => navigate('/portal/investments/mandat/neu')}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Mandat erstellen
          </Button>
        }
      />

      {/* No Mandates */}
      {(!mandates || mandates.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kein Suchmandat</h3>
            <p className="text-muted-foreground mb-6">
              Erstellen Sie Ihr erstes Suchmandat um einen professionellen AkquiseManager 
              mit der Objektsuche zu beauftragen.
            </p>
            <Button onClick={() => navigate('/portal/investments/mandat/neu')}>
              <Plus className="h-4 w-4 mr-2" />
              Suchmandat erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Draft Mandates */}
      {draftMandates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Entwürfe
          </h3>
          {draftMandates.map((mandate) => {
            const statusConfig = MANDATE_STATUS_CONFIG[mandate.status];
            
            return (
              <Card key={mandate.id} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{mandate.code}</span>
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{getAssetFocusLabels(mandate.asset_focus)}</span>
                          <span>•</span>
                          <span>{formatCurrency(mandate.price_min)} – {formatCurrency(mandate.price_max)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/portal/investments/mandat/${mandate.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleSubmit(mandate.id)}
                        disabled={submitMandate.isPending}
                      >
                        {submitMandate.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        Einreichen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Active Mandates */}
      {activeMandates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Aktive Mandate
          </h3>
          {activeMandates.map((mandate) => {
            const statusConfig = MANDATE_STATUS_CONFIG[mandate.status];
            
            return (
              <Card key={mandate.id} className="border-green-200 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/portal/investments/mandat/${mandate.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{mandate.code}</span>
                          <Badge className={statusConfig.variant === 'default' ? 'bg-green-500' : ''} variant={statusConfig.variant as any}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{(mandate.search_area as any)?.region || 'Region nicht angegeben'}</span>
                          <span>•</span>
                          <span>{getAssetFocusLabels(mandate.asset_focus)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {formatCurrency(mandate.price_min)} – {formatCurrency(mandate.price_max)}
                        </div>
                        <div className="text-muted-foreground">
                          Erstellt {formatDistanceToNow(new Date(mandate.created_at), { locale: de, addSuffix: true })}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Closed/Paused Mandates */}
      {closedMandates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">Abgeschlossene Mandate</h3>
          {closedMandates.map((mandate) => {
            const statusConfig = MANDATE_STATUS_CONFIG[mandate.status];
            
            return (
              <Card key={mandate.id} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => navigate(`/portal/investments/mandat/${mandate.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{mandate.code}</span>
                          <Badge variant="outline">{statusConfig.label}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(mandate.created_at), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
