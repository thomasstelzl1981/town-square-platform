/**
 * ValuationIntroCard — KI-generierte Objektbeschreibung + Methodik-Erklärung
 * Positioned between the cover section and the Objektdaten section.
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Sparkles, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ValuationIntroCardProps {
  snapshot: Record<string, any> | null;
  valueBand: Record<string, any> | null;
  methods: any[];
  beleihungswert?: Record<string, any> | null;
  className?: string;
}

export function ValuationIntroCard({ snapshot, valueBand, methods, beleihungswert, className }: ValuationIntroCardProps) {
  const [intro, setIntro] = useState<{ objektbeschreibung: string; methodik: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!snapshot) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sot-valuation-intro', {
        body: { snapshot, valueBand, methods, beleihungswert },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.objektbeschreibung && data?.methodik) {
        setIntro(data);
      } else {
        throw new Error('Unerwartetes Antwortformat');
      }
    } catch (e) {
      console.error('ValuationIntroCard error:', e);
      setError(e instanceof Error ? e.message : 'Fehler bei der Generierung');
    } finally {
      setIsLoading(false);
    }
  }, [snapshot, valueBand, methods, beleihungswert]);

  // Auto-generate on mount when snapshot is available
  useEffect(() => {
    if (snapshot && !intro && !isLoading) {
      generate();
    }
  }, [snapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!snapshot) return null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold tracking-tight">Einleitung & Methodik</h3>
                <p className="text-xs text-muted-foreground mt-0.5">KI-generierte Objektbeschreibung und Bewertungsmethodik</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                KI-generiert
              </Badge>
              {intro && (
                <Button variant="ghost" size="sm" onClick={generate} disabled={isLoading} className="h-7 w-7 p-0">
                  <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                </Button>
              )}
            </div>
          </div>
          <Separator className="mt-3" />
        </div>

        {/* Loading state */}
        {isLoading && !intro && (
          <div className="flex items-center justify-center py-10 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Objektbeschreibung wird erstellt…</p>
          </div>
        )}

        {/* Error state */}
        {error && !intro && (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={generate} disabled={isLoading}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* Content */}
        {intro && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Objektbeschreibung */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary/70" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  Objektbeschreibung
                </p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {intro.objektbeschreibung}
              </p>
            </div>

            {/* Methodik */}
            <div className="space-y-3 p-4 rounded-xl border bg-primary/5 border-primary/15">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary/70" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  Bewertungsmethodik
                </p>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {intro.methodik}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
