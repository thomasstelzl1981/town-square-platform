import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download, 
  ExternalLink,
  Home,
  Megaphone
} from 'lucide-react';

interface RentalPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: {
    id: string;
    cold_rent: number | null;
    warm_rent: number | null;
    utilities_estimate: number | null;
    available_from: string | null;
    description?: string;
    properties?: {
      address?: string;
      code?: string;
    } | null;
    units?: {
      area_sqm?: number | null;
    } | null;
    rental_publications?: {
      channel: string;
      status: string;
      external_url?: string;
    }[];
  } | null;
  channel: 'scout24' | 'kleinanzeigen';
  onSuccess: () => void;
}

export function RentalPublishDialog({
  open,
  onOpenChange,
  listing,
  channel,
  onSuccess
}: RentalPublishDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [step, setStep] = useState<'preview' | 'publish' | 'done'>('preview');

  const existingPublication = listing?.rental_publications?.find(
    p => p.channel === channel
  );

  const generateExposeText = () => {
    if (!listing) return '';
    
    const lines = [
      `🏠 ${listing.properties?.address || 'Mietwohnung'}`,
      '',
      listing.units?.area_sqm ? `📐 Wohnfläche: ${listing.units.area_sqm} m²` : '',
      listing.cold_rent ? `💰 Kaltmiete: ${listing.cold_rent.toLocaleString('de-DE')} €` : '',
      listing.utilities_estimate ? `📊 Nebenkosten: ${listing.utilities_estimate.toLocaleString('de-DE')} €` : '',
      listing.warm_rent ? `💵 Warmmiete: ${listing.warm_rent.toLocaleString('de-DE')} €` : '',
      listing.available_from ? `📅 Verfügbar ab: ${new Date(listing.available_from).toLocaleDateString('de-DE')}` : '',
      '',
      listing.description || '',
      '',
      '—',
      'Kontaktieren Sie uns für eine Besichtigung!'
    ].filter(Boolean);
    
    return lines.join('\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateExposeText());
    toast({ title: 'Text kopiert!' });
  };

  const handleScout24Publish = async () => {
    if (!listing) return;
    
    setIsSubmitting(true);
    try {
      // Get tenant_id from listing via property
      const { data: propertyData } = await supabase
        .from('properties')
        .select('tenant_id')
        .eq('id', listing.properties?.code ? listing.id : listing.id)
        .single();

      // For now, we create a draft publication record
      // In Phase 2, this would call the Scout24 API
      const { error } = await supabase
        .from('rental_publications')
        .upsert({
          tenant_id: propertyData?.tenant_id,
          rental_listing_id: listing.id,
          channel: 'scout24',
          status: 'draft',
          published_at: new Date().toISOString()
        }, {
          onConflict: 'rental_listing_id,channel'
        });

      if (error) throw error;

      toast({ 
        title: 'Scout24-Integration',
        description: 'Die Scout24 API-Integration wird in Phase 2 aktiviert. Das Inserat wurde als Entwurf gespeichert.'
      });
      setStep('done');
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKleinanzeigenSave = async () => {
    if (!listing || !externalUrl) return;
    
    setIsSubmitting(true);
    try {
      // Get tenant_id
      const { data: listingData } = await supabase
        .from('rental_listings')
        .select('tenant_id')
        .eq('id', listing.id)
        .single();

      const { error } = await supabase
        .from('rental_publications')
        .upsert({
          tenant_id: listingData?.tenant_id,
          rental_listing_id: listing.id,
          channel: 'kleinanzeigen',
          status: 'published',
          external_url: externalUrl,
          published_at: new Date().toISOString()
        }, {
          onConflict: 'rental_listing_id,channel'
        });

      if (error) throw error;

      toast({ title: 'Kleinanzeigen-Link gespeichert' });
      setStep('done');
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderScout24Content = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="h-4 w-4" />
            ImmobilienScout24
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">API-Integration</Badge>
            <Badge variant="secondary">Phase 2</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Die direkte Veröffentlichung bei ImmobilienScout24 erfordert API-Credentials.
            Diese Integration wird in Phase 2 freigeschaltet.
          </p>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs font-medium mb-2">Exposé-Vorschau:</p>
            <div className="text-xs space-y-1">
              <p><strong>Adresse:</strong> {listing?.properties?.address || '—'}</p>
              <p><strong>Fläche:</strong> {listing?.units?.area_sqm || '—'} m²</p>
              <p><strong>Kaltmiete:</strong> {listing?.cold_rent?.toLocaleString('de-DE') || '—'} €</p>
              <p><strong>Warmmiete:</strong> {listing?.warm_rent?.toLocaleString('de-DE') || '—'} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleScout24Publish} disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Als Entwurf speichern
      </Button>
    </div>
  );

  const renderKleinanzeigenContent = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Kleinanzeigen Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kopieren Sie den Anzeigentext und die Bilder, um sie manuell bei Kleinanzeigen einzustellen.
          </p>

          {/* Text Export */}
          <div className="space-y-2">
            <Label>Anzeigentext</Label>
            <Textarea
              value={generateExposeText()}
              readOnly
              rows={8}
              className="font-mono text-xs"
            />
            <Button variant="outline" size="sm" onClick={handleCopyText}>
              <Copy className="h-4 w-4 mr-2" />
              Text kopieren
            </Button>
          </div>

          {/* Image Export */}
          <div className="space-y-2">
            <Label>Bilder</Label>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Bilder als ZIP herunterladen
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </Button>
          </div>

          {/* External URL */}
          <div className="space-y-2 pt-2 border-t">
            <Label>Anzeigen-Link eintragen</Label>
            <p className="text-xs text-muted-foreground">
              Nachdem Sie die Anzeige bei Kleinanzeigen erstellt haben, tragen Sie hier den Link ein.
            </p>
            <Input
              placeholder="https://www.kleinanzeigen.de/s-anzeige/..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleKleinanzeigenSave} 
        disabled={isSubmitting || !externalUrl} 
        className="w-full"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Link speichern
      </Button>
    </div>
  );

  const renderDoneContent = () => (
    <div className="text-center py-6 space-y-4">
      <CheckCircle2 className="h-12 w-12 text-status-success mx-auto" />
      <div>
        <p className="font-medium">Erfolgreich gespeichert!</p>
        <p className="text-sm text-muted-foreground">
          {channel === 'scout24' 
            ? 'Das Inserat wurde als Entwurf für Scout24 gespeichert.'
            : 'Der Kleinanzeigen-Link wurde gespeichert.'}
        </p>
      </div>
      {existingPublication?.external_url && (
        <Button variant="outline" asChild>
          <a href={existingPublication.external_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Anzeige öffnen
          </a>
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channel === 'scout24' ? (
              <><Home className="h-5 w-5" /> ImmobilienScout24</>
            ) : (
              <><Megaphone className="h-5 w-5" /> Kleinanzeigen</>
            )}
          </DialogTitle>
          <DialogDescription>
            {listing?.properties?.address || 'Vermietungsinserat'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'done' 
            ? renderDoneContent()
            : channel === 'scout24' 
              ? renderScout24Content() 
              : renderKleinanzeigenContent()
          }
        </div>

        {step === 'done' && (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
