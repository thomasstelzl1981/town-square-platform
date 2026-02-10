/**
 * Social Media Templates — Kaufy CI Template-Verwaltung (Zone 1)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image, Plus, Settings, Eye } from 'lucide-react';

const templates = [
  { code: 'T1', name: 'Rendite-Highlight', format: 'slideshow_4', active: true, version: 'v1.2' },
  { code: 'T2', name: 'Berater-Portrait', format: 'slideshow_4', active: true, version: 'v1.0' },
  { code: 'T3', name: 'Objekt-Showcase', format: 'slideshow_4', active: true, version: 'v1.1' },
  { code: 'T4', name: 'Testimonial', format: 'slideshow_4', active: true, version: 'v1.0' },
  { code: 'T5', name: 'Region-Focus', format: 'slideshow_4', active: true, version: 'v1.0' },
];

export default function SocialMediaTemplates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Image className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Templates & CI</h1>
            <p className="text-sm text-muted-foreground">Kaufy CI Template-Verwaltung für Selfie Ads</p>
          </div>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Template anlegen</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.code} className="glass-card">
            <CardContent className="p-5 space-y-3">
              <div className="h-24 rounded-lg bg-muted/30 border border-dashed border-border flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.code}: {t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.format} · {t.version}</p>
                </div>
                <Badge variant={t.active ? 'default' : 'outline'}>{t.active ? 'Aktiv' : 'Inaktiv'}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1"><Eye className="h-3 w-3" /> Vorschau</Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1"><Settings className="h-3 w-3" /> Bearbeiten</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
