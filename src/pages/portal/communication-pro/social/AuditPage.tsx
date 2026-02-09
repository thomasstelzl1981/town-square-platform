/**
 * Social Audit — Persönlichkeitserfassung via Armstrong
 */
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useArmstrongAdvisor, type FlowState } from '@/hooks/useArmstrongAdvisor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

export function AuditPage() {
  const navigate = useNavigate();
  const { showArmstrong } = usePortalLayout();
  const { startFlow, activeFlow } = useArmstrongAdvisor();
  const { activeOrganization } = useAuth();

  // Check if audit already exists
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

  // Refetch when flow completes
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
    return (
      <div className="p-6 space-y-6 max-w-2xl">
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

        {/* Personality Summary */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold">Dein Profil</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {vector.tone && (
                <div><span className="text-muted-foreground">Tonalität:</span> <span className="font-medium">{String(vector.tone)}</span></div>
              )}
              {vector.formality && (
                <div><span className="text-muted-foreground">Formalität:</span> <span className="font-medium">{String(vector.formality)}</span></div>
              )}
              {vector.emoji_level && (
                <div><span className="text-muted-foreground">Emojis:</span> <span className="font-medium">{String(vector.emoji_level)}</span></div>
              )}
              {vector.cta_style && (
                <div><span className="text-muted-foreground">CTA-Stil:</span> <span className="font-medium">{String(vector.cta_style)}</span></div>
              )}
              {vector.opinion_strength && (
                <div><span className="text-muted-foreground">Meinungsstärke:</span> <span className="font-medium">{String(vector.opinion_strength)}</span></div>
              )}
              {vector.emotion_level && (
                <div><span className="text-muted-foreground">Emotion:</span> <span className="font-medium">{String(vector.emotion_level)}</span></div>
              )}
            </div>
            {Array.isArray(vector.goals) && vector.goals.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Ziele: </span>
                {(vector.goals as string[]).map((g) => (
                  <Badge key={g} variant="secondary" className="mr-1 mb-1">{g}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleStartAudit}>
            <Mic className="h-4 w-4 mr-2" />
            Audit wiederholen
          </Button>
          <Button onClick={() => navigate('../knowledge')} className="gap-2">
            Weiter zur Knowledge Base
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Persönlichkeits-Audit</h1>
        <p className="text-muted-foreground mt-1">
          Armstrong lernt deinen Stil, deine Sprache und deine Werte kennen — in einem natürlichen Gespräch.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Audit noch nicht durchgeführt</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Armstrong stellt dir 15 Fragen — per Sprache oder Text. Dauer: ca. 10–15 Minuten. Deine Antworten bleiben privat.
            </p>
          </div>
          <Button size="lg" className="gap-2 mt-2" onClick={handleStartAudit}>
            <Sparkles className="h-4 w-4" />
            Audit starten
          </Button>
          <p className="text-xs text-muted-foreground">
            Armstrong öffnet sich und führt dich durch das Interview.
          </p>
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
