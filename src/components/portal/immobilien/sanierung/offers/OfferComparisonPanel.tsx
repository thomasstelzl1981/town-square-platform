import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SmartDropZone } from '@/components/shared/SmartDropZone';
import { 
  BarChart3, Loader2, Trash2, Award, FileText, CheckCircle2 
} from 'lucide-react';
import { ServiceCase } from '@/hooks/useServiceCases';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

interface OfferComparisonPanelProps {
  serviceCase: ServiceCase;
}

interface OfferPosition {
  description: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total?: number;
}

interface Offer {
  id: string;
  provider_name: string | null;
  provider_email: string | null;
  file_name: string | null;
  file_path: string | null;
  total_net: number | null;
  total_gross: number | null;
  positions: OfferPosition[];
  conditions: string | null;
  valid_until: string | null;
  extracted_at: string | null;
  status: string;
  created_at: string;
}

export function OfferComparisonPanel({ serviceCase }: OfferComparisonPanelProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [extractingIds, setExtractingIds] = useState<Set<string>>(new Set());

  // Load existing offers
  useEffect(() => {
    loadOffers();
  }, [serviceCase.id]);

  const loadOffers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('service_case_offers')
      .select('*')
      .eq('service_case_id', serviceCase.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading offers:', error);
    } else {
      setOffers((data || []).map(d => ({
        ...d,
        positions: Array.isArray(d.positions) ? d.positions as unknown as OfferPosition[] : [],
      })));
    }
    setIsLoading(false);
  };

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      try {
        const storagePath = `${serviceCase.tenant_id}/sanierung/${serviceCase.id}/offers/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('tenant-documents')
          .upload(storagePath, file);

        if (uploadError) {
          if (uploadError.message?.includes('Bucket not found')) {
            toast.error('Storage-Bucket nicht gefunden. Bitte kontaktieren Sie den Support.');
            continue;
          }
          throw uploadError;
        }

        const { data: offer, error: insertError } = await supabase
          .from('service_case_offers')
          .insert({
            service_case_id: serviceCase.id,
            tenant_id: serviceCase.tenant_id,
            file_path: storagePath,
            file_name: file.name,
            status: 'received',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setOffers(prev => [...prev, { ...offer, positions: [] }]);

        if (offer) {
          extractOffer(offer.id, storagePath, file.name);
        }

        toast.success(`"${file.name}" hochgeladen`);
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Fehler beim Hochladen von "${file.name}"`);
      }
    }
    setIsUploading(false);
  };

  const extractOffer = async (offerId: string, filePath: string, fileName: string) => {
    setExtractingIds(prev => new Set(prev).add(offerId));

    try {
      const { data, error } = await supabase.functions.invoke('sot-extract-offer', {
        body: {
          offer_id: offerId,
          file_path: filePath,
          file_name: fileName,
          service_case_id: serviceCase.id,
        }
      });

      if (error) throw error;

      await loadOffers();
      toast.success('Angebot ausgelesen');
    } catch (err) {
      console.error('Extraction error:', err);
      toast.error('KI-Auswertung fehlgeschlagen');
    } finally {
      setExtractingIds(prev => {
        const next = new Set(prev);
        next.delete(offerId);
        return next;
      });
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    const { error } = await supabase
      .from('service_case_offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      setOffers(prev => prev.filter(o => o.id !== offerId));
      toast.success('Angebot entfernt');
    }
  };

  const handleAwardOffer = async (offerId: string) => {
    const { error: rejectError } = await supabase
      .from('service_case_offers')
      .update({ status: 'rejected' })
      .eq('service_case_id', serviceCase.id);

    if (rejectError) {
      toast.error('Fehler bei der Vergabe');
      return;
    }

    const { error: acceptError } = await supabase
      .from('service_case_offers')
      .update({ status: 'accepted' })
      .eq('id', offerId);

    if (acceptError) {
      toast.error('Fehler bei der Vergabe');
    } else {
      await loadOffers();
      toast.success('Zuschlag erteilt!');
    }
  };

  // Derived data
  const allPositions = Array.from(
    new Set(offers.flatMap(o => o.positions.map(p => p.description)).filter(Boolean))
  );

  const extractedOffers = offers.filter(o => o.extracted_at);
  const hasOffers = offers.length > 0;
  const hasExtracted = extractedOffers.length > 0;
  const awardedOffer = offers.find(o => o.status === 'accepted');

  const cheapestId = extractedOffers.length > 1
    ? extractedOffers.reduce((cheapest, offer) => {
        const total = offer.total_gross || offer.total_net || Infinity;
        const cheapestTotal = cheapest.total_gross || cheapest.total_net || Infinity;
        return (total < cheapestTotal) ? offer : cheapest;
      }, extractedOffers[0])?.id
    : null;

  // Placeholder columns for empty state
  const placeholderProviders = ['Anbieter 1', 'Anbieter 2', 'Anbieter 3'];
  const placeholderPositions = ['Position 1', 'Position 2', 'Position 3', 'Position 4'];

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Angebotsvergleich</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Angebote hochladen, auswerten und vergleichen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {offers.length} Angebot{offers.length !== 1 ? 'e' : ''}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {extractedOffers.length} ausgewertet
              </Badge>
              {awardedOffer && (
                <Badge className="text-xs bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {awardedOffer.provider_name || 'Vergeben'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Uploaded Offers List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Hochgeladene Angebote
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : hasOffers ? (
            offers.map(offer => (
              <div key={offer.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{offer.file_name}</p>
                    {offer.provider_name && (
                      <p className="text-xs text-muted-foreground">{offer.provider_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {extractingIds.has(offer.id) ? (
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      KI liest aus…
                    </Badge>
                  ) : offer.extracted_at ? (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Ausgewertet
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Hochgeladen</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteOffer(offer.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Noch keine Angebote hochgeladen</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Upload Area (compact) */}
      <Card>
        <CardContent className="p-4">
          <SmartDropZone
            onFiles={handleFilesSelected}
            disabled={isUploading}
            accept={{
              'application/pdf': ['.pdf'],
              'image/*': ['.jpg', '.jpeg', '.png'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
            }}
            formatsLabel="PDF, Bilder, Excel"
            variant="primary"
          />
        </CardContent>
      </Card>

      {/* 4. Comparison Table (always visible) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Vergleichstabelle
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Position</TableHead>
                  {hasExtracted
                    ? extractedOffers.map(offer => (
                        <TableHead key={offer.id} className="min-w-[140px] text-center">
                          <div className="space-y-1">
                            <span className={`font-medium ${offer.id === cheapestId ? 'text-green-600' : ''}`}>
                              {offer.provider_name || offer.file_name}
                            </span>
                            {offer.id === cheapestId && (
                              <Badge variant="secondary" className="block text-[10px] bg-green-100 text-green-700">
                                Günstigster
                              </Badge>
                            )}
                            {offer.status === 'accepted' && (
                              <Badge className="block text-[10px]">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                Zuschlag
                              </Badge>
                            )}
                          </div>
                        </TableHead>
                      ))
                    : placeholderProviders.map(name => (
                        <TableHead key={name} className="min-w-[140px] text-center">
                          <span className="font-medium text-muted-foreground/50">{name}</span>
                        </TableHead>
                      ))
                  }
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasExtracted && allPositions.length > 0
                  ? allPositions.map((posDesc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-sm">{posDesc}</TableCell>
                        {extractedOffers.map(offer => {
                          const pos = offer.positions.find(p => p.description === posDesc);
                          return (
                            <TableCell key={offer.id} className="text-center text-sm">
                              {pos?.total ? formatCurrency(pos.total / 100) : '—'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  : hasExtracted && allPositions.length === 0
                    ? (
                      <TableRow>
                        <TableCell className="text-sm text-muted-foreground">Gesamt</TableCell>
                        {extractedOffers.map(offer => (
                          <TableCell key={offer.id} className="text-center text-sm font-medium">
                            {offer.total_gross ? formatCurrency(offer.total_gross / 100) :
                             offer.total_net ? formatCurrency(offer.total_net / 100) : '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                    : placeholderPositions.map((pos, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm text-muted-foreground/50 border-dashed">{pos}</TableCell>
                          {placeholderProviders.map(prov => (
                            <TableCell key={prov} className="text-center text-muted-foreground/30 border-dashed">
                              —
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                }
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Gesamt (brutto)</TableCell>
                  {hasExtracted
                    ? extractedOffers.map(offer => (
                        <TableCell key={offer.id} className={`text-center font-semibold ${offer.id === cheapestId ? 'text-green-600' : ''}`}>
                          {offer.total_gross ? formatCurrency(offer.total_gross / 100) :
                           offer.total_net ? formatCurrency(offer.total_net / 100) : '—'}
                        </TableCell>
                      ))
                    : placeholderProviders.map(prov => (
                        <TableCell key={prov} className="text-center text-muted-foreground/30 border-dashed">
                          —
                        </TableCell>
                      ))
                  }
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Award Actions (always visible) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Vergabe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasExtracted ? (
            <div className="flex flex-wrap gap-2">
              {extractedOffers.map(offer => (
                <Button
                  key={offer.id}
                  variant={offer.status === 'accepted' ? 'default' : 'outline'}
                  size="sm"
                  disabled={offer.status === 'accepted'}
                  onClick={() => handleAwardOffer(offer.id)}
                >
                  <Award className="h-3.5 w-3.5 mr-1.5" />
                  {offer.status === 'accepted'
                    ? `${offer.provider_name || 'Anbieter'} — Zuschlag erteilt`
                    : `Zuschlag: ${offer.provider_name || offer.file_name}`}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled>
                <Award className="h-3.5 w-3.5 mr-1.5" />
                Zuschlag erteilen
              </Button>
              <p className="text-xs text-muted-foreground">
                Laden Sie mindestens ein Angebot hoch
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
