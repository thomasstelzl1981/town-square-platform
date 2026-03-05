/**
 * AI Search Profile Intake — Phase 3
 * 
 * User describes desired property in natural language.
 * AI extracts structured search filters with confidence scores.
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PortalSearchParams } from '@/hooks/useAcqTools';

interface AIProfileDraft {
  canonical: {
    region?: string;
    price_min?: number;
    price_max?: number;
    area_min?: number;
    area_max?: number;
    object_types?: string[];
    yield_min?: number;
    units_min?: number;
  };
  confidence: Record<string, number>;
  assumptions: string[];
  questions?: string[];
}

const FIELD_LABELS: Record<string, string> = {
  region: 'Region',
  price_min: 'Min. Preis',
  price_max: 'Max. Preis',
  area_min: 'Min. Fläche',
  area_max: 'Max. Fläche',
  object_types: 'Objektart',
  yield_min: 'Min. Rendite',
  units_min: 'Min. WE',
};

function useAISearchProfile() {
  return useMutation({
    mutationFn: async (freetext: string): Promise<AIProfileDraft> => {
      const { data, error } = await supabase.functions.invoke('sot-research-engine', {
        body: {
          intent: 'ai_search_profile',
          query: freetext,
        },
      });
      if (error) throw error;
      if (!data?.profile) throw new Error('Kein Profil vom KI erhalten');
      return data.profile as AIProfileDraft;
    },
    onError: (error) => {
      toast.error('KI-Profilerstellung fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

function formatValue(key: string, value: any): string {
  if (value == null) return '—';
  if (key.includes('price')) return `${(value as number).toLocaleString('de-DE')} €`;
  if (key.includes('area')) return `${value} m²`;
  if (key.includes('yield')) return `${value}%`;
  if (key === 'object_types' && Array.isArray(value)) return value.join(', ');
  return String(value);
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return 'text-green-600 dark:text-green-400';
  if (c >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-destructive';
}

interface AISearchProfileIntakeProps {
  onApply: (params: PortalSearchParams) => void;
}

export function AISearchProfileIntake({ onApply }: AISearchProfileIntakeProps) {
  const [freetext, setFreetext] = React.useState('');
  const [draft, setDraft] = React.useState<AIProfileDraft | null>(null);
  const aiProfile = useAISearchProfile();

  const handleGenerate = async () => {
    if (!freetext.trim()) return;
    const result = await aiProfile.mutateAsync(freetext);
    setDraft(result);
  };

  const handleApply = () => {
    if (!draft) return;
    const c = draft.canonical;
    onApply({
      region: c.region,
      priceMin: c.price_min,
      priceMax: c.price_max,
      areaMin: c.area_min,
      areaMax: c.area_max,
      objectTypes: c.object_types,
    });
    toast.success('Suchfilter übernommen');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          KI-Suchprofil
        </CardTitle>
        <CardDescription>
          Beschreibe dein Wunschobjekt in eigenen Worten — die KI erzeugt die passenden Suchfilter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="z.B. Suche ein Mehrfamilienhaus in Berlin oder Leipzig, bis 2 Mio EUR, mindestens 6% Bruttorendite, ab 6 Wohneinheiten..."
          value={freetext}
          onChange={(e) => setFreetext(e.target.value)}
          rows={3}
        />

        <Button
          onClick={handleGenerate}
          disabled={aiProfile.isPending || !freetext.trim()}
        >
          {aiProfile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {aiProfile.isPending ? 'Analysiere…' : 'Suchprofil erstellen'}
        </Button>

        {/* Draft Result */}
        {draft && (
          <div className="space-y-3 mt-4 p-4 rounded-lg border bg-muted/30">
            <h4 className="font-medium text-sm">Extrahierte Suchkriterien</h4>

            {/* Fields with confidence */}
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(draft.canonical).map(([key, value]) => {
                if (value == null || (Array.isArray(value) && value.length === 0)) return null;
                const conf = draft.confidence[key] ?? 0;
                return (
                  <div key={key} className="flex items-center justify-between text-sm p-2 rounded bg-background">
                    <span className="text-muted-foreground">{FIELD_LABELS[key] || key}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatValue(key, value)}</span>
                      <span className={`text-xs ${confidenceColor(conf)}`}>
                        {Math.round(conf * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assumptions */}
            {draft.assumptions && draft.assumptions.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Annahmen:
                </p>
                <ul className="list-disc pl-5">
                  {draft.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {/* Questions */}
            {draft.questions && draft.questions.length > 0 && (
              <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <p className="font-medium">Rückfragen:</p>
                <ul className="list-disc pl-5">
                  {draft.questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}

            {/* Apply button */}
            <Button onClick={handleApply} className="w-full">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Filter übernehmen & suchen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
