/**
 * Landing Page — Tab 3: Anbieter
 * Developer/builder profile
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, Shield } from 'lucide-react';
import { DEMO_DEVELOPER_CONTEXT } from '@/components/projekte/demoProjectData';

interface LandingPageAnbieterTabProps {
  isDemo: boolean;
  landingPage?: import('@/hooks/useLandingPage').LandingPage | null;
}

export function LandingPageAnbieterTab({ isDemo }: LandingPageAnbieterTabProps) {
  const dev = DEMO_DEVELOPER_CONTEXT;

  return (
    <div className="space-y-6">
      {isDemo && (
        <Badge variant="secondary" className="opacity-60">Beispieldaten</Badge>
      )}

      {/* Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl bg-primary/10 flex-shrink-0">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-2xl font-bold">{dev.name}</h3>
                <p className="text-muted-foreground">{dev.legal_form} · {dev.hrb_number}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />Verifizierter Anbieter</Badge>
                <Badge variant="outline">USt-IdNr. {dev.ust_id}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>Über uns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Die {dev.name} ist ein auf Wohnimmobilien in München spezialisiertes Unternehmen 
            mit langjähriger Erfahrung in der Projektentwicklung und Aufteilung von Mehrfamilienhäusern. 
            Unser Fokus liegt auf nachhaltigen Kapitalanlagen in bevorzugten Lagen der bayerischen Landeshauptstadt.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Seit unserer Gründung haben wir über 15 Projekte mit mehr als 200 Wohneinheiten erfolgreich 
            realisiert und an zufriedene Kapitalanleger vermittelt. Qualität, Transparenz und persönliche 
            Betreuung stehen bei uns an erster Stelle.
          </p>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="text-sm">
                <p className="font-medium">{dev.name}</p>
                <p className="text-muted-foreground">{dev.street} {dev.house_number}</p>
                <p className="text-muted-foreground">{dev.postal_code} {dev.city}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">info@stadtpark-wohnen.de</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">+49 89 123 456 78</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Geschäftsführer: {dev.managing_director}
          </p>
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader>
          <CardTitle>Referenzen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Parkresidenz Schwabing (2022)', 'Isar Lofts Sendling (2021)', 'Gartenhöfe Bogenhausen (2020)'].map((ref) => (
              <div key={ref} className="p-4 rounded-lg bg-muted/50 border border-dashed">
                <div className="aspect-[4/3] rounded bg-gradient-to-br from-muted to-muted/30 mb-3 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium">{ref}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
