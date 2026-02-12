/**
 * Marketing Tab - Kaufy Listings & Landingpages
 * MOD-13 PROJEKTE — P0 Redesign
 * 
 * NEVER shows EmptyState only — stats always visible.
 * Kaufy toggle shows info about Sales Desk requirement (GP-05).
 */

import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Globe, Megaphone, Share2, ExternalLink, Sparkles, Users, Check, Link2, Shield, AlertCircle } from 'lucide-react';
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from 'sonner';

export default function MarketingTab() {
  const { projects, isLoading, updateProject } = useDevProjects();
  const [landingpageDialog, setLandingpageDialog] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });
  const [landingpageSlug, setLandingpageSlug] = useState('');

  if (isLoading) return <LoadingState />;

  // NO early return for empty projects — always show structure

  // Kaufy toggle is read-only — actual control is in SalesApprovalSection (VertriebTab)
  const getKaufyStatus = (project: any) => {
    if (project.kaufy_listed) return { label: 'Aktiv via Vertriebsauftrag', variant: 'default' as const };
    return { label: 'Nicht aktiv', variant: 'secondary' as const };
  };

  const handleFeaturedToggle = async (projectId: string, enabled: boolean) => {
    try {
      await updateProject.mutateAsync({ id: projectId, kaufy_featured: enabled });
      toast.success(enabled ? 'Premium-Platzierung aktiviert' : 'Premium-Platzierung deaktiviert');
    } catch { toast.error('Fehler beim Aktualisieren'); }
  };

  const handleLandingpageCreate = async () => {
    if (!landingpageDialog.projectId || !landingpageSlug) return;
    try {
      await updateProject.mutateAsync({ id: landingpageDialog.projectId, landingpage_slug: landingpageSlug.toLowerCase().replace(/[^a-z0-9-]/g, ''), landingpage_enabled: true });
      toast.success('Landingpage erstellt');
      setLandingpageDialog({ open: false, projectId: null });
      setLandingpageSlug('');
    } catch { toast.error('Fehler beim Erstellen der Landingpage'); }
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const listedProjects = projects.filter(p => p.kaufy_listed);
  const featuredProjects = projects.filter(p => p.kaufy_featured);

  return (
    <PageShell>
      <ModulePageHeader title="MARKETING & VERÖFFENTLICHUNG" description="Vermarkten Sie Ihre Projekte über Kaufy und eigene Landingpages" />

      {/* Stats — ALWAYS visible */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Auf Kaufy gelistet</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listedProjects.length}</div>
            <p className="text-xs text-muted-foreground">von {projects.length} Projekten</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Premium-Platzierung</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredProjects.length}</div>
            <p className="text-xs text-muted-foreground">Featured Listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Landingpages</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.landingpage_enabled).length}</div>
            <p className="text-xs text-muted-foreground">aktive Projekt-Seiten</p>
          </CardContent>
        </Card>
      </div>

      {/* Governance Hint */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Vertriebsauftrag erforderlich</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aktivieren Sie den Vertriebsauftrag im Reiter „Governance", um Kaufy-Listings und 
            Vertriebskanäle freizuschalten. Die Aktivierung erfolgt direkt ohne zusätzliche Freigabe.
          </p>
        </div>
      </div>

      {/* Kaufy Marktplatz */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Kaufy Marktplatz</CardTitle>
            <Badge variant="secondary">Kostenlos</Badge>
          </div>
          <CardDescription>Listen Sie Ihre Projekte kostenlos auf dem Kaufy-Marktplatz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Erstellen Sie ein Projekt im Dashboard, um Marketing-Optionen zu nutzen.
            </p>
          ) : activeProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine aktiven Projekte vorhanden. Aktivieren Sie ein Projekt im Portfolio.</p>
          ) : (
            activeProjects.map((project) => {
              const kaufyStatus = getKaufyStatus(project);
              return (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{project.name}</p>
                      <Badge variant={kaufyStatus.variant}>{kaufyStatus.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.city} · {project.total_units_count} Einheiten</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Steuerung über Vertrieb-Tab</p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Paid Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /><CardTitle>Projekt-Präsentation</CardTitle><Badge>200€/Monat</Badge>
            </div>
            <CardDescription>Featured Placement unter Kaufy → Projekte mit erweiterter Darstellung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {['Premium-Platzierung auf der Startseite', 'Erweiterte Bildergalerie', 'Hervorgehobene Einheiten-Liste', 'Direkter Kontakt-Button'].map(t => (
                <li key={t} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full" />{t}</li>
              ))}
            </ul>
            {listedProjects.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                {listedProjects.map(project => (
                  <div key={project.id} className="flex items-center justify-between text-sm">
                    <span>{project.name}</span>
                    <Switch checked={project.kaufy_featured || false} onCheckedChange={(checked) => handleFeaturedToggle(project.id, checked)} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /><CardTitle>Projekt-Landingpage</CardTitle><Badge>200€/Monat</Badge>
            </div>
            <CardDescription>Eigene Subdomain mit Investment-Rechner und Lead-Erfassung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {['Eigene URL (projekt.kaufy.de)', 'Integrierter Investment-Rechner', 'Lead-Formular mit CRM-Integration', 'Analytics & Conversion-Tracking'].map(t => (
                <li key={t} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full" />{t}</li>
              ))}
            </ul>
            {activeProjects.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                {activeProjects.map(project => (
                  <div key={project.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span>{project.name}</span>
                      {project.landingpage_slug && <span className="ml-2 text-muted-foreground"><Link2 className="inline h-3 w-3 mr-1" />{project.landingpage_slug}.kaufy.de</span>}
                    </div>
                    {project.landingpage_enabled ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">Aktiv</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => { setLandingpageSlug(project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')); setLandingpageDialog({ open: true, projectId: project.id }); }}>Erstellen</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Social Leadgen */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /><CardTitle>Social Lead Generation</CardTitle><Badge variant="outline">Coming Soon</Badge>
          </div>
          <CardDescription>Automatisierte Werbekampagnen auf Social Media mit Lead-Integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div><p className="font-medium">Integration mit MOD-10 Leads</p><p className="text-sm text-muted-foreground">Facebook, Instagram & Google Ads Kampagnen</p></div>
            </div>
            <Button variant="secondary" disabled>Bald verfügbar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Landingpage Dialog */}
      <Dialog open={landingpageDialog.open} onOpenChange={(open) => setLandingpageDialog({ ...landingpageDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projekt-Landingpage erstellen</DialogTitle>
            <DialogDescription>Wählen Sie eine URL für Ihre Projekt-Landingpage</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL-Slug</Label>
              <div className="flex items-center gap-2">
                <Input value={landingpageSlug} onChange={(e) => setLandingpageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="mein-projekt" />
                <span className="text-muted-foreground whitespace-nowrap">.kaufy.de</span>
              </div>
              <p className="text-sm text-muted-foreground">Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLandingpageDialog({ open: false, projectId: null })}>Abbrechen</Button>
            <Button onClick={handleLandingpageCreate} disabled={!landingpageSlug}>Landingpage erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
