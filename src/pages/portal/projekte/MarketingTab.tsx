/**
 * Marketing Tab - Kaufy Listings & Landingpages
 * MOD-13 PROJEKTE
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Globe, Megaphone, Share2, ExternalLink, Sparkles, Users } from 'lucide-react';
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';

export default function MarketingTab() {
  const { projects, isLoading } = useDevProjects();

  if (isLoading) {
    return <LoadingState />;
  }

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Keine Projekte vorhanden"
          description="Erstellen Sie ein Projekt im Portfolio-Tab, um Marketing-Optionen zu nutzen."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Marketing & Veröffentlichung</h2>
        <p className="text-muted-foreground">
          Vermarkten Sie Ihre Projekte über Kaufy und eigene Landingpages
        </p>
      </div>

      {/* Free Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Kaufy Marktplatz</CardTitle>
            <Badge variant="secondary">Kostenlos</Badge>
          </div>
          <CardDescription>
            Listen Sie Ihre Projekte kostenlos auf dem Kaufy-Marktplatz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.filter(p => p.status === 'active').slice(0, 3).map((project) => (
            <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground">
                  {project.city} · {project.total_units_count} Einheiten
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Auf Kaufy listen</span>
                  <Switch />
                </div>
              </div>
            </div>
          ))}
          
          {projects.filter(p => p.status !== 'active').length > 0 && (
            <p className="text-sm text-muted-foreground">
              {projects.filter(p => p.status !== 'active').length} weitere Projekte (nicht aktiv)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Paid Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Projekt-Präsentation</CardTitle>
              <Badge>200€/Monat</Badge>
            </div>
            <CardDescription>
              Featured Placement unter Kaufy → Projekte mit erweiterter Darstellung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Premium-Platzierung auf der Startseite
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Erweiterte Bildergalerie
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Hervorgehobene Einheiten-Liste
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Direkter Kontakt-Button
              </li>
            </ul>
            <Button className="w-full" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Jetzt aktivieren
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Projekt-Landingpage</CardTitle>
              <Badge>200€/Monat</Badge>
            </div>
            <CardDescription>
              Eigene Subdomain mit Investment-Rechner und Lead-Erfassung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Eigene URL (projekt.kaufy.de)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Integrierter Investment-Rechner
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Lead-Formular mit CRM-Integration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Analytics & Conversion-Tracking
              </li>
            </ul>
            <Button className="w-full" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Landingpage erstellen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Social Leadgen */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle>Social Lead Generation</CardTitle>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
          <CardDescription>
            Automatisierte Werbekampagnen auf Social Media mit Lead-Integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Integration mit MOD-10 Leads</p>
                <p className="text-sm text-muted-foreground">
                  Facebook, Instagram & Google Ads Kampagnen
                </p>
              </div>
            </div>
            <Button variant="secondary" disabled>
              Bald verfügbar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
