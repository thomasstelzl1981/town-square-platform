/**
 * MandatDetail — MOD-08 Mandate Status/Timeline View
 * 
 * Read-only view for users to track their mandate status and deliveries
 */
import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Loader2, Building2, MapPin, Clock, 
  CheckCircle2, Users, FileText, Mail, Package
} from 'lucide-react';
import { useAcqMandate, useAcqMandateEvents } from '@/hooks/useAcqMandate';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { MANDATE_STATUS_CONFIG, ASSET_FOCUS_OPTIONS } from '@/types/acquisition';

const STATUS_PROGRESS: Record<string, number> = {
  draft: 10,
  submitted_to_zone1: 20,
  assigned: 40,
  active: 60,
  paused: 60,
  closed: 100,
};

const EVENT_ICONS: Record<string, any> = {
  created: FileText,
  submitted: CheckCircle2,
  assigned: Users,
  accepted: CheckCircle2,
  split_confirmed: CheckCircle2,
  email_sent: Mail,
  offer_created: Package,
};

export default function MandatDetail() {
  const { mandateId } = useParams();
  const navigate = useNavigate();
  const { data: mandate, isLoading } = useAcqMandate(mandateId);
  const { data: events } = useAcqMandateEvents(mandateId);

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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Mandat nicht gefunden</h3>
            <Button onClick={() => navigate('/portal/investments/mandat')}>
              Zurück zur Übersicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = MANDATE_STATUS_CONFIG[mandate.status];
  const progress = STATUS_PROGRESS[mandate.status] || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/investments/mandat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{mandate.code}</h1>
            <Badge variant={statusConfig.variant as any} className="text-sm">
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Erstellt am {format(new Date(mandate.created_at), 'dd. MMMM yyyy', { locale: de })}
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fortschritt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className={mandate.status === 'draft' ? 'font-medium text-primary' : ''}>
              Entwurf
            </span>
            <span className={mandate.status === 'submitted_to_zone1' ? 'font-medium text-primary' : ''}>
              Eingereicht
            </span>
            <span className={mandate.status === 'assigned' ? 'font-medium text-primary' : ''}>
              Zugewiesen
            </span>
            <span className={mandate.status === 'active' ? 'font-medium text-primary' : ''}>
              In Bearbeitung
            </span>
            <span className={mandate.status === 'closed' ? 'font-medium text-primary' : ''}>
              Abgeschlossen
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mandate Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Suchkriterien
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {(mandate.search_area as any)?.region || '–'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objektarten</p>
                <p className="font-medium">{getAssetFocusLabels(mandate.asset_focus)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">
                  {formatCurrency(mandate.price_min)} – {formatCurrency(mandate.price_max)}
                </p>
              </div>
              {mandate.yield_target && (
                <div>
                  <p className="text-sm text-muted-foreground">Zielrendite</p>
                  <p className="font-medium">{mandate.yield_target}%</p>
                </div>
              )}
            </div>
            {mandate.exclusions && (
              <div>
                <p className="text-sm text-muted-foreground">Ausschlüsse</p>
                <p className="text-sm">{mandate.exclusions}</p>
              </div>
            )}
            {mandate.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Hinweise</p>
                <p className="text-sm">{mandate.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!events || events.length === 0) ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Noch keine Aktivitäten
              </p>
            ) : (
              <div className="space-y-4 relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                
                {events.slice(0, 10).map((event) => {
                  const Icon = EVENT_ICONS[event.event_type] || Clock;
                  
                  return (
                    <div key={event.id} className="relative pl-8">
                      <div className="absolute left-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <Icon className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {(event.payload as any)?.message || event.event_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { locale: de, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager Contact Card (visible when assigned) */}
      {['assigned', 'active', 'paused', 'closed'].includes(mandate.status) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ihr Akquise-Manager
            </CardTitle>
            <CardDescription>
              Ihr persönlicher Ansprechpartner für dieses Suchmandat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mandate.assigned_manager_user_id ? (
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Akquise-Manager</p>
                  <p className="text-sm text-muted-foreground">
                    {mandate.status === 'assigned' && 'Warte auf Annahme des Mandats...'}
                    {mandate.status === 'active' && 'Aktiv an Ihrer Suche tätig'}
                    {mandate.status === 'paused' && 'Mandat pausiert'}
                    {mandate.status === 'closed' && 'Mandat abgeschlossen'}
                  </p>
                  {mandate.split_terms_confirmed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Angenommen: {format(new Date(mandate.split_terms_confirmed_at), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Ein Manager wird Ihnen in Kürze zugewiesen.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deliveries Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gefundene Objekte
          </CardTitle>
          <CardDescription>
            Hier sehen Sie die von Ihrem AkquiseManager gefundenen Objekte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Objekte präsentiert</p>
            <p className="text-sm">
              Ihr AkquiseManager wird passende Objekte hier für Sie bereitstellen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
