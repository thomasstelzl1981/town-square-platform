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
import { Slider } from '@/components/ui/slider';
import { 
  Calculator, Loader2, Upload, Building2, Scissors,
  TrendingUp, Wallet, Percent, PiggyBank, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
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
  const [activeCalc, setActiveCalc] = React.useState<'bestand' | 'aufteiler'>('bestand');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [hasCalculated, setHasCalculated] = React.useState(false);
  
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

    try {
      setIsExtracting(true);

      // Upload to temporary location
      const fileName = `temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('acq-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Call extraction function for standalone mode
      const { data: extractResult, error: extractError } = await supabase.functions
        .invoke('sot-acq-offer-extract', {
          body: {
            documentPath: uploadData.path,
            standaloneMode: true, // Don't save to DB
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

      toast.success('Werte aus Exposé extrahiert');

      // Cleanup temp file
      await supabase.storage.from('acq-documents').remove([uploadData.path]);

    } catch (error: any) {
      console.error('Extraction error:', error);
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
        {/* Drag-and-Drop Zone for Extraction */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isExtracting && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
            isExtracting 
              ? "border-primary bg-primary/5 cursor-wait"
              : isDragging 
                ? "border-primary bg-primary/5 cursor-copy" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
          )}
        >
          {isExtracting ? (
            <div className="flex items-center justify-center gap-3 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Extrahiere Daten aus Exposé...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Exposé ablegen</span> für automatische Befüllung oder Werte manuell eingeben
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isExtracting}
          />
        </div>

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
