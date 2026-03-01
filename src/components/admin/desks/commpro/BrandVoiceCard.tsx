/**
 * BrandVoiceCard — Zone 1 voice settings with real ElevenLabs voice selection.
 * Replaces the frozen MOD-14 VoiceSettingsCard import in BrandAssistantPanel.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mic, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PhoneAssistantConfig } from '@/hooks/usePhoneAssistant';

const ELEVENLABS_VOICES = [
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', desc: 'Deutsch-optimiert, männlich', lang: '🇩🇪' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', desc: 'Warm, weiblich', lang: '🇩🇪' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', desc: 'Professionell, männlich', lang: '🌍' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', desc: 'Freundlich, weiblich', lang: '🌍' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', desc: 'Seriös, männlich', lang: '🌍' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', desc: 'Ruhig, männlich', lang: '🌍' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', desc: 'Klar, weiblich', lang: '🌍' },
] as const;

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

export function BrandVoiceCard({ config, onUpdate }: Props) {
  const vs = config.voice_settings as Record<string, any>;
  const currentVoiceId = (vs.voice_id as string) || 'FGY2WhTYpPnrIDTdsKH5';

  const setVoice = (key: string, val: number) => {
    onUpdate({ voice_settings: { ...vs, [key]: val } as any });
  };

  const setVoiceId = (voiceId: string) => {
    onUpdate({ voice_settings: { ...vs, voice_id: voiceId } as any });
  };

  const currentVoice = ELEVENLABS_VOICES.find(v => v.id === currentVoiceId);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="h-4 w-4 text-primary" />
          Stimme & Voice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ElevenLabs Voice Selection */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">ElevenLabs Stimme</label>
          <Select value={currentVoiceId} onValueChange={setVoiceId}>
            <SelectTrigger>
              <SelectValue>
                {currentVoice ? `${currentVoice.lang} ${currentVoice.name} — ${currentVoice.desc}` : 'Stimme wählen…'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ELEVENLABS_VOICES.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex items-center gap-2">
                    <span>{v.lang}</span>
                    <span className="font-medium">{v.name}</span>
                    <span className="text-muted-foreground">— {v.desc}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Presets grid */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Stimmprofil</label>
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
              value={[Number(vs[s.key as keyof typeof vs]) || 50]}
              onValueChange={([v]) => setVoice(s.key, v)}
            />
          </div>
        ))}

        {/* Sync reminder */}
        <div className="flex items-start gap-2 rounded-md border border-accent bg-accent/20 p-3">
          <Info className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Änderungen werden automatisch gespeichert. Drücke danach <Badge variant="outline" className="text-[10px] px-1.5 py-0">Agent synchronisieren</Badge> damit ElevenLabs die neuen Einstellungen übernimmt.
          </p>
        </div>

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
