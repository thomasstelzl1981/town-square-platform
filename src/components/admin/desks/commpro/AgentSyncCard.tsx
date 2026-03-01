import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, Loader2, ChevronDown, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

interface Props {
  brandKey: string;
  config: PhoneAssistantConfig;
  onRefresh: () => void;
}

interface SyncResult {
  status: string;
  agent_action?: string;
  phone_action?: string;
  prompt_length?: number;
  error?: string;
}

export function AgentSyncCard({ brandKey, config, onRefresh }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sot-phone-agent-sync', {
        body: { action: 'sync', brand_key: brandKey },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLastResult({
        status: 'success',
        agent_action: data.agent_action ?? 'synced',
        phone_action: data.phone_action ?? 'n/a',
        prompt_length: data.prompt_length,
      });
      toast({ title: 'Agent synchronisiert', description: `${data.agent_action ?? 'OK'}` });
      onRefresh();
    } catch (err: any) {
      setLastResult({ status: 'error', error: err.message });
      toast({ title: 'Sync fehlgeschlagen', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const promptText = (config as any).behavior_prompt ?? '';
  const promptLen = promptText.length;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-primary" />
          Agent Sync &amp; Prompt-Vorschau
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync button + last result */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Synchronisiere…</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Agent synchronisieren</>
            )}
          </Button>

          {lastResult && (
            <div className="flex items-center gap-2">
              {lastResult.status === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="text-[10px]">{lastResult.agent_action}</Badge>
                  {lastResult.prompt_length && (
                    <span className="text-xs text-muted-foreground">{lastResult.prompt_length} Zeichen</span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-destructive">{lastResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ElevenLabs Agent ID */}
        {(config as any).elevenlabs_agent_id && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ElevenLabs Agent:</span>
            <code className="bg-muted/40 px-2 py-0.5 rounded font-mono text-[11px]">
              {(config as any).elevenlabs_agent_id}
            </code>
          </div>
        )}

        {/* Prompt preview */}
        {promptText && (
          <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors">
                <span className="flex-1 text-left">Generierter Prompt ({promptLen.toLocaleString('de-DE')} Zeichen)</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${promptOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-md border border-border/50 bg-muted/10 p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                  {promptText}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {!promptText && (
          <p className="text-xs text-muted-foreground">
            Noch kein Prompt generiert. Klicken Sie „Agent synchronisieren", um den Prompt aus der Wissensbasis zu erstellen.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
