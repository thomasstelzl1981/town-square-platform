import { useParams, Link, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Module metadata for display
const moduleInfo: Record<string, { title: string; description: string }> = {
  'stammdaten': { 
    title: 'Stammdaten', 
    description: 'Profil, Firma, Abrechnung und Sicherheitseinstellungen' 
  },
  'ki-office': { 
    title: 'KI Office', 
    description: 'Email, Brief, Kontakte und Kalender mit KI-Unterstützung' 
  },
  'posteingang': { 
    title: 'Posteingang / DMS', 
    description: 'Dokumentenmanagement und digitaler Posteingang' 
  },
  'immobilien': { 
    title: 'Immobilien', 
    description: 'Portfolio, Verwaltung, Verkauf und Sanierung' 
  },
  'msv': { 
    title: 'MSV', 
    description: 'Miet-/Service-Verwaltung: Listen, Mieteingang, Vermietung' 
  },
  'verkauf': { 
    title: 'Verkauf', 
    description: 'Objekte, Aktivitäten, Anfragen und Vorgänge' 
  },
  'vertriebspartner': { 
    title: 'Vertriebspartner', 
    description: 'Pipeline, Auswahl, Beratung und Team/Kunden' 
  },
  'finanzierung': { 
    title: 'Finanzierung', 
    description: 'Selbstauskunft, Unterlagen, Pakete und Status' 
  },
  'leadgenerierung': { 
    title: 'Leadgenerierung', 
    description: 'Kampagnen, Studio, Landingpages und Leads' 
  },
};

// Sub-route metadata
const subRouteInfo: Record<string, Record<string, string>> = {
  'stammdaten': {
    'profil': 'Persönliche Daten und Kontaktinformationen',
    'firma': 'Unternehmensdaten und Einstellungen',
    'abrechnung': 'Zahlungsmethoden und Rechnungen',
    'sicherheit': 'Passwort, 2FA und Sitzungen',
  },
  'ki-office': {
    'email': 'Email-Postfach mit KI-Assistenz',
    'brief': 'Briefvorlagen und -erstellung',
    'kontakte': 'Kontaktverwaltung',
    'kalender': 'Termine und Kalender',
  },
  'posteingang': {
    'eingang': 'Digitaler Posteingang (Caya)',
    'zuordnung': 'Dokumente zuordnen',
    'archiv': 'Dokumentenarchiv',
    'einstellungen': 'DMS-Einstellungen',
  },
  'immobilien': {
    'portfolio': 'Immobilien-Übersicht',
    'verwaltung': 'Objektverwaltung',
    'verkauf': 'Verkaufsaktivitäten',
    'sanierung': 'Sanierungsprojekte',
  },
  'msv': {
    'listen': 'Miet-/Objektlisten',
    'mieteingang': 'Mieteingangs-Tracking',
    'vermietung': 'Vermietungsprozesse',
    'einstellungen': 'MSV-Einstellungen',
  },
  'verkauf': {
    'objekte': 'Verkaufsobjekte',
    'aktivitaeten': 'Vertriebsaktivitäten',
    'anfragen': 'Kundenanfragen',
    'vorgaenge': 'Verkaufsvorgänge',
  },
  'vertriebspartner': {
    'pipeline': 'Partner-Pipeline',
    'auswahl': 'Objektauswahl für Partner',
    'beratung': 'Beratungsdokumentation',
    'team': 'Team und Kunden',
  },
  'finanzierung': {
    'selbstauskunft': 'Selbstauskunft-Formulare',
    'unterlagen': 'Finanzierungsunterlagen',
    'pakete': 'Finanzierungspakete',
    'status': 'Handoff-Status',
  },
  'leadgenerierung': {
    'kampagnen': 'Marketing-Kampagnen',
    'studio': 'Content-Studio',
    'landingpages': 'Landingpage-Builder',
    'leads': 'Lead-Übersicht',
  },
};

export default function ModulePage() {
  const { moduleCode, subRoute } = useParams<{ moduleCode: string; subRoute?: string }>();
  const location = useLocation();
  
  const module = moduleInfo[moduleCode || ''];
  const subInfo = subRoute && moduleCode 
    ? subRouteInfo[moduleCode]?.[subRoute] 
    : null;

  if (!module) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card className="p-12 text-center">
          <Construction className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold mb-2">Modul nicht gefunden</h1>
          <p className="text-muted-foreground mb-6">
            Das angeforderte Modul existiert nicht.
          </p>
          <Link to="/portal">
            <Button>Zurück zum Portal</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/portal">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </Link>
      </div>

      {/* Module Header */}
      <Card className="p-8 md:p-12 text-center max-w-2xl mx-auto">
        <Construction className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-2xl font-bold">{module.title}</h1>
          {subRoute && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-xl capitalize">{subRoute}</span>
            </>
          )}
        </div>

        <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
        
        <p className="text-muted-foreground mb-6">
          {subInfo || module.description}
        </p>
        
        <div className="text-sm text-muted-foreground">
          <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
        </div>

        {/* Sub-routes navigation if on main module page */}
        {!subRoute && moduleCode && subRouteInfo[moduleCode] && (
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm font-medium mb-4">Verfügbare Bereiche:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(subRouteInfo[moduleCode]).map(([route, desc]) => (
                <Link
                  key={route}
                  to={`/portal/${moduleCode}/${route}`}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                >
                  <p className="font-medium capitalize text-sm">{route}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
