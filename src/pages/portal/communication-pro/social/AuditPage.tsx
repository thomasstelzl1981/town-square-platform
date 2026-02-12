/**
 * Social Audit — Persönlichkeitserfassung via Armstrong
 * Enhanced: Erklär-Cards, visuelle Ergebnis-Darstellung
 */
import { useState, useEffect } from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, Sparkles, CheckCircle2, ArrowRight, User, MessageSquare, Palette, ShieldCheck, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useArmstrongAdvisor, type FlowState } from '@/hooks/useArmstrongAdvisor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const AUDIT_BLOCKS = [
  {
    title: 'Identität',
    desc: 'Wer bist du beruflich? Was treibt dich an?',
    icon: User,
    example: 'Was ist dein beruflicher Hintergrund?',
    time: '3 Min',
  },
  {
    title: 'Haltung',
    desc: 'Wofür stehst du? Was sind deine Überzeugungen?',
    icon: MessageSquare,
    example: 'Welche Meinung vertrittst du in deiner Branche?',
    time: '3 Min',
  },
  {
    title: 'Sprache & Stil',
    desc: 'Wie kommunizierst du? Förmlich oder locker?',
    icon: Palette,
    example: 'Beschreibe deinen Kommunikationsstil.',
    time: '3 Min',
  },
  {
    title: 'Grenzen',
    desc: 'Was willst du nicht posten? No-Go Themen.',
    icon: ShieldCheck,
    example: 'Gibt es Themen, die du meidest?',
    time: '2 Min',
  },
];

// Map personality vector keys to German labels and visual representation
const DIMENSION_LABELS: Record<string, { label: string; low: string; high: string }> = {
  tone: { label: 'Tonalität', low: 'Sachlich', high: 'Emotional' },
  formality: { label: 'Formalität', low: 'Locker', high: 'Förmlich' },
  emoji_level: { label: 'Emoji-Einsatz', low: 'Keine', high: 'Viele' },
  opinion_strength: { label: 'Meinungsstärke', low: 'Zurückhaltend', high: 'Polarisierend' },
  emotion_level: { label: 'Emotionalität', low: 'Rational', high: 'Emotional' },
  cta_style: { label: 'CTA-Stil', low: 'Subtil', high: 'Direkt' },
};

function dimensionToScale(value: unknown): number {
  if (typeof value === 'number') return Math.min(10, Math.max(0, value));
  const str = String(value).toLowerCase();
  // Simple text-to-number mapping
  if (['hoch', 'high', 'stark', 'viel', 'direkt', 'förmlich', 'emotional', 'polarisierend'].some((w) => str.includes(w))) return 8;
  if (['mittel', 'medium', 'moderat', 'balanced'].some((w) => str.includes(w))) return 5;
  if (['niedrig', 'low', 'wenig', 'subtil', 'locker', 'sachlich', 'zurückhaltend', 'rational', 'keine'].some((w) => str.includes(w))) return 2;
  return 5; // default
}

export function AuditPage() {
  const navigate = useNavigate();
  const { showArmstrong } = usePortalLayout();
  const { startFlow, activeFlow } = useArmstrongAdvisor();
  const { activeOrganization } = useAuth();

  const { data: existingAudit, refetch } = useQuery({
    queryKey: ['social-audit', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return null;
      const { data } = await supabase
        .from('social_personality_profiles')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!activeOrganization?.id,
  });

  useEffect(() => {
    if (activeFlow?.status === 'completed') {
      refetch();
    }
  }, [activeFlow?.status, refetch]);

  const handleStartAudit = () => {
    showArmstrong({ expanded: true });
    startFlow('social_audit');
  };

  const vector = existingAudit?.personality_vector as Record<string, unknown> | null;

  // Audit completed view
  if (existingAudit && vector) {
    const dimensions = Object.entries(DIMENSION_LABELS)
      .filter(([key]) => vector[key] !== undefined)
      .map(([key, meta]) => ({
        key,
        ...meta,
        value: vector[key],
        scale: dimensionToScale(vector[key]),
      }));

    return (
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Persönlichkeits-Audit</h1>
            <p className="text-muted-foreground mt-1">Deine Social DNA wurde erfasst.</p>
          </div>
          <Badge variant="outline" className="gap-1.5 text-green-600 border-green-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Abgeschlossen
          </Badge>
        </div>

        {/* Dimension Cards */}
        <div className={DESIGN.FORM_GRID.FULL}>
          {dimensions.map((dim) => (
            <Card key={dim.key}>
              <CardContent className="pt-4 pb-3 px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dim.label}</span>
                  <span className="text-xs text-muted-foreground">{String(dim.value)}</span>
                </div>
                <Progress value={dim.scale * 10} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{dim.low}</span>
                  <span>{dim.high}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Goals */}
        {Array.isArray(vector.goals) && vector.goals.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <span className="text-sm font-medium">Ziele</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(vector.goals as string[]).map((g) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw summary if available */}
        {vector.summary && (
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <span className="text-sm font-medium">Zusammenfassung</span>
              <p className="text-sm text-muted-foreground mt-2">{String(vector.summary)}</p>
            </CardContent>
          </Card>
        )}

        {/* Nächster Schritt */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 px-4 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Nächster Schritt: Themen definieren</p>
              <p className="text-xs text-muted-foreground">Lege bis zu 10 Themen fest, über die du regelmäßig posten möchtest.</p>
            </div>
            <Button onClick={() => navigate('../knowledge')} className="gap-2 shrink-0">
              Weiter
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={handleStartAudit} className="gap-2">
          <Mic className="h-4 w-4" />
          Audit wiederholen
        </Button>
      </div>
    );
  }

  // Empty state with explainer cards
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Persönlichkeits-Audit</h1>
        <p className="text-muted-foreground mt-1">
          Armstrong lernt deinen Stil, deine Sprache und deine Werte kennen — in einem natürlichen Gespräch.
        </p>
      </div>

      {/* Explainer blocks */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Was wird gefragt?
        </h3>
        <div className={DESIGN.FORM_GRID.FULL}>
          {AUDIT_BLOCKS.map((block) => (
            <Card key={block.title}>
              <CardContent className="pt-4 pb-3 px-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <block.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{block.title}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {block.time}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{block.desc}</p>
                <p className="text-xs italic text-muted-foreground/70">
                  Beispiel: „{block.example}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-6 flex flex-col items-center text-center space-y-3">
          <div className="rounded-full bg-primary/10 p-4">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Bereit für dein Audit?</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              15 Fragen, ca. 10–15 Minuten. Per Sprache oder Text. Deine Antworten bleiben privat.
            </p>
          </div>
          <Button size="lg" className="gap-2" onClick={handleStartAudit}>
            <Sparkles className="h-4 w-4" />
            Audit starten
          </Button>
        </CardContent>
      </Card>

      {/* Active flow indicator */}
      {activeFlow?.flow_type === 'social_audit' && activeFlow.status === 'active' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="animate-pulse rounded-full bg-primary h-3 w-3" />
            <span className="text-sm font-medium">
              Audit läuft — Frage {activeFlow.step} von {activeFlow.total_steps}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
