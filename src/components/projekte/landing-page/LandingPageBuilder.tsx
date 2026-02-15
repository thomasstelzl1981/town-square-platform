/**
 * LandingPageBuilder — Entry State (Zustand A)
 * Optional URL dialog + real landing page generation with AI location description
 */
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Globe, BarChart3, Building2, FileText, ArrowDown, Link2, SkipForward } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCreateLandingPage, generateSlug } from '@/hooks/useLandingPage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LandingPageBuilderProps {
  projectName: string;
  isDemo: boolean;
  projectId?: string;
  organizationId?: string;
  projectAddress?: string;
  projectCity?: string;
  projectPostalCode?: string;
}

const GENERATION_STEPS = [
  'Projektdaten werden geladen…',
  'Lagebeschreibung wird generiert…',
  'Anbieter-Profil wird erstellt…',
  'Website wird zusammengesetzt…',
];

export function LandingPageBuilder({ projectName, isDemo, projectId, organizationId, projectAddress, projectCity, projectPostalCode }: LandingPageBuilderProps) {
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [developerUrl, setDeveloperUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [structureHighlighted, setStructureHighlighted] = useState(false);

  const createLandingPage = useCreateLandingPage();

  const startGeneration = async (url?: string) => {
    setShowUrlDialog(false);
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep(0);

    try {
      // Step 1: Load project data
      setCurrentStep(0);
      setProgress(15);
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Generate location description via AI
      setCurrentStep(1);
      setProgress(35);
      let locationDescription = '';
      
      if (!isDemo && projectId) {
        try {
          const { data, error } = await supabase.functions.invoke('sot-generate-landing-page', {
            body: {
              project_name: projectName,
              address: projectAddress || '',
              city: projectCity || '',
              postal_code: projectPostalCode || '',
            },
          });
          if (!error && data?.location_description) {
            locationDescription = data.location_description;
          }
        } catch (e) {
          console.warn('AI location generation failed, using fallback:', e);
        }
      }

      setProgress(60);

      // Step 3: Build profile
      setCurrentStep(2);
      setProgress(75);
      await new Promise(r => setTimeout(r, 400));

      // Step 4: Assemble
      setCurrentStep(3);
      setProgress(90);

      // Create landing page in DB
      if (!isDemo && projectId && organizationId) {
        const slug = generateSlug(projectName);
        await createLandingPage.mutateAsync({
          project_id: projectId,
          organization_id: organizationId,
          slug,
          hero_headline: projectName,
          hero_subheadline: `Kapitalanlage-Immobilien in bester Lage`,
          location_description: locationDescription || undefined,
          developer_website_url: url || undefined,
        });
      } else {
        // Demo mode: just simulate
        await new Promise(r => setTimeout(r, 500));
        toast.success('Demo-Website erstellt', { description: 'Im Demo-Modus wird keine echte Website erzeugt.' });
      }

      setProgress(100);
    } catch (err) {
      console.error('Generation failed:', err);
      toast.error('Fehler bei der Generierung');
      setIsGenerating(false);
    }
  };

  const handleStartClick = () => {
    if (isDemo) {
      startGeneration();
      return;
    }
    setShowUrlDialog(true);
  };

  const tabs = [
    { icon: BarChart3, label: 'Investment', desc: 'Einheiten als Investment-Kacheln mit Rendite-Rechner' },
    { icon: Building2, label: 'Lage & Umgebung', desc: 'KI-generierte Lagebeschreibung und Infrastruktur' },
    { icon: Globe, label: 'Anbieter', desc: 'Bauträger-Profil und Referenzen' },
    { icon: FileText, label: 'Legal & Dokumente', desc: 'Downloads, Disclaimer und Unterlagen' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Explanation Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
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
                <span className="text-muted-foreground">
                  {GENERATION_STEPS[currentStep] || 'Wird generiert…'}
                </span>
                <span className="font-medium">{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <Button size="lg" onClick={handleStartClick} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Website erstellen
              </Button>
              <Button variant="ghost" size="lg" className="gap-2" onClick={() => {
                document.getElementById('tab-outline-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setStructureHighlighted(true);
                setTimeout(() => setStructureHighlighted(false), 1500);
              }}>
                <ArrowDown className="h-4 w-4" />
                Vorschau-Struktur ansehen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Outline Preview */}
      <div id="tab-outline-section" className={cn(
        'space-y-4 p-4 rounded-xl transition-all duration-500',
        structureHighlighted && 'ring-2 ring-primary/50 bg-primary/5'
      )}>
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

      {/* URL Dialog */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Unternehmens-Website (optional)
            </DialogTitle>
            <DialogDescription>
              Geben Sie Ihre Unternehmens-Website an, damit wir weitere Informationen 
              für Ihre Projekt-Website beziehen können. Dieser Schritt ist optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="dev-url">Website-URL</Label>
            <Input
              id="dev-url"
              placeholder="https://www.mein-unternehmen.de"
              value={developerUrl}
              onChange={(e) => setDeveloperUrl(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => startGeneration()} className="gap-1.5">
              <SkipForward className="h-4 w-4" />
              Überspringen
            </Button>
            <Button onClick={() => startGeneration(developerUrl)} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Weiter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
