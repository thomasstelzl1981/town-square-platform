/**
 * R-2: Publish sidebar — Status, Partner Release, Kaufy, IS24
 */
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  FileCheck, Globe, Users, Lock, Euro,
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { IS24PublicationStatus } from './IS24PublicationStatus';
import { formatCurrency, type ExposeFormData, type PropertyData, type UnitData, type ListingData, type PublicationData } from './exposeTypes';

interface ExposePublishSidebarProps {
  listing: ListingData | null;
  property: PropertyData;
  unit: UnitData;
  formData: ExposeFormData;
  publications: PublicationData[];
  hasPartnerRelease: boolean;
  isKaufyActive: boolean;
  canEnableKaufy: boolean;
  onPartnerReleaseOpen: () => void;
  onKaufyToggle: (enabled: boolean) => void;
  kaufyTogglePending: boolean;
  grossYield: number;
  annualRent: number;
  pricePerSqm: number;
}

export function ExposePublishSidebar({
  listing,
  property,
  unit,
  formData,
  publications,
  hasPartnerRelease,
  isKaufyActive,
  canEnableKaufy,
  onPartnerReleaseOpen,
  onKaufyToggle,
  kaufyTogglePending,
  grossYield,
  annualRent,
  pricePerSqm,
}: ExposePublishSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className={listing?.status === 'draft' ? 'border-primary/30 bg-primary/5' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            {listing?.status === 'draft' ? 'Exposé freigeben' : 'Veröffentlichung'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {listing?.status === 'draft' ? (
            <DraftContent formData={formData} propertyId={property.id} />
          ) : (
            <ActiveContent
              hasPartnerRelease={hasPartnerRelease}
              isKaufyActive={isKaufyActive}
              canEnableKaufy={canEnableKaufy}
              onPartnerReleaseOpen={onPartnerReleaseOpen}
              onKaufyToggle={onKaufyToggle}
              kaufyTogglePending={kaufyTogglePending}
              listing={listing}
              formData={formData}
              property={property}
              unit={unit}
            />
          )}
        </CardContent>
      </Card>

      {/* Fee Summary */}
      {hasPartnerRelease && (
        <Card className="bg-secondary/50 border-secondary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Euro className="h-5 w-5 text-secondary-foreground flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Ihre Kosten bei Erfolg</p>
                <p className="text-muted-foreground mt-1">
                  100 € (Notarauftrag) + 1.900 € (BNL) = <strong>2.000 €</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Kennzahlen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Kaufpreis" value={formatCurrency(parseFloat(formData.asking_price) || property.market_value)} />
          <StatRow label="Preis/m²" value={formatCurrency(pricePerSqm)} />
          <StatRow label="Jahresmiete" value={formatCurrency(annualRent)} />
          <Separator className="my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bruttorendite</span>
            <span className="font-bold text-primary">{grossYield.toFixed(2)}%</span>
          </div>
          <StatRow label="Käufer-Provision" value={`${formData.commission_rate[0].toFixed(1)}% netto`} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function DraftContent({ formData, propertyId }: { formData: ExposeFormData; propertyId: string }) {
  return (
    <>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Verkaufsauftrag nicht erteilt. Bitte aktivieren Sie den Verkaufsauftrag im{' '}
          <Link 
            to={`/portal/immobilien/${propertyId}?tab=verkaufsauftrag`}
            className="text-primary hover:underline font-medium"
          >
            Immobilien-Dossier → Verkaufsauftrag
          </Link>.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2 p-3 bg-muted rounded-lg border">
        <p className="text-xs font-medium text-muted-foreground uppercase">Exposé-Status</p>
        <div className="space-y-2 text-sm">
          <CheckItem label="Titel vorhanden" checked={!!formData.title} />
          <CheckItem label="Kaufpreis angegeben" checked={!!formData.asking_price} />
          <CheckItem label="Beschreibung vorhanden" checked={!!formData.description} />
        </div>
      </div>
    </>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
      <span className={checked ? '' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}

function ActiveContent({
  hasPartnerRelease,
  isKaufyActive,
  canEnableKaufy,
  onPartnerReleaseOpen,
  onKaufyToggle,
  kaufyTogglePending,
  listing,
  formData,
  property,
  unit,
}: {
  hasPartnerRelease: boolean;
  isKaufyActive: boolean;
  canEnableKaufy: boolean;
  onPartnerReleaseOpen: () => void;
  onKaufyToggle: (enabled: boolean) => void;
  kaufyTogglePending: boolean;
  listing: ListingData | null;
  formData: ExposeFormData;
  property: PropertyData;
  unit: UnitData;
}) {
  return (
    <>
      {/* Partner Release */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">Partner-Netzwerk</span>
          </div>
          {hasPartnerRelease ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Aktiv
            </Badge>
          ) : (
            <Badge variant="secondary">Inaktiv</Badge>
          )}
        </div>
        
        {!hasPartnerRelease ? (
          <>
            <p className="text-xs text-muted-foreground">
              Pflichtschritt: Aktivieren Sie die Partner-Freigabe für alle weiteren Kanäle.
            </p>
            <Button 
              variant="default" 
              className="w-full"
              onClick={onPartnerReleaseOpen}
            >
              <Users className="h-4 w-4 mr-2" />
              Partner-Freigabe starten
            </Button>
          </>
        ) : (
          <p className="text-xs text-primary">
            ✓ Objekt ist im Objektkatalog für Vertriebspartner sichtbar
          </p>
        )}
      </div>

      <Separator />

      {/* Kaufy Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="font-medium">Kaufy-Marktplatz</span>
          </div>
          <Switch
            checked={isKaufyActive}
            onCheckedChange={(checked) => onKaufyToggle(checked)}
            disabled={!canEnableKaufy || kaufyTogglePending}
          />
        </div>
        
        {!canEnableKaufy ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Erst nach Partner-Freigabe verfügbar
          </p>
        ) : isKaufyActive ? (
          <p className="text-xs text-primary">
            ✓ Objekt ist auf kaufy.de öffentlich sichtbar
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Auf dem öffentlichen Marktplatz veröffentlichen
          </p>
        )}
      </div>

      <Separator />

      {/* Scout24 Live Status */}
      <IS24PublicationStatus
        listingId={listing?.id}
        tenantId={listing?.tenant_id}
        propertyData={{
          title: formData.title,
          asking_price: parseFloat(formData.asking_price) || 0,
          description: formData.description,
          commission_rate: formData.commission_rate[0],
          street: property?.address || '',
          postal_code: property?.postal_code || '',
          city: property?.city || '',
          area_sqm: unit?.area_sqm || 0,
          year_built: property?.year_built || undefined,
        }}
      />
    </>
  );
}
