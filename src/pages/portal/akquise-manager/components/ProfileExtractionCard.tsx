import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles } from 'lucide-react';
import { DictationButton } from '@/components/shared/DictationButton';
import { ASSET_FOCUS_OPTIONS } from '@/types/acquisition';

interface Props {
  freeText: string;
  setFreeText: (v: string) => void;
  steerPriceMin: string;
  setSteerPriceMin: (v: string) => void;
  steerPriceMax: string;
  setSteerPriceMax: (v: string) => void;
  steerRegion: string;
  setSteerRegion: (v: string) => void;
  steerAssetFocus: string[];
  onToggleAsset: (v: string) => void;
  steerYield: string;
  setSteerYield: (v: string) => void;
  steerExclusions: string;
  setSteerExclusions: (v: string) => void;
  onExtract: () => void;
  isExtracting: boolean;
}

export function ProfileExtractionCard({
  freeText, setFreeText,
  steerPriceMin, setSteerPriceMin,
  steerPriceMax, setSteerPriceMax,
  steerRegion, setSteerRegion,
  steerAssetFocus, onToggleAsset,
  steerYield, setSteerYield,
  steerExclusions, setSteerExclusions,
  onExtract, isExtracting,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4" />
          KI-gestützte Erfassung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder="z.B. Family Office sucht Mehrfamilienhäuser in der Rhein-Main-Region, Investitionsvolumen 2 bis 5 Millionen Euro, mindestens 4% Rendite, kein Denkmalschutz, keine Erbbaurechte."
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            rows={6}
            className="text-sm pr-10"
          />
          <div className="absolute top-2 right-2">
            <DictationButton onTranscript={(text) => setFreeText(freeText + ' ' + text)} />
          </div>
        </div>

        {/* Optionale Steuerfelder */}
        <div className="space-y-3 border-t pt-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Optionale Steuerparameter</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Preis ab (€)</Label>
              <Input type="number" placeholder="500.000" value={steerPriceMin} onChange={e => setSteerPriceMin(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preis bis (€)</Label>
              <Input type="number" placeholder="5.000.000" value={steerPriceMax} onChange={e => setSteerPriceMax(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Region</Label>
            <Input placeholder="z.B. Rhein-Main, Berlin" value={steerRegion} onChange={e => setSteerRegion(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Zielrendite (%)</Label>
              <Input type="number" step="0.1" placeholder="5.0" value={steerYield} onChange={e => setSteerYield(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ausschlüsse</Label>
              <Input placeholder="z.B. kein Denkmalschutz" value={steerExclusions} onChange={e => setSteerExclusions(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Asset-Fokus</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {ASSET_FOCUS_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-border hover:bg-accent/50 cursor-pointer text-xs">
                  <Checkbox checked={steerAssetFocus.includes(opt.value)} onCheckedChange={() => onToggleAsset(opt.value)} className="h-3 w-3 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={onExtract} disabled={!freeText.trim() || isExtracting}>
          {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Ankaufsprofil generieren
        </Button>
      </CardContent>
    </Card>
  );
}
