import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Building2, 
  Bell, 
  Mail, 
  Clock,
  Star,
  Coins,
  ExternalLink
} from 'lucide-react';

const EinstellungenTab = () => {
  const [autoReminders, setAutoReminders] = useState(false);
  const [autoReports, setAutoReports] = useState(false);
  const activeUnits = 0; // TODO: Fetch from DB
  const creditsPerUnit = 40;

  return (
    <div className="space-y-6">
      {/* Premium Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            Premium-Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">MSV Premium</p>
              <p className="text-sm text-muted-foreground">
                Automatisches Mahnwesen & Mietberichte
              </p>
            </div>
            <Badge variant="outline">Nicht aktiviert</Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Credits-Verbrauch</p>
                <p className="text-xs text-muted-foreground">
                  {creditsPerUnit} Credits / Einheit / Monat
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{activeUnits * creditsPerUnit} Credits</p>
              <p className="text-xs text-muted-foreground">
                {activeUnits} aktive Einheiten
              </p>
            </div>
          </div>

          <Button className="w-full" disabled={activeUnits === 0}>
            Premium aktivieren
          </Button>
        </CardContent>
      </Card>

      {/* Automatisierung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Automatisierung
          </CardTitle>
          <CardDescription>
            Automatische Aktionen für Premium-Nutzer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Automatische Mahnungen</Label>
                <p className="text-xs text-muted-foreground">
                  Mahnung zum 10. wenn Miete nicht eingegangen
                </p>
              </div>
            </div>
            <Switch 
              checked={autoReminders} 
              onCheckedChange={setAutoReminders}
              disabled
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Automatische Mietberichte</Label>
                <p className="text-xs text-muted-foreground">
                  Monatsbericht zum 15. per E-Mail
                </p>
              </div>
            </div>
            <Switch 
              checked={autoReports} 
              onCheckedChange={setAutoReports}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* FinAPI Stub */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Kontoanbindung
            <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">Automatische Kontoanbindung</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mit der Kontoanbindung werden Mieteingänge automatisch erkannt 
              und den richtigen Mietverhältnissen zugeordnet.
            </p>
            <Button variant="outline" className="mt-4" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              Interesse bekunden
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Geplante Features:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Automatische Transaktionserkennung</li>
              <li>Zuordnung zu Mietverhältnissen</li>
              <li>Sofortige Statusaktualisierung</li>
              <li>Multi-Bank-Unterstützung</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Kommunikation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-Mail-Versand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Alle automatischen E-Mails werden über das System versendet (Resend).
            Die Absenderadresse ist Ihre hinterlegte Firmen-E-Mail.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EinstellungenTab;
