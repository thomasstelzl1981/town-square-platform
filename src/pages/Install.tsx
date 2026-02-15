/**
 * Install Page — PWA Install Prompt (MUX-032)
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, Check, Share } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => void }).prompt();
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className={DESIGN.CARD.BASE}>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold">App bereits installiert</h1>
            <p className="text-muted-foreground">Du kannst die App über dein Home-Screen öffnen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className={cn(DESIGN.CARD.BASE, 'max-w-md w-full')}>
        <CardContent className="py-10 space-y-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">App installieren</h1>
            <p className="text-muted-foreground text-sm">
              Installiere die App auf deinem Gerät für schnellen Zugriff und Offline-Nutzung.
            </p>
          </div>

          {isIOS ? (
            <div className="space-y-3 text-left bg-muted/50 rounded-xl p-4">
              <p className="font-medium text-sm">So installierst du auf iPhone/iPad:</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Share className="h-5 w-5 shrink-0" />
                <span>Tippe auf <strong>Teilen</strong> in der Safari-Leiste</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Download className="h-5 w-5 shrink-0" />
                <span>Wähle <strong>Zum Home-Bildschirm</strong></span>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="lg" className="w-full h-14 text-base">
              <Download className="h-5 w-5 mr-2" />
              Jetzt installieren
            </Button>
          ) : (
            <div className="space-y-3 text-left bg-muted/50 rounded-xl p-4">
              <p className="font-medium text-sm">So installierst du die App:</p>
              <p className="text-sm text-muted-foreground">
                Öffne das Browser-Menü (⋮) und wähle <strong>„App installieren"</strong> oder <strong>„Zum Startbildschirm hinzufügen"</strong>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
