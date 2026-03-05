/**
 * R-2: Verkaufsdaten tab — Title, AI description, price & commission
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Euro, Sparkles, Loader2 } from 'lucide-react';
import { DictationButton } from '@/components/shared/DictationButton';
import { formatCurrency, type ExposeFormData } from './exposeTypes';

interface ExposeVerkaufTabProps {
  formData: ExposeFormData;
  onChange: (field: string, value: string | number[]) => void;
  onGenerateDescription: () => void;
  isGeneratingDescription: boolean;
  pricePerSqm: number;
}

export function ExposeVerkaufTab({
  formData,
  onChange,
  onGenerateDescription,
  isGeneratingDescription,
  pricePerSqm,
}: ExposeVerkaufTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verkaufsinformationen</CardTitle>
        <CardDescription>Titel, Beschreibung und Preisangaben für das Inserat</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Überschrift *</Label>
          <Input
            id="title"
            placeholder="z.B. Kapitalanlage: Vermietetes MFH in Toplage mit 5,2% Rendite"
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label htmlFor="description">Objektbeschreibung</Label>
              <DictationButton onTranscript={(text) => onChange('description', formData.description + ' ' + text)} />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1" 
              onClick={onGenerateDescription}
              disabled={isGeneratingDescription}
            >
              {isGeneratingDescription ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Mit KI generieren
            </Button>
          </div>
          <Textarea
            id="description"
            placeholder="Beschreiben Sie das Objekt für potenzielle Käufer. Heben Sie Vorteile wie Lage, Zustand, Rendite und Potenzial hervor..."
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={8}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Tipp: Die KI-Beschreibung berücksichtigt automatisch Objektdaten, Lage und Renditepotenzial
          </p>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Kaufpreis (€) *</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                placeholder="890000"
                value={formData.asking_price}
                onChange={(e) => onChange('asking_price', e.target.value)}
                className="pl-9"
              />
            </div>
            {pricePerSqm > 0 && (
              <p className="text-xs text-muted-foreground">
                = {formatCurrency(pricePerSqm)}/m²
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Käufer-Provision: {formData.commission_rate[0].toFixed(1)}% netto</Label>
            <Slider
              value={formData.commission_rate}
              onValueChange={(val) => onChange('commission_rate', val)}
              min={3}
              max={15}
              step={0.5}
              className="py-3"
            />
            <p className="text-xs text-muted-foreground">
              Brutto: {(formData.commission_rate[0] * 1.19).toFixed(2)}% inkl. MwSt.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
