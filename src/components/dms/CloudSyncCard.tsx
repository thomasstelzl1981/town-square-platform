/**
 * CloudSyncCard — Shows cloud storage sync options (Google Drive, Dropbox, OneDrive).
 * Currently informational only; becomes functional when connectors are available.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Cloud, HardDrive, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CloudProvider {
  name: string;
  description: string;
  icon: string;
  status: 'available' | 'coming_soon';
}

const PROVIDERS: CloudProvider[] = [
  {
    name: 'Google Drive',
    description: 'Dokumente automatisch mit Google Drive synchronisieren',
    icon: '🟢',
    status: 'coming_soon',
  },
  {
    name: 'Dropbox',
    description: 'Nahtlose Anbindung an Ihren Dropbox-Speicher',
    icon: '🔵',
    status: 'coming_soon',
  },
  {
    name: 'Microsoft OneDrive',
    description: 'Integration mit OneDrive und SharePoint',
    icon: '🟣',
    status: 'coming_soon',
  },
];

export function CloudSyncCard() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Cloud className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Cloud-Synchronisation</p>
            <p className="text-xs text-muted-foreground">
              Verbinden Sie externe Cloud-Speicher mit Ihrem Datenraum
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/30"
            >
              <span className="text-lg shrink-0">{provider.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{provider.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground">
                    Bald verfügbar
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{provider.description}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
          <HardDrive className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Cloud-Sync ermöglicht die automatische Zwei-Wege-Synchronisation zwischen Ihrem
            Datenraum und externen Speicherdiensten. Neue Dokumente werden automatisch
            importiert und per KI verarbeitet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
