import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Bell, Shield, FileText } from 'lucide-react';

export default function EinstellungenTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Finanzierungseinstellungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie Ihre Präferenzen für Finanzierungsanträge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Benachrichtigungen
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status-Updates per E-Mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Erhalten Sie E-Mails bei Statusänderungen
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Erinnerungen für unvollständige Anträge</Label>
                  <p className="text-sm text-muted-foreground">
                    Wöchentliche Erinnerung bei offenen Dokumenten
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Dokumente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatische Dokumentenerkennung</Label>
                  <p className="text-sm text-muted-foreground">
                    KI-gestützte Klassifizierung hochgeladener Dokumente
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Duplikatwarnung</Label>
                  <p className="text-sm text-muted-foreground">
                    Warnung bei bereits hochgeladenen Dokumenten
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Datenschutz
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>SCHUFA-Abfrage erlauben</Label>
                  <p className="text-sm text-muted-foreground">
                    Zustimmung zur Bonitätsprüfung bei Einreichung
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
