/**
 * Social Media Creator — Kaufy interner Creator (Zone 1)
 * Seitenbasiert: Plattform, Ziel, Templates, Generate, Publish
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Image, Send } from 'lucide-react';

export default function SocialMediaCreator() {
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

      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium">Plattform & Ziel</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Plattformen</Label>
              <div className="flex gap-2">
                {['LinkedIn', 'Facebook', 'Instagram'].map(p => (
                  <Badge key={p} variant="outline" className="cursor-pointer hover:bg-primary/10">{p}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ziel</Label>
              <div className="flex gap-2">
                {['Awareness', 'Leads', 'Engagement'].map(z => (
                  <Badge key={z} variant="outline" className="cursor-pointer hover:bg-primary/10">{z}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget (optional)</Label>
              <Input type="number" placeholder="EUR" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Template-Auswahl</h3>
          <div className="grid grid-cols-5 gap-3">
            {['Rendite-Highlight', 'Portrait', 'Showcase', 'Testimonial', 'Region'].map((t, i) => (
              <div key={t} className="p-3 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:border-primary/40 cursor-pointer text-center">
                <div className="h-14 w-full rounded-lg bg-muted/50 mb-2 flex items-center justify-center">
                  <Image className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-xs">T{i + 1}: {t}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate & Publish</h3>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" /> Generieren</Button>
            <Button className="gap-2"><Send className="h-4 w-4" /> Veröffentlichen</Button>
          </div>
          <div className="h-32 rounded-lg bg-muted/30 border border-dashed border-border flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Generierte Creatives erscheinen hier</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
