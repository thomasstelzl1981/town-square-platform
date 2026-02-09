import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Cpu, Link2, CloudOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Connector {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'pending';
  lastSync?: string;
}

export function EinstellungenTab() {
  const [autoExtraction, setAutoExtraction] = useState(true);
  const [ocrEnabled, setOcrEnabled] = useState(true);

  // Mock connectors - in real app, fetch from integration_registry
  const connectors: Connector[] = [
    { id: 'posteingang', name: 'Posteingang (E-Mail)', icon: '📬', status: 'connected', lastSync: '2026-01-26T10:00:00Z' },
    { id: 'dropbox', name: 'Dropbox', icon: '📦', status: 'disconnected' },
    { id: 'gdrive', name: 'Google Drive', icon: '📁', status: 'disconnected' },
    { id: 'onedrive', name: 'OneDrive', icon: '☁️', status: 'disconnected' },
  ];

  const handleConnectorToggle = (connectorId: string) => {
    toast.info(`Connector ${connectorId} wird in einer zukünftigen Version verfügbar sein`);
  };

  const getStatusBadge = (status: Connector['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verbunden
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ausstehend
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <CloudOff className="h-3 w-3 mr-1" />
            Nicht verbunden
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Extraction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Automatische Extraktion
          </CardTitle>
          <CardDescription>
            KI-gestützte Dokumentenerkennung und Datenextraktion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-Extraktion aktivieren</div>
              <div className="text-sm text-muted-foreground">
                Extrahiert automatisch Texte, Daten und Metadaten aus hochgeladenen Dokumenten
              </div>
            </div>
            <Switch 
              checked={autoExtraction} 
              onCheckedChange={setAutoExtraction}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">OCR für Scans</div>
              <div className="text-sm text-muted-foreground">
                Erkennt Text in gescannten Dokumenten und Bildern
              </div>
            </div>
            <Switch 
              checked={ocrEnabled} 
              onCheckedChange={setOcrEnabled}
            />
          </div>

          {autoExtraction && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium mb-1">Unterstützte Formate:</div>
              <div className="text-muted-foreground">
                PDF, Word (DOC/DOCX), Excel (XLS/XLSX), Bilder (JPG/PNG), E-Mails (EML)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Cloud-Verbindungen
          </CardTitle>
          <CardDescription>
            Verbinden Sie externe Speicherdienste für automatischen Dokumentenimport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {connectors.map((connector) => (
            <div 
              key={connector.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{connector.icon}</span>
                <div>
                  <div className="font-medium">{connector.name}</div>
                  {connector.lastSync && (
                    <div className="text-xs text-muted-foreground">
                      Zuletzt synchronisiert: {new Date(connector.lastSync).toLocaleString('de-DE')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(connector.status)}
                <Button 
                  variant={connector.status === 'connected' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleConnectorToggle(connector.id)}
                >
                  {connector.status === 'connected' ? 'Trennen' : 'Verbinden'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Speichernutzung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verwendet</span>
              <span className="font-medium">0 MB von 5 GB</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '0%' }} />
            </div>
            <div className="text-xs text-muted-foreground">
              Upgrade auf einen höheren Plan für mehr Speicherplatz
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
