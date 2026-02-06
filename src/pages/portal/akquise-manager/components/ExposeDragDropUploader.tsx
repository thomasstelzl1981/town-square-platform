/**
 * Exposé Drag-and-Drop Uploader (7.1)
 * 
 * Upload exposés that get saved to Objekteingang (acq_offers)
 * Triggers AI extraction via sot-acq-offer-extract
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, FileText, Loader2, CheckCircle2, AlertCircle, 
  Calculator, ArrowRight, Building2, X 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExtractionResult {
  title?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  price_asking?: number;
  units_count?: number;
  area_sqm?: number;
  noi_indicated?: number;
  yield_indicated?: number;
}

type UploadState = 'idle' | 'uploading' | 'extracting' | 'success' | 'error';

export function ExposeDragDropUploader() {
  const navigate = useNavigate();
  const { activeTenantId } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [state, setState] = React.useState<UploadState>('idle');
  const [isDragging, setIsDragging] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [extractedData, setExtractedData] = React.useState<ExtractionResult | null>(null);
  const [createdOfferId, setCreatedOfferId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Bitte laden Sie ein PDF, DOCX, JPG oder PNG hoch');
      return;
    }

    if (!activeTenantId) {
      toast.error('Keine aktive Organisation');
      return;
    }

    try {
      setState('uploading');
      setProgress(10);
      setErrorMessage(null);
      setExtractedData(null);
      setCreatedOfferId(null);

      // 1. Upload file to storage
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${activeTenantId}/manual/${fileName}`;
      
      setProgress(20);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('acq-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setProgress(40);

      // 2. Create acq_offer record (mandate_id is required, so we need a fallback)
      // For manual uploads, we create an offer linked to a placeholder/default mandate or allow null mandate
      // Since mandate_id is required by the schema, we need to handle this case
      // Option: Create offer with a special "unassigned" flow - using type assertion to handle the constraint
      const insertData: Record<string, unknown> = {
        source_type: 'manual_upload',
        status: 'new',
        title: file.name.replace(/\.[^/.]+$/, ''),
      };

      const { data: offer, error: offerError } = await supabase
        .from('acq_offers')
        .insert(insertData as any)
        .select('id')
        .single();

      if (offerError) throw offerError;
      setProgress(50);

      // 3. Link document to offer
      const { error: docError } = await supabase
        .from('acq_offer_documents')
        .insert({
          offer_id: offer.id,
          storage_path: uploadData.path,
          file_name: file.name,
          document_type: 'expose',
          mime_type: file.type,
          file_size: file.size,
        });

      if (docError) throw docError;
      setProgress(60);

      // 4. Trigger AI extraction
      setState('extracting');
      setProgress(70);

      const { error: extractError } = await supabase.functions
        .invoke('sot-acq-offer-extract', {
          body: {
            offerId: offer.id,
            documentPath: uploadData.path,
          },
        });

      setProgress(90);

      if (extractError) {
        console.warn('Extraction warning:', extractError);
        // Continue even if extraction fails - offer is created
      }

      // 5. Fetch updated offer data
      const { data: updatedOffer } = await supabase
        .from('acq_offers')
        .select('*')
        .eq('id', offer.id)
        .single();

      setProgress(100);
      setState('success');
      setCreatedOfferId(offer.id);
      
      if (updatedOffer) {
        setExtractedData({
          title: updatedOffer.title || undefined,
          address: updatedOffer.address || undefined,
          city: updatedOffer.city || undefined,
          postal_code: updatedOffer.postal_code || undefined,
          price_asking: updatedOffer.price_asking || undefined,
          units_count: updatedOffer.units_count || undefined,
          area_sqm: updatedOffer.area_sqm || undefined,
          noi_indicated: updatedOffer.noi_indicated || undefined,
          yield_indicated: updatedOffer.yield_indicated || undefined,
        });
      }

      toast.success('Exposé erfolgreich hochgeladen und analysiert');

    } catch (error: any) {
      console.error('Upload error:', error);
      setState('error');
      setErrorMessage(error.message || 'Fehler beim Hochladen');
      toast.error('Fehler beim Hochladen: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const resetUploader = () => {
    setState('idle');
    setProgress(0);
    setExtractedData(null);
    setCreatedOfferId(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Exposé-Upload & Analyse
        </CardTitle>
        <CardDescription>
          Exposés hochladen, die nicht per E-Mail kamen — wird in Objekteingang gespeichert
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        {state === 'idle' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium mb-1">Exposé hier ablegen oder klicken</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, JPG, PNG</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Progress State */}
        {(state === 'uploading' || state === 'extracting') && (
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">
                  {state === 'uploading' ? 'Exposé wird hochgeladen...' : 'KI extrahiert Daten...'}
                </p>
                <Progress value={progress} className="h-2 mt-2" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="border border-destructive/50 bg-destructive/5 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Fehler beim Upload</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={resetUploader}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={resetUploader} variant="outline">
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* Success State with Extracted Data */}
        {state === 'success' && extractedData && (
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Exposé erfolgreich verarbeitet</p>
                  <p className="text-sm text-muted-foreground">
                    Als Objekteingang gespeichert
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={resetUploader}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Extracted Data Summary */}
            <div className="grid gap-3 md:grid-cols-2">
              {extractedData.title && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Objekt</p>
                    <p className="font-medium text-sm">{extractedData.title}</p>
                  </div>
                </div>
              )}
              {extractedData.address && (
                <div>
                  <p className="text-xs text-muted-foreground">Adresse</p>
                  <p className="font-medium text-sm">
                    {extractedData.address}, {extractedData.postal_code} {extractedData.city}
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Kaufpreis</p>
                  <p className="font-medium">{formatCurrency(extractedData.price_asking)}</p>
                </div>
                {extractedData.units_count && (
                  <div>
                    <p className="text-xs text-muted-foreground">Einheiten</p>
                    <p className="font-medium">{extractedData.units_count} WE</p>
                  </div>
                )}
                {extractedData.yield_indicated && (
                  <div>
                    <p className="text-xs text-muted-foreground">Faktor</p>
                    <Badge variant="outline">
                      {extractedData.yield_indicated > 0 
                        ? (100 / extractedData.yield_indicated).toFixed(1) + 'x'
                        : '–'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => createdOfferId && navigate(`/portal/akquise-manager/objekteingang/${createdOfferId}`)}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Zum Objekteingang
              </Button>
              <Button 
                variant="outline"
                onClick={() => createdOfferId && navigate(`/portal/akquise-manager/objekteingang/${createdOfferId}#kalkulation`)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Bestandskalkulation
              </Button>
              <Button variant="ghost" onClick={resetUploader}>
                Weiteres Exposé
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
