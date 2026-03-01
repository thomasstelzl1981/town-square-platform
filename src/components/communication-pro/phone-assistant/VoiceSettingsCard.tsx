import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

const PRESETS = [
  { key: 'professional_warm', label: 'Professionell & Warm', emoji: '🎙️' },
  { key: 'professional_crisp', label: 'Professionell & Klar', emoji: '📢' },
  { key: 'friendly_calm', label: 'Freundlich & Ruhig', emoji: '😊' },
  { key: 'energetic_clear', label: 'Energisch & Deutlich', emoji: '⚡' },
  { key: 'serious_formal', label: 'Seriös & Formell', emoji: '🏛️' },
  { key: 'soft_supportive', label: 'Sanft & Unterstützend', emoji: '🤝' },
];

interface Props {
  config: PhoneAssistantConfig;
  onUpdate: (u: Partial<PhoneAssistantConfig>) => void;
}

export function VoiceSettingsCard({ config, onUpdate }: Props) {
  const vs = config.voice_settings;

  const setVoice = (key: string, val: number) => {
    onUpdate({ voice_settings: { ...vs, [key]: val } });
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="h-4 w-4 text-primary" />
          Stimme
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ElevenLabs Provider Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs gap-1.5">
            <Mic className="h-3 w-3" />
            ElevenLabs Conversational AI
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                <p className="text-xs">Modernste Sprach-KI mit natürlicher Intonation, Echtzeitverarbeitung und mehrsprachiger Unterstützung.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Presets grid */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Stimmprofil</label>
          <p className="text-[10px] text-muted-foreground/70 mb-2">Powered by ElevenLabs — natürlichste KI-Stimmen weltweit.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => onUpdate({ voice_preset_key: p.key })}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-all hover:border-primary/50',
                  config.voice_preset_key === p.key
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-border/50 bg-muted/20'
                )}
              >
                <span className="text-lg">{p.emoji}</span>
                <p className="mt-1 font-medium text-xs">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {[
          { key: 'stability', label: 'Stabilität' },
          { key: 'clarity', label: 'Klarheit' },
          { key: 'speed', label: 'Tempo' },
        ].map(s => (
          <div key={s.key} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-mono">{vs[s.key as keyof typeof vs]}</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Number(vs[s.key as keyof typeof vs]) || 0]}
              onValueChange={([v]) => setVoice(s.key, v)}
            />
          </div>
        ))}

        {/* Mini preview */}
        {config.first_message && (
          <div className="rounded-md border border-border/50 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-1">Vorschau (Text)</p>
            <p className="text-sm italic">„{config.first_message}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
