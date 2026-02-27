/**
 * Standalone Calculator Panel (7.2)
 * 
 * Temporary calculation without DB persistence
 * With its own Drag-and-Drop for AI extraction
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, Loader2, Building2, Scissors,
  Info
} from 'lucide-react';
import { SmartDropZone } from '@/components/shared/SmartDropZone';
import { AIProcessingOverlay } from '@/components/shared/AIProcessingOverlay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUniversalUpload, type UploadedFileInfo } from '@/hooks/useUniversalUpload';
import { UploadResultCard } from '@/components/shared/UploadResultCard';
import { BestandCalculation } from './BestandCalculation';
import { AufteilerCalculation } from './AufteilerCalculation';

interface ExtractedValues {
  purchasePrice: number;
  monthlyRent: number;
  totalAreaSqm: number;
  unitsCount: number;
  yearlyRent: number;
  factor: number;
}

export function StandaloneCalculatorPanel() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { activeTenantId } = useAuth();
  const isMobile = useIsMobile();
  const { upload, progress, uploadedFiles, clearUploadedFiles } = useUniversalUpload();
  const [activeCalc, setActiveCalc] = React.useState<'bestand' | 'aufteiler'>('bestand');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [hasCalculated, setHasCalculated] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFileInfo | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<'uploaded' | 'analyzing' | 'done' | 'error'>('uploaded');
  
  // Input values (manual or from extraction)
  const [values, setValues] = React.useState<ExtractedValues>({
    purchasePrice: 0,
    monthlyRent: 0,
    totalAreaSqm: 0,
    unitsCount: 0,
    yearlyRent: 0,
    factor: 0,
  });

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
      await extractFromFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await extractFromFile(files[0]);
    }
  };

  const extractFromFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Bitte laden Sie ein PDF oder DOCX hoch');
      return;
    }

    if (!activeTenantId) {
      toast.error('Kein aktiver Tenant');
      return;
    }

    try {
      setIsExtracting(true);
      setUploadStatus('uploaded');

      // Phase 1: Upload via useUniversalUpload
      const result = await upload(file, {
        moduleCode: 'MOD_12',
        source: 'standalone_calc',
        triggerAI: false,
        onFileUploaded: (fileInfo) => {
          setUploadedFile(fileInfo);
        },
      });

      if (result?.error || !result?.storagePath) {
        throw new Error(result?.error || 'Upload fehlgeschlagen');
      }

      // Phase 2: Extract data using the storagePath
      setUploadStatus('analyzing');

      const { data: extractResult, error: extractError } = await supabase.functions
        .invoke('sot-acq-offer-extract', {
          body: {
            documentPath: result.storagePath,
            standaloneMode: true,
          },
        });

      if (extractError) throw extractError;

      // Parse extracted data
      const extracted = extractResult?.extractedData || {};
      const purchasePrice = extracted.price_asking || 0;
      const yearlyRent = extracted.noi_indicated || 0;
      const monthlyRent = yearlyRent / 12;
      const factor = yearlyRent > 0 ? purchasePrice / yearlyRent : 0;

      setValues({
        purchasePrice,
        monthlyRent,
        totalAreaSqm: extracted.area_sqm || 0,
        unitsCount: extracted.units_count || 0,
        yearlyRent,
        factor: parseFloat(factor.toFixed(1)),
      });

      setUploadStatus('done');
      toast.success('Werte aus Exposé extrahiert');

    } catch (error: any) {
      console.error('Extraction error:', error);
      setUploadStatus('error');
      toast.error('Fehler bei der Extraktion: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateValue = (field: keyof ExtractedValues, value: number) => {
    setValues(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate derived values
      if (field === 'monthlyRent') {
        updated.yearlyRent = value * 12;
        if (updated.purchasePrice > 0 && updated.yearlyRent > 0) {
          updated.factor = parseFloat((updated.purchasePrice / updated.yearlyRent).toFixed(1));
        }
      }
      if (field === 'yearlyRent') {
        updated.monthlyRent = value / 12;
        if (updated.purchasePrice > 0 && value > 0) {
          updated.factor = parseFloat((updated.purchasePrice / value).toFixed(1));
        }
      }
      if (field === 'purchasePrice' && updated.yearlyRent > 0) {
        updated.factor = parseFloat((value / updated.yearlyRent).toFixed(1));
      }
      
      return updated;
    });
  };

  const hasInputValues = values.purchasePrice > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Standalone-Kalkulatoren
        </CardTitle>
        <CardDescription>
          Schnelle Kalkulation ohne Mandat-Kontext — Daten werden nicht gespeichert
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Processing Overlay */}
        <AIProcessingOverlay
          active={isExtracting}
          steps={[
            { label: 'Lese Exposé' },
            { label: 'Erkenne Zahlen & Tabellen' },
            { label: 'Extrahiere Kaufpreis, Miete, Fläche' },
            { label: 'Befülle Kalkulationsfelder' },
          ]}
          currentStep={uploadStatus === 'uploaded' ? 0 : uploadStatus === 'analyzing' ? 2 : 3}
          headline="KI extrahiert Daten aus Exposé…"
          variant="amber"
        />

        {/* Smart Drop Zone */}
        {!isExtracting && (
          <SmartDropZone
            onFiles={(files) => files[0] && extractFromFile(files[0])}
            disabled={isExtracting}
            accept={{
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            }}
            maxFiles={1}
            helperText={isMobile ? 'Tippen zum Hochladen' : 'Exposé ablegen für automatische Befüllung'}
            formatsLabel="PDF, DOC, DOCX"
            variant="amber"
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isExtracting}
        />

        {/* Upload Result Card */}
        {uploadedFile && (
          <UploadResultCard
            file={uploadedFile}
            status={uploadStatus}
            onRemove={() => {
              setUploadedFile(null);
              setUploadStatus('uploaded');
            }}
          />
        )}

        {/* Calculator Type Tabs */}
        <Tabs value={activeCalc} onValueChange={(v) => setActiveCalc(v as 'bestand' | 'aufteiler')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bestand" className="gap-2">
              <Building2 className="h-4 w-4" />
              Bestand (Hold)
            </TabsTrigger>
            <TabsTrigger value="aufteiler" className="gap-2">
              <Scissors className="h-4 w-4" />
              Aufteiler (Flip)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bestand" className="mt-6 space-y-6">
            {/* Input Fields */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Kaufpreis</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={values.purchasePrice || ''}
                    onChange={(e) => updateValue('purchasePrice', parseFloat(e.target.value) || 0)}
                    placeholder="3.200.000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Fläche</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={values.totalAreaSqm || ''}
                    onChange={(e) => updateValue('totalAreaSqm', parseFloat(e.target.value) || 0)}
                    placeholder="2.550"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m²</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Einheiten</Label>
                <Input
                  type="number"
                  value={values.unitsCount || ''}
                  onChange={(e) => updateValue('unitsCount', parseInt(e.target.value) || 0)}
                  placeholder="40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Jahresmiete</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={values.yearlyRent || ''}
                    onChange={(e) => updateValue('yearlyRent', parseFloat(e.target.value) || 0)}
                    placeholder="217.687"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Faktor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={values.factor || ''}
                    onChange={(e) => updateValue('factor', parseFloat(e.target.value) || 0)}
                    placeholder="14,7"
                    className="font-medium"
                    readOnly
                  />
                  {values.factor > 0 && (
                    <Badge variant={values.factor < 15 ? 'default' : values.factor < 20 ? 'secondary' : 'outline'}>
                      {values.factor.toFixed(1)}x
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <Button 
              onClick={() => setHasCalculated(true)} 
              className="w-full"
              disabled={!hasInputValues}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Berechnung starten
            </Button>

            {/* Results */}
            {hasCalculated && hasInputValues && (
              <BestandCalculation
                initialData={{
                  purchasePrice: values.purchasePrice,
                  monthlyRent: values.monthlyRent,
                  units: values.unitsCount,
                  areaSqm: values.totalAreaSqm,
                }}
                temporary
              />
            )}
          </TabsContent>

          <TabsContent value="aufteiler" className="mt-6 space-y-6">
            {/* Aufteiler Input Fields */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Kaufpreis gesamt</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={values.purchasePrice || ''}
                    onChange={(e) => updateValue('purchasePrice', parseFloat(e.target.value) || 0)}
                    placeholder="3.200.000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Anzahl Einheiten</Label>
                <Input
                  type="number"
                  value={values.unitsCount || ''}
                  onChange={(e) => updateValue('unitsCount', parseInt(e.target.value) || 0)}
                  placeholder="40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Fläche gesamt</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={values.totalAreaSqm || ''}
                    onChange={(e) => updateValue('totalAreaSqm', parseFloat(e.target.value) || 0)}
                    placeholder="2.550"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m²</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Jahresmiete IST</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={values.yearlyRent || ''}
                    onChange={(e) => updateValue('yearlyRent', parseFloat(e.target.value) || 0)}
                    placeholder="217.687"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <Button 
              onClick={() => setHasCalculated(true)} 
              className="w-full"
              disabled={!hasInputValues}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Berechnung starten
            </Button>

            {/* Results */}
            {hasCalculated && hasInputValues && (
              <AufteilerCalculation
                initialData={{
                  purchasePrice: values.purchasePrice,
                  yearlyRent: values.yearlyRent,
                  units: values.unitsCount,
                  areaSqm: values.totalAreaSqm,
                }}
                temporary
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Diese Kalkulation wird <strong>nicht gespeichert</strong>. 
            Um sie zu speichern, laden Sie das Exposé über "Exposé-Upload & Analyse" hoch.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
