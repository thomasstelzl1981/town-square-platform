import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUploader } from '@/components/shared/FileUploader';
import { 
  Upload, BarChart3, Loader2, Trash2, Award, FileText, AlertCircle, CheckCircle2 
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

  // Upload and extract offer
  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      try {
        // Upload to storage
        const storagePath = `${serviceCase.tenant_id}/sanierung/${serviceCase.id}/offers/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('tenant-documents')
          .upload(storagePath, file);

        if (uploadError) {
          // Try creating bucket first
          if (uploadError.message?.includes('Bucket not found')) {
            toast.error('Storage-Bucket nicht gefunden. Bitte kontaktieren Sie den Support.');
            continue;
          }
          throw uploadError;
        }

        // Create offer record
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

        // Add to local state
        setOffers(prev => [...prev, { ...offer, positions: [] }]);

        // Trigger AI extraction
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

      // Reload offers to get extracted data
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
    // Set all to rejected, then set the chosen one to accepted
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

  // Gather all unique position descriptions across offers
  const allPositions = Array.from(
    new Set(offers.flatMap(o => o.positions.map(p => p.description)).filter(Boolean))
  );

  const extractedOffers = offers.filter(o => o.extracted_at);
  const pendingOffers = offers.filter(o => !o.extracted_at);

  // Find cheapest offer
  const cheapestId = extractedOffers.length > 1
    ? extractedOffers.reduce((cheapest, offer) => {
        const total = offer.total_gross || offer.total_net || Infinity;
        const cheapestTotal = cheapest.total_gross || cheapest.total_net || Infinity;
        return (total < cheapestTotal) ? offer : cheapest;
      }, extractedOffers[0])?.id
    : null;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Angebote hochladen
          </CardTitle>
          <CardDescription>
            Laden Sie die erhaltenen Angebote als PDF, Bild oder Excel hoch — die KI liest sie automatisch aus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
            multiple
            disabled={isUploading}
          >
            <div className="text-center">
              {isUploading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Wird hochgeladen...</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  PDF, Bilder oder Excel-Dateien hierher ziehen
                </p>
              )}
            </div>
          </FileUploader>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Pending Extractions */}
      {pendingOffers.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            {pendingOffers.map(offer => (
              <div key={offer.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{offer.file_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {extractingIds.has(offer.id) ? (
                    <Badge variant="secondary">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      KI liest aus…
                    </Badge>
                  ) : (
                    <Badge variant="outline">Hochgeladen</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteOffer(offer.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      {extractedOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Angebotsvergleich
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Position</TableHead>
                    {extractedOffers.map(offer => (
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
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPositions.length > 0 ? (
                    allPositions.map((posDesc, idx) => (
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
                  ) : (
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground">Gesamt</TableCell>
                      {extractedOffers.map(offer => (
                        <TableCell key={offer.id} className="text-center text-sm font-medium">
                          {offer.total_gross ? formatCurrency(offer.total_gross / 100) :
                           offer.total_net ? formatCurrency(offer.total_net / 100) : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
                {allPositions.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Gesamt (brutto)</TableCell>
                      {extractedOffers.map(offer => (
                        <TableCell key={offer.id} className={`text-center font-semibold ${offer.id === cheapestId ? 'text-green-600' : ''}`}>
                          {offer.total_gross ? formatCurrency(offer.total_gross / 100) :
                           offer.total_net ? formatCurrency(offer.total_net / 100) : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>

            {/* Award Actions */}
            <div className="p-4 border-t flex flex-wrap gap-2">
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
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && offers.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Noch keine Angebote hochgeladen. Laden Sie die erhaltenen Angebote oben hoch, um sie vergleichen zu können.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
