/**
 * Selfie Ads Planen — Kampagne planen (Zone 2)
 * Seitenbasiert mit 5 Abschnitten: Parameter, Templates (5 Slots), Personalisierung, Generieren, Zusammenfassung
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Megaphone, Image, Sparkles, User, FileText, ArrowRight, Check, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TEMPLATE_NAMES = [
  { key: 'T1', name: 'Rendite-Highlight', format: 'Slideshow (4 Slides)' },
  { key: 'T2', name: 'Berater-Portrait', format: 'Slideshow (4 Slides)' },
  { key: 'T3', name: 'Objekt-Showcase', format: 'Slideshow (4 Slides)' },
  { key: 'T4', name: 'Testimonial', format: 'Slideshow (4 Slides)' },
  { key: 'T5', name: 'Region-Focus', format: 'Slideshow (4 Slides)' },
];

const PRESETS = ['Kapitalanlage', 'Immobilien', 'Vermietung', 'Finanzierung'];

export default function SelfieAdsPlanen() {
  const navigate = useNavigate();
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(['Kapitalanlage']);

  const toggleSlot = (key: string) => {
    setSelectedSlots(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  const togglePreset = (p: string) => {
    setSelectedPresets(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="space-y-8 p-1 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Kampagne planen</h1>
          <p className="text-sm text-muted-foreground">Kaufy Selfie Ads — Social-Media-Mandat konfigurieren</p>
        </div>
      </div>

      {/* ABSCHNITT A — Parameter */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-medium">A) Kampagnen-Parameter</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ziel</Label>
              <Input value="Kapitalanleger-Leads" disabled className="bg-muted/30" />
              <p className="text-xs text-muted-foreground">Fix im MVP</p>
            </div>
            <div className="space-y-2">
              <Label>Plattform</Label>
              <Input value="Facebook + Instagram (Paid)" disabled className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label>Laufzeit von</Label>
              <Input type="date" defaultValue="2026-03-01" />
            </div>
            <div className="space-y-2">
              <Label>Laufzeit bis</Label>
              <Input type="date" defaultValue="2026-03-31" />
            </div>
            <div className="space-y-2">
              <Label>Gesamtbudget (EUR)</Label>
              <Input type="number" defaultValue={2500} min={500} step={100} />
            </div>
            <div className="space-y-2">
              <Label>Regionen (max. 3)</Label>
              <Input placeholder="z.B. München, Berlin, Hamburg" defaultValue="München" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Zielgruppe Presets</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Badge
                  key={p}
                  variant={selectedPresets.includes(p) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => togglePreset(p)}
                >
                  {selectedPresets.includes(p) && <Check className="h-3 w-3 mr-1" />}
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABSCHNITT B — 5 Template-Slots */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-4 w-4 text-primary" />
            <h2 className="font-medium">B) Template-Slots (5 Kaufy CI Templates)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TEMPLATE_NAMES.map((t) => {
              const isSelected = selectedSlots.includes(t.key);
              return (
                <div
                  key={t.key}
                  onClick={() => toggleSlot(t.key)}
                  className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-dashed border-border bg-muted/20 hover:border-primary/40'
                  }`}
                >
                  <Badge variant={isSelected ? 'default' : generated && isSelected ? 'secondary' : 'outline'} className="absolute top-2 right-2 text-[10px]">
                    {generated && isSelected ? 'Generiert' : isSelected ? 'Gewählt' : 'Leer'}
                  </Badge>
                  <div className="h-16 w-full rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                    <Image className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs font-medium">{t.key}: {t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.format}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ABSCHNITT C — Personalisierung */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-medium">C) Personalisierung (Kaufy CI)</h2>
          </div>
          <p className="text-xs text-muted-foreground">Wird über Kaufy Social-Media-Accounts veröffentlicht</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Beraterportrait</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <Button variant="outline" size="sm">Foto hochladen</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Ihr Name" />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input placeholder="z.B. München & Umgebung" />
            </div>
            <div className="space-y-2">
              <Label>Claim (max. 80 Zeichen)</Label>
              <Input placeholder="Ihr persönlicher Claim" maxLength={80} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABSCHNITT D — Generieren */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-medium">D) Creatives generieren</h2>
            </div>
            <Button
              onClick={() => setGenerated(true)}
              disabled={selectedSlots.length === 0}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generieren ({selectedSlots.length} Slots)
            </Button>
          </div>

          {generated && selectedSlots.length > 0 && (
            <div className="space-y-4 mt-4">
              {selectedSlots.map((slotKey) => {
                const tmpl = TEMPLATE_NAMES.find(t => t.key === slotKey)!;
                return (
                  <div key={slotKey} className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{slotKey}: {tmpl.name}</p>
                      <Badge variant="secondary">Generiert</Badge>
                    </div>
                    {/* 4-Slide Thumbnails */}
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((slide) => (
                        <div key={slide} className="h-16 w-20 rounded-md bg-muted/60 border border-border/50 flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">Slide {slide}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Caption / Hook</Label>
                        <Input defaultValue={`${tmpl.name} — Ihre Chance auf sichere Rendite in der Region`} className="text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">CTA</Label>
                        <Input defaultValue="Jetzt kostenlos beraten lassen" className="text-xs" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ABSCHNITT E — Zusammenfassung */}
      {generated && selectedSlots.length > 0 && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-medium">E) Mandat-Zusammenfassung</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Budget</span><p className="font-medium">2.500 €</p></div>
              <div><span className="text-muted-foreground text-xs">Laufzeit</span><p className="font-medium">01.03. – 31.03.2026</p></div>
              <div><span className="text-muted-foreground text-xs">Regionen</span><p className="font-medium">München</p></div>
              <div><span className="text-muted-foreground text-xs">Templates</span><p className="font-medium">{selectedSlots.length} Slots</p></div>
            </div>
            <Separator />
            <Button onClick={() => navigate('/portal/leads/selfie-ads-summary')} className="w-full gap-2">
              Zur Mandatszusammenfassung <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
