/**
 * Delivery Tab — Präsentation an Kunden
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, FileText, Building2, Loader2, CheckCircle2, 
  Clock, Eye, Download, ThumbsUp, ThumbsDown, Package
} from 'lucide-react';
import { 
  useAcqOffers, 
  useUpdateOfferStatus,
  type AcqOffer 
} from '@/hooks/useAcqOffers';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface DeliveryTabProps {
  mandateId: string;
  mandateCode: string;
  clientName?: string;
}

const STATUS_FLOW = ['analyzed', 'presented', 'accepted', 'rejected'] as const;

export function DeliveryTab({ mandateId, mandateCode, clientName }: DeliveryTabProps) {
  const { data: allOffers = [], isLoading } = useAcqOffers(mandateId);
  const updateStatus = useUpdateOfferStatus();
  
  const [selectedOffer, setSelectedOffer] = React.useState<AcqOffer | null>(null);
  const [showPresentDialog, setShowPresentDialog] = React.useState(false);
  const [presentationNotes, setPresentationNotes] = React.useState('');

  // Filter for offers ready for delivery (analyzed or presented)
  const readyOffers = allOffers.filter(o => ['analyzed', 'presented'].includes(o.status));
  const presentedOffers = allOffers.filter(o => o.status === 'presented');
  const acceptedOffers = allOffers.filter(o => o.status === 'accepted');
  const rejectedOffers = allOffers.filter(o => o.status === 'rejected');

  const handlePresent = async () => {
    if (!selectedOffer) return;
    
    await updateStatus.mutateAsync({
      offerId: selectedOffer.id,
      status: 'presented',
    });
    
    toast.success('Objekt als präsentiert markiert');
    setShowPresentDialog(false);
    setSelectedOffer(null);
    setPresentationNotes('');
  };

  const handleAccept = async (offerId: string) => {
    await updateStatus.mutateAsync({ offerId, status: 'accepted' });
    toast.success('Objekt vom Kunden akzeptiert');
  };

  const handleReject = async (offerId: string) => {
    await updateStatus.mutateAsync({ offerId, status: 'rejected' });
    toast.success('Objekt vom Kunden abgelehnt');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Delivery</h2>
          <p className="text-sm text-muted-foreground">
            Objekte an {clientName || 'Mandant'} präsentieren
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{readyOffers.length}</div>
            <div className="text-sm text-muted-foreground">Bereit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{presentedOffers.length}</div>
            <div className="text-sm text-muted-foreground">Präsentiert</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{acceptedOffers.length}</div>
            <div className="text-sm text-muted-foreground">Akzeptiert</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{rejectedOffers.length}</div>
            <div className="text-sm text-muted-foreground">Abgelehnt</div>
          </CardContent>
        </Card>
      </div>

      {/* Ready to Present */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Analysierte Objekte
          </CardTitle>
          <CardDescription>Diese Objekte können dem Kunden präsentiert werden.</CardDescription>
        </CardHeader>
        <CardContent>
          {readyOffers.filter(o => o.status === 'analyzed').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine analysierten Objekte bereit.</p>
              <p className="text-sm mt-1">Führen Sie zuerst Analysen im Analyse-Tab durch.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {readyOffers.filter(o => o.status === 'analyzed').map(offer => (
                <DeliveryOfferCard 
                  key={offer.id}
                  offer={offer}
                  onPresent={() => { setSelectedOffer(offer); setShowPresentDialog(true); }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Presented - Awaiting Feedback */}
      {presentedOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Warten auf Feedback
            </CardTitle>
            <CardDescription>Diese Objekte wurden präsentiert und warten auf Kundenentscheidung.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {presentedOffers.map(offer => (
                <PresentedOfferCard 
                  key={offer.id}
                  offer={offer}
                  onAccept={() => handleAccept(offer.id)}
                  onReject={() => handleReject(offer.id)}
                  isLoading={updateStatus.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accepted */}
      {acceptedOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Akzeptierte Objekte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acceptedOffers.map(offer => (
                <CompletedOfferCard key={offer.id} offer={offer} status="accepted" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected */}
      {rejectedOffers.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <ThumbsDown className="h-5 w-5" />
              Abgelehnte Objekte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 opacity-60">
              {rejectedOffers.map(offer => (
                <CompletedOfferCard key={offer.id} offer={offer} status="rejected" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Present Dialog */}
      <Dialog open={showPresentDialog} onOpenChange={setShowPresentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Objekt präsentieren</DialogTitle>
            <DialogDescription>
              Markieren Sie dieses Objekt als präsentiert.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="py-4 space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{selectedOffer.title}</div>
                      {selectedOffer.address && (
                        <div className="text-sm text-muted-foreground">
                          {selectedOffer.address}, {selectedOffer.postal_code} {selectedOffer.city}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedOffer.price_asking && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      Kaufpreis: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(selectedOffer.price_asking)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notizen zur Präsentation (optional)</label>
                <Textarea 
                  value={presentationNotes}
                  onChange={e => setPresentationNotes(e.target.value)}
                  placeholder="z.B. Per E-Mail gesendet, telefonisch besprochen..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPresentDialog(false)}>Abbrechen</Button>
            <Button onClick={handlePresent} disabled={updateStatus.isPending}>
              {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Send className="h-4 w-4 mr-2" />
              Als präsentiert markieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Delivery Card for analyzed offers
function DeliveryOfferCard({ offer, onPresent }: { offer: AcqOffer; onPresent: () => void }) {
  const hasCalc = offer.calc_bestand || offer.calc_aufteiler;
  const hasGeo = offer.geomap_data;
  const hasAI = offer.analysis_summary;
  
  // Calculate a "readiness" score
  const readinessScore = [hasCalc, hasGeo, hasAI].filter(Boolean).length;
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <div className="font-medium">{offer.title || 'Ohne Titel'}</div>
          <div className="text-sm text-muted-foreground">
            {offer.price_asking 
              ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(offer.price_asking)
              : 'Kein Preis'
            }
            {offer.units_count && ` • ${offer.units_count} Einheiten`}
          </div>
          <div className="flex gap-1 mt-1">
            {hasCalc && <Badge variant="outline" className="text-xs">Kalkulation</Badge>}
            {hasGeo && <Badge variant="outline" className="text-xs">GeoMap</Badge>}
            {hasAI && <Badge variant="outline" className="text-xs">KI-Analyse</Badge>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-sm text-muted-foreground">
          {readinessScore}/3 Analysen
        </div>
        <Button onClick={onPresent}>
          <Send className="h-4 w-4 mr-2" />
          Präsentieren
        </Button>
      </div>
    </div>
  );
}

// Presented Card awaiting feedback
function PresentedOfferCard({ offer, onAccept, onReject, isLoading }: { offer: AcqOffer; onAccept: () => void; onReject: () => void; isLoading: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-blue-50/50">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
          <Eye className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <div className="font-medium">{offer.title || 'Ohne Titel'}</div>
          <div className="text-sm text-muted-foreground">
            {offer.price_asking 
              ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(offer.price_asking)
              : 'Kein Preis'
            }
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Präsentiert {formatDistanceToNow(new Date(offer.updated_at), { locale: de, addSuffix: true })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReject} disabled={isLoading}>
          <ThumbsDown className="h-4 w-4 mr-1" />
          Abgelehnt
        </Button>
        <Button size="sm" onClick={onAccept} disabled={isLoading}>
          <ThumbsUp className="h-4 w-4 mr-1" />
          Akzeptiert
        </Button>
      </div>
    </div>
  );
}

// Completed Card
function CompletedOfferCard({ offer, status }: { offer: AcqOffer; status: 'accepted' | 'rejected' }) {
  const isAccepted = status === 'accepted';
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${isAccepted ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isAccepted ? 'bg-green-100' : 'bg-gray-100'}`}>
          {isAccepted ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <ThumbsDown className="h-5 w-5 text-gray-400" />}
        </div>
        <div>
          <div className="font-medium">{offer.title || 'Ohne Titel'}</div>
          <div className="text-sm text-muted-foreground">
            {offer.price_asking 
              ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(offer.price_asking)
              : 'Kein Preis'
            }
          </div>
        </div>
      </div>
      <Badge variant={isAccepted ? 'default' : 'secondary'}>
        {isAccepted ? 'Akzeptiert' : 'Abgelehnt'}
      </Badge>
    </div>
  );
}
