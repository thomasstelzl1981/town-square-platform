/**
 * DesktopInstallBanner — In-App Install Prompt for Desktop (MUX-053)
 * Shows a dismissible banner when beforeinstallprompt fires on desktop.
 */
import { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'armstrong-desktop-install-dismissed';

export function DesktopInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(true); // default hidden

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (/Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)) return;
    
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (wasDismissed) return;

    setDismissed(false);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => void }).prompt();
    setDeferredPrompt(null);
    setDismissed(true);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  }, []);

  if (dismissed || !deferredPrompt) return null;

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 max-w-sm',
      'bg-card border rounded-xl shadow-lg p-4',
      'flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300'
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Armstrong als App installieren</p>
        <p className="text-xs text-muted-foreground mt-0.5">Schnellerer Zugriff, eigenes Fenster</p>
      </div>
      <Button size="sm" onClick={handleInstall} className="shrink-0">
        <Download className="h-4 w-4 mr-1" />
        Installieren
      </Button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground"
        aria-label="Schließen"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
