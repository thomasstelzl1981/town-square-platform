/**
 * LandingPageBuilder — Entry State (Zustand A)
 * Explanation card + CTA to generate landing page draft
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Globe, BarChart3, Building2, FileText, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LandingPageBuilderProps {
  projectName: string;
  isDemo: boolean;
  onGenerate: () => void;
}

export function LandingPageBuilder({ projectName, isDemo, onGenerate }: LandingPageBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    // Simulate generation progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onGenerate(), 300);
          return 100;
        }
        return prev + Math.random() * 25 + 10;
      });
    }, 400);
  };

  const tabs = [
    { icon: BarChart3, label: 'Investment', desc: 'Einheiten als Investment-Kacheln mit Rendite-Rechner' },
    { icon: Building2, label: 'Projekt', desc: 'Projektbeschreibung, Highlights und Galerie' },
    { icon: Globe, label: 'Anbieter', desc: 'Bauträger-Profil und Referenzen' },
    { icon: FileText, label: 'Legal & Dokumente', desc: 'Downloads, Disclaimer und Unterlagen' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Explanation Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Landing Page Builder</h3>
              {isDemo && (
                <Badge variant="secondary" className="mt-1 opacity-60">Beispieldaten</Badge>
              )}
              <div className="mt-3 space-y-2 text-muted-foreground">
                <p>
                  Erstellen Sie aus Ihrem Exposé automatisch eine professionelle Projekt-Landingpage.
                  Die Website zeigt alle Einheiten als Investment-Kacheln mit interaktivem Rendite-Rechner.
                </p>
                <p>
                  Jede Einheit erhält ein vollständiges Verkaufsexposé mit Investment Engine — 
                  genau wie bei Kaufy, aber im Design Ihres Projekts „{projectName}".
                </p>
              </div>
            </div>
          </div>

          {/* Generation CTA */}
          {isGenerating ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analysiere Exposé und generiere Website-Entwurf…</span>
                <span className="font-medium">{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <Button size="lg" onClick={handleGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                KI-Entwurf generieren
              </Button>
              <Button variant="ghost" size="lg" className="gap-2" onClick={() => {
                document.getElementById('tab-outline-section')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                <ArrowDown className="h-4 w-4" />
                Vorschau-Struktur ansehen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Outline Preview */}
      <div id="tab-outline-section" className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Website-Struktur (4 Seiten)
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          {tabs.map((tab, i) => (
            <Card key={tab.label} className="border-dashed border-muted-foreground/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <tab.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Seite {i + 1}</span>
                      <h5 className="font-semibold">{tab.label}</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">{tab.desc}</p>
                    {/* Skeleton placeholder */}
                    <div className="space-y-1.5 pt-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
