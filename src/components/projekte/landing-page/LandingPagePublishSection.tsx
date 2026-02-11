/**
 * Landing Page — Publishing/Domain Section
 * 3 options: kaufy.app subdomain (36h preview), custom domain, new domain
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Link2, Server, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { LandingPage } from '@/hooks/useLandingPage';
import { usePublishLandingPage, useBookLandingPage } from '@/hooks/useLandingPage';

interface LandingPagePublishSectionProps {
  landingPage?: LandingPage | null;
}

export function LandingPagePublishSection({ landingPage }: LandingPagePublishSectionProps) {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const publishMutation = usePublishLandingPage();
  const bookMutation = useBookLandingPage();

  const status = landingPage?.status || 'draft';
  const slug = landingPage?.slug || '';

  // Calculate remaining preview time
  const getTimeRemaining = () => {
    if (!landingPage?.preview_expires_at) return null;
    const expires = new Date(landingPage.preview_expires_at).getTime();
    const now = Date.now();
    const diff = expires - now;
    if (diff <= 0) return 'Abgelaufen';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const handlePublish = async () => {
    if (!landingPage?.id) return;
    await publishMutation.mutateAsync(landingPage.id);
    setShowPublishDialog(false);
  };

  const handleBook = async () => {
    if (!landingPage?.id) return;
    await bookMutation.mutateAsync(landingPage.id);
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="space-y-4 pt-6 border-t">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Veröffentlichen & Domain</h3>
          <p className="text-sm text-muted-foreground">Schalten Sie Ihre Projekt-Website live</p>
        </div>
        {status === 'draft' && (
          <Button onClick={() => setShowPublishDialog(true)} className="gap-2">
            <Globe className="h-4 w-4" />
            Veröffentlichen
          </Button>
        )}
        {status === 'preview' && timeRemaining && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <Clock className="h-4 w-4" />
              <span>Vorschau läuft ab in: <strong>{timeRemaining}</strong></span>
            </div>
            <Button onClick={handleBook} variant="default" className="gap-2" disabled={bookMutation.isPending}>
              {bookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Jetzt buchen (200 €/Mo)
            </Button>
          </div>
        )}
        {status === 'active' && (
          <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
            <CheckCircle2 className="h-3 w-3" />
            Aktiv
          </Badge>
        )}
        {status === 'locked' && (
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Gesperrt
            </Badge>
            <Button onClick={handleBook} variant="default" size="sm" disabled={bookMutation.isPending}>
              Freischalten (200 €/Mo)
            </Button>
          </div>
        )}
      </div>

      {/* Domain Options */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Option 1: kaufy.app Subdomain */}
        <Card className={status !== 'draft' ? 'border-primary/30' : 'border-dashed'}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">kaufy.app Subdomain</h4>
                <p className="text-xs text-muted-foreground">Kostenlose 36h-Vorschau</p>
              </div>
            </div>
            {slug && (
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">{slug}.kaufy.app</p>
            )}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {status === 'draft' ? 'Bereit' : status === 'preview' ? 'Live (Vorschau)' : status === 'active' ? 'Aktiv' : 'Gesperrt'}
              </Badge>
              {status === 'draft' && (
                <Button variant="outline" size="sm" onClick={() => setShowPublishDialog(true)}>
                  Aktivieren
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Custom Domain */}
        <Card className="border-dashed">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Link2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Eigene Domain</h4>
                <p className="text-xs text-muted-foreground">DNS-Anbindung via A-Record</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">Nicht konfiguriert</Badge>
              <Button variant="outline" size="sm" disabled>Einrichten</Button>
            </div>
          </CardContent>
        </Card>

        {/* Option 3: New Domain */}
        <Card className="border-dashed">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Domain buchen</h4>
                <p className="text-xs text-muted-foreground">Neue Domain registrieren</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">Bald verfügbar</Badge>
              <Button variant="outline" size="sm" disabled>Domain suchen</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Website veröffentlichen</DialogTitle>
            <DialogDescription>
              Ihre Projekt-Website wird unter <strong>{slug}.kaufy.app</strong> veröffentlicht. 
              Sie haben <strong>36 Stunden</strong> kostenlose Vorschauzeit. Danach wird die Seite gesperrt, 
              es sei denn, Sie buchen das Landing-Page-Paket (200 €/Monat).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>Sofort live unter <span className="font-mono text-xs">{slug}.kaufy.app</span></span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <span>36 Stunden kostenlose Vorschau inkl. funktionaler Investment Engine</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <span>Nach Ablauf wird die Seite automatisch gesperrt, bis Sie das Paket buchen</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Abbrechen</Button>
            <Button onClick={handlePublish} disabled={publishMutation.isPending} className="gap-2">
              {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Jetzt veröffentlichen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
