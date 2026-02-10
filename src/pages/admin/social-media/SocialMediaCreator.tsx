/**
 * Social Media Creator — Kaufy interner Creator (Zone 1)
 * Vollständige seitenbasierte Eingabe mit State
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Image, Send, Loader2, Check, Calendar, Target } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = ['LinkedIn', 'Facebook', 'Instagram'];
const GOALS = ['Awareness', 'Leads', 'Engagement'];
const TEMPLATES = [
  { key: 'T1', name: 'Rendite-Highlight' },
  { key: 'T2', name: 'Berater-Portrait' },
  { key: 'T3', name: 'Objekt-Showcase' },
  { key: 'T4', name: 'Testimonial' },
  { key: 'T5', name: 'Region-Focus' },
];

export default function SocialMediaCreator() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['LinkedIn']);
  const [selectedGoal, setSelectedGoal] = useState('Awareness');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [budget, setBudget] = useState('');
  const [caption, setCaption] = useState('');

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleTemplate = (key: string) => {
    setSelectedTemplates(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const handleGenerate = async () => {
    if (selectedTemplates.length === 0) {
      toast.error('Bitte mindestens ein Template auswählen');
      return;
    }
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setGenerated(true);
    setCaption('Kaufy — Ihr Partner für sichere Kapitalanlagen. Entdecken Sie exklusive Immobilien-Investments mit attraktiver Rendite.');
    setIsGenerating(false);
    toast.success(`${selectedTemplates.length} Creatives generiert`);
  };

  const handlePublish = () => {
    toast.success('Kampagne wird veröffentlicht...', {
      description: `${selectedPlatforms.join(', ')} · ${selectedTemplates.length} Creatives`,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Creator</h1>
          <p className="text-sm text-muted-foreground">Kaufy-eigene Social-Media-Inhalte erstellen</p>
        </div>
      </div>

      {/* Plattform & Ziel */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Target className="h-4 w-4" /> Plattform & Ziel</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plattformen</Label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map(p => (
                  <Badge
                    key={p}
                    variant={selectedPlatforms.includes(p) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => togglePlatform(p)}
                  >
                    {selectedPlatforms.includes(p) && <Check className="h-3 w-3 mr-1" />}
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ziel</Label>
              <div className="flex gap-2 flex-wrap">
                {GOALS.map(z => (
                  <Badge
                    key={z}
                    variant={selectedGoal === z ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedGoal(z)}
                  >
                    {selectedGoal === z && <Check className="h-3 w-3 mr-1" />}
                    {z}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget (optional, EUR)</Label>
              <Input type="number" placeholder="EUR" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template-Auswahl */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Template-Auswahl</h3>
          <div className="grid grid-cols-5 gap-3">
            {TEMPLATES.map((t) => {
              const isSelected = selectedTemplates.includes(t.key);
              return (
                <div
                  key={t.key}
                  onClick={() => toggleTemplate(t.key)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-dashed border-border bg-muted/20 hover:border-primary/40'
                  }`}
                >
                  <div className="h-14 w-full rounded-lg bg-muted/50 mb-2 flex items-center justify-center">
                    {isSelected ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Image className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-xs font-medium">{t.key}: {t.name}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{selectedTemplates.length}/5 gewählt</p>
        </CardContent>
      </Card>

      {/* Generate & Publish */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate & Publish</h3>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={handleGenerate} disabled={selectedTemplates.length === 0 || isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Generiere...' : `Generieren (${selectedTemplates.length})`}
            </Button>
            <Button className="gap-2" disabled={!generated} onClick={handlePublish}>
              <Send className="h-4 w-4" /> Veröffentlichen
            </Button>
          </div>

          {generated ? (
            <div className="space-y-3 mt-4">
              {selectedTemplates.map(key => {
                const tmpl = TEMPLATES.find(t => t.key === key)!;
                return (
                  <div key={key} className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{key}: {tmpl.name}</p>
                      <Badge variant="default" className="text-[10px]">✓ Generiert</Badge>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 flex-1 rounded bg-muted/50 border border-border/30 flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground">Slide {i}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Caption</Label>
                      <Input value={caption} onChange={e => setCaption(e.target.value)} className="text-xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 rounded-lg bg-muted/30 border border-dashed border-border flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Generierte Creatives erscheinen hier</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
