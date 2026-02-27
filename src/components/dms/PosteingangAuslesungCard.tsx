/**
 * PosteingangAuslesungCard — OCR Toggle + Pipeline Overview
 * Extracted from EinstellungenTab for reuse in PosteingangTab
 */
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Cpu, FileText, Sparkles, Zap, Database, Bot, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function PosteingangAuslesungCard() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: ocrEnabled = false } = useQuery({
    queryKey: ['ai-extraction-enabled', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return false;
      const { data, error } = await supabase
        .from('organizations')
        .select('ai_extraction_enabled')
        .eq('id', activeTenantId)
        .single();
      if (error) throw error;
      return data?.ai_extraction_enabled ?? false;
    },
    enabled: !!activeTenantId,
  });

  const ocrToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { error, data } = await supabase
        .from('organizations')
        .update({ ai_extraction_enabled: enabled })
        .eq('id', activeTenantId)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Keine Berechtigung für diese Änderung');
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['ai-extraction-enabled'] });
      toast.success(enabled ? 'Dokumenten-Auslesung aktiviert' : 'Dokumenten-Auslesung deaktiviert');
    },
    onError: () => toast.error('Fehler beim Umschalten'),
  });

  return (
    <Card className="glass-card flex flex-col overflow-hidden">
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Posteingangs-Auslesung</h3>
            <p className="text-xs text-muted-foreground">Automatische End-to-End-Verarbeitung</p>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-6 space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
          <div>
            <p className="text-sm font-medium text-foreground">Automatische Auslesung</p>
            <p className="text-xs text-muted-foreground">Neue Dokumente im Posteingang automatisch analysieren</p>
          </div>
          <Switch checked={ocrEnabled} onCheckedChange={(v) => ocrToggleMutation.mutate(v)} />
        </div>

        {/* Pipeline Steps */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verarbeitungs-Pipeline</p>
          {[
            { icon: FileText, text: 'PDF empfangen & OCR-Texterkennung' },
            { icon: Sparkles, text: 'Dokumententyp erkennen (Rechnung, Vertrag, Bescheid…)' },
            { icon: Zap, text: 'Automatisch in passende Akte sortieren' },
            { icon: Database, text: 'Für Armstrong durchsuchbar machen' },
          ].map((step) => (
            <div key={step.text} className="flex items-center gap-2.5">
              <step.icon className={`h-4 w-4 shrink-0 ${ocrEnabled ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span className={`text-sm ${ocrEnabled ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                {step.text}
              </span>
            </div>
          ))}
        </div>

        {/* NK-Beleg-Parsing */}
        <div className="p-3 rounded-xl border border-border/50 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">NK-Beleg-Parsing</p>
            <Badge variant="outline" className="text-xs font-mono">inklusive</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Nebenkostenbelege werden automatisch analysiert: Versorger, Betrag, Zeitraum und Kostenkategorie werden extrahiert.
          </p>
        </div>

        {/* Cost */}
        <div className="p-3 rounded-xl border border-primary/10 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground font-medium">Kosten pro Dokument</span>
            <Badge variant="outline" className="font-mono">1 Credit</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Vollautomatisch: Upload → Extraktion → NK-Parsing → Sortierung → Index</p>
        </div>

        {/* Armstrong Examples */}
        <div className="p-3 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Armstrong kann dann z.B.:</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• „Zeige mir alle Rechnungen vom letzten Monat"</p>
            <p>• „Fasse den Mietvertrag Musterstr. 5 zusammen"</p>
            <p>• „Welche offenen Fristen habe ich?"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
