import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Trophy, Phone, Mail, Globe, Building2, Calendar, 
  FileText, Check, Loader2, Euro, AlertCircle
} from 'lucide-react';
import { useServiceCaseProviders, useAwardProvider, useUpdateInboundOffer, ServiceCaseProvider } from '@/hooks/useServiceCaseInbound';
import { ServiceCase } from '@/hooks/useServiceCases';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

// ============================================================================
// Props
// ============================================================================
interface OffersComparisonPanelProps {
  serviceCase: ServiceCase;
  onAwardComplete?: () => void;
}

// ============================================================================
// Component
// ============================================================================
export function OffersComparisonPanel({ 
  serviceCase, 
  onAwardComplete 
}: OffersComparisonPanelProps) {
  const { data: providers, isLoading } = useServiceCaseProviders(serviceCase.id);
  const awardProvider = useAwardProvider();
  const updateOffer = useUpdateInboundOffer();
  
  const [selectedProvider, setSelectedProvider] = useState<ServiceCaseProvider | null>(null);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [awardNotes, setAwardNotes] = useState('');
  const [offerEditId, setOfferEditId] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState('');

  // Get providers with offers
  const providersWithOffers = providers?.filter(p => p.offer_amount_cents) || [];
  const providersWithoutOffers = providers?.filter(p => !p.offer_amount_cents) || [];
  
  // Find lowest offer
  const lowestOffer = providersWithOffers.length > 0
    ? Math.min(...providersWithOffers.map(p => p.offer_amount_cents!))
    : null;

  const handleAward = async () => {
    if (!selectedProvider) return;
    
    await awardProvider.mutateAsync({
      providerId: selectedProvider.id,
      serviceCaseId: serviceCase.id,
      awardNotes,
    });
    
    setAwardDialogOpen(false);
    setSelectedProvider(null);
    setAwardNotes('');
    onAwardComplete?.();
  };

  const formatOfferAmount = (cents: number | null) => {
    if (cents === null) return '—';
    return formatCurrency(cents / 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Angebotsvergleich</CardTitle>
          <CardDescription>Noch keine Dienstleister angeschrieben</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center border border-dashed rounded-lg">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">Keine Anbieter vorhanden</p>
            <p className="text-sm text-muted-foreground mt-1">
              Suchen und kontaktieren Sie Dienstleister im Ausschreibungs-Tab
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Angebotsvergleich
                <Badge variant="outline">{providers.length} Anbieter</Badge>
              </CardTitle>
              <CardDescription>
                {providersWithOffers.length} Angebote eingegangen
                {lowestOffer && ` • Niedrigstes: ${formatOfferAmount(lowestOffer)}`}
              </CardDescription>
            </div>
            {serviceCase.status === 'awarded' && (
              <Badge className="bg-primary">
                <Trophy className="h-3 w-3 mr-1" />
                Vergeben
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anbieter</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead className="text-right">Angebot</TableHead>
                <TableHead>Gültig bis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => {
                const isLowest = provider.offer_amount_cents === lowestOffer && lowestOffer !== null;
                const isAwarded = provider.is_awarded;
                
                return (
                  <TableRow 
                    key={provider.id}
                    className={isAwarded ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isAwarded && <Trophy className="h-4 w-4 text-primary" />}
                        <div>
                          <p className="font-medium">{provider.provider_name}</p>
                          {provider.provider_address && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {provider.provider_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {provider.provider_email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {provider.provider_email}
                          </span>
                        )}
                        {provider.provider_phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {provider.provider_phone}
                          </span>
                        )}
                        {provider.provider_website && (
                          <a 
                            href={provider.provider_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {offerEditId === provider.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Input
                            type="number"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            className="w-24 text-right"
                            placeholder="0"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updateOffer.isPending}
                            onClick={async () => {
                              const cents = Math.round(parseFloat(offerAmount || '0') * 100);
                              await updateOffer.mutateAsync({
                                inboundId: provider.id,
                                offer_amount_cents: cents,
                              });
                              setOfferEditId(null);
                              toast.success('Angebotsbetrag gespeichert');
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer"
                          onClick={() => {
                            setOfferEditId(provider.id);
                            setOfferAmount(provider.offer_amount_cents 
                              ? (provider.offer_amount_cents / 100).toString() 
                              : ''
                            );
                          }}
                        >
                          {provider.offer_amount_cents ? (
                            <span className={`font-medium ${isLowest ? 'text-primary' : ''}`}>
                              {formatOfferAmount(provider.offer_amount_cents)}
                              {isLowest && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Günstigster
                                </Badge>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Eingeben...
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {provider.offer_valid_until ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(provider.offer_valid_until), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAwarded ? (
                        <Badge>Beauftragt</Badge>
                      ) : provider.response_received ? (
                        <Badge variant="secondary">Angebot erhalten</Badge>
                      ) : provider.email_sent_at ? (
                        <Badge variant="outline">Angeschrieben</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Ausstehend
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isAwarded && serviceCase.status !== 'awarded' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setAwardDialogOpen(true);
                          }}
                          disabled={!provider.offer_amount_cents}
                        >
                          <Trophy className="h-4 w-4 mr-1" />
                          Vergeben
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {providersWithoutOffers.length > 0 && providersWithOffers.length > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {providersWithoutOffers.length} Anbieter haben noch kein Angebot abgegeben
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Award Confirmation Dialog */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auftrag vergeben</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedProvider && (
              <>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="font-medium">{selectedProvider.provider_name}</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatOfferAmount(selectedProvider.offer_amount_cents)}
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {selectedProvider.provider_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedProvider.provider_email}
                      </span>
                    )}
                    {selectedProvider.provider_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedProvider.provider_phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Anmerkungen zur Vergabe (optional)</Label>
                  <Textarea
                    value={awardNotes}
                    onChange={(e) => setAwardNotes(e.target.value)}
                    placeholder="z.B. Startzeitpunkt, besondere Vereinbarungen..."
                    rows={3}
                  />
                </div>

                <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg">
                  <p className="text-sm">
                    <strong>Hinweis:</strong> Nach der Vergabe wird der Status des Vorgangs 
                    auf "Vergeben" gesetzt. Eine Bestätigungs-E-Mail kann im nächsten Schritt 
                    versendet werden.
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleAward}
              disabled={awardProvider.isPending}
            >
              {awardProvider.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Auftrag vergeben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
