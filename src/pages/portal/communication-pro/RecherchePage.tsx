/**
 * RecherchePage — MOD-14 Communication Pro / Recherche
 * Dreikachel-Design: Firmendatenbank-Suche, Lead-Enrichment, Kontaktdaten-Validierung
 */

import { useState } from 'react';
import {
  Search, Building2, UserCheck, ShieldCheck, Globe, MapPin,
  Users, Mail, Phone, ExternalLink, Sparkles, Filter, X, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

/* ── Demo-Daten ──────────────────────────────────────── */

interface CompanyResult {
  id: string;
  name: string;
  industry: string;
  city: string;
  employees: string;
  website: string;
  score: number;
  contacts: { name: string; role: string; email: string; phone?: string; verified: boolean }[];
}

const DEMO_RESULTS: CompanyResult[] = [
  {
    id: '1',
    name: 'Hausverwaltung Müller & Partner GmbH',
    industry: 'Immobilienverwaltung',
    city: 'München',
    employees: '25–50',
    website: 'mueller-hausverwaltung.de',
    score: 92,
    contacts: [
      { name: 'Thomas Müller', role: 'Geschäftsführer', email: 't.mueller@mueller-hv.de', phone: '+49 89 123456', verified: true },
      { name: 'Sandra Becker', role: 'Leiterin Vermietung', email: 's.becker@mueller-hv.de', verified: true },
    ],
  },
  {
    id: '2',
    name: 'Rhein-Main Immobilien AG',
    industry: 'Immobilienentwicklung',
    city: 'Frankfurt am Main',
    employees: '100–250',
    website: 'rheinmain-immo.de',
    score: 87,
    contacts: [
      { name: 'Dr. Klaus Weber', role: 'Vorstand', email: 'k.weber@rmi.de', phone: '+49 69 987654', verified: true },
      { name: 'Lisa Hofmann', role: 'Head of Sales', email: 'l.hofmann@rmi.de', verified: false },
    ],
  },
  {
    id: '3',
    name: 'Stadtbau Wohnungsbau GmbH',
    industry: 'Wohnungsbau',
    city: 'Stuttgart',
    employees: '50–100',
    website: 'stadtbau-wohnungsbau.de',
    score: 78,
    contacts: [
      { name: 'Markus Braun', role: 'Projektleiter', email: 'm.braun@stadtbau.de', verified: true },
    ],
  },
  {
    id: '4',
    name: 'NordWest Facility Services',
    industry: 'Facility Management',
    city: 'Hamburg',
    employees: '250–500',
    website: 'nw-facility.de',
    score: 71,
    contacts: [
      { name: 'Anna Richter', role: 'Key Account', email: 'a.richter@nwfs.de', phone: '+49 40 555123', verified: true },
      { name: 'Peter Schmidt', role: 'Geschäftsführer', email: 'p.schmidt@nwfs.de', verified: false },
    ],
  },
];

/* ── Komponente ──────────────────────────────────────── */

export function RecherchePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [industry, setIndustry] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<CompanyResult[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim() && industry === 'all' && region === 'all') {
      toast.info('Bitte geben Sie mindestens ein Suchkriterium ein.');
      return;
    }
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      setResults(DEMO_RESULTS.filter(r => {
        if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !r.industry.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (industry !== 'all' && r.industry !== industry) return false;
        if (region !== 'all' && r.city !== region) return false;
        return true;
      }));
      setHasSearched(true);
      setIsSearching(false);
    }, 800);
  };

  const handleShowAll = () => {
    setSearchQuery('');
    setIndustry('all');
    setRegion('all');
    setIsSearching(true);
    setTimeout(() => {
      setResults(DEMO_RESULTS);
      setHasSearched(true);
      setIsSearching(false);
    }, 500);
  };

  const handleReset = () => {
    setSearchQuery('');
    setIndustry('all');
    setRegion('all');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase">Recherche</h1>
            <p className="text-muted-foreground mt-0.5">Firmendatenbank durchsuchen, Leads anreichern, Kontakte validieren</p>
          </div>
        </div>
      </div>

      {/* ── Dreikachel-Design: Funktionsübersicht ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Firmendatenbank</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Durchsuchen Sie Unternehmen nach Branche, Region und Größe. Finden Sie ideale Zielkunden für Ihre Akquise.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent p-2.5 shrink-0">
                <UserCheck className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Lead-Enrichment</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Reichern Sie bestehende Kontakte mit Firmendaten, Positionen und Kontaktinformationen an.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent p-2.5 shrink-0">
                <ShieldCheck className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Kontakt-Validierung</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Prüfen Sie E-Mail-Adressen und Telefonnummern auf Zustellbarkeit und Aktualität.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Suchbereich ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Intelligente Suche
          </CardTitle>
          <CardDescription>
            Suchen Sie nach Firmennamen, Branchen oder kombinieren Sie Filter für gezielte Ergebnisse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Suchfeld */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Firmenname, Branche oder Stichwort eingeben…"
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="gap-2 min-w-[120px]">
              {isSearching ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Suche…</>
              ) : (
                <><Search className="h-4 w-4" /> Suchen</>
              )}
            </Button>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" /> Filter:
            </div>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Branche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Branchen</SelectItem>
                <SelectItem value="Immobilienverwaltung">Immobilienverwaltung</SelectItem>
                <SelectItem value="Immobilienentwicklung">Immobilienentwicklung</SelectItem>
                <SelectItem value="Wohnungsbau">Wohnungsbau</SelectItem>
                <SelectItem value="Facility Management">Facility Management</SelectItem>
                <SelectItem value="Makler">Makler</SelectItem>
              </SelectContent>
            </Select>

            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Regionen</SelectItem>
                <SelectItem value="München">München</SelectItem>
                <SelectItem value="Frankfurt am Main">Frankfurt</SelectItem>
                <SelectItem value="Stuttgart">Stuttgart</SelectItem>
                <SelectItem value="Hamburg">Hamburg</SelectItem>
                <SelectItem value="Berlin">Berlin</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || industry !== 'all' || region !== 'all') && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs">
                <X className="h-3 w-3" /> Zurücksetzen
              </Button>
            )}

            {!hasSearched && (
              <Button variant="outline" size="sm" onClick={handleShowAll} className="ml-auto gap-1 text-xs">
                Alle anzeigen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Ergebnisse ─────────────────────────── */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> Ergebnis{results.length !== 1 ? 'se' : ''} gefunden
            </p>
            {results.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.info('Export wird vorbereitet…')}>
                Export
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium">Keine Ergebnisse</p>
                <p className="text-sm text-muted-foreground mt-1">Versuchen Sie andere Suchbegriffe oder erweitern Sie die Filter.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleShowAll}>
                  Alle Firmen anzeigen
                </Button>
              </CardContent>
            </Card>
          ) : (
            results.map(company => (
              <Card key={company.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-5 pb-4">
                  {/* Firmen-Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2.5 shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{company.website}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.city}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{company.employees} MA</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{company.industry}</Badge>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                        company.score >= 85 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {company.score}%
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* Kontakte */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {company.contacts.length} Ansprechpartner
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {company.contacts.map((contact, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium truncate">{contact.name}</span>
                              {contact.verified ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toast.success(`E-Mail an ${contact.name} vorbereitet`)}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                            {contact.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => toast.info(contact.phone!)}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.info('Lead-Enrichment gestartet…')}>
                      <UserCheck className="h-3.5 w-3.5" /> Anreichern
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.info('Validierung gestartet…')}>
                      <ShieldCheck className="h-3.5 w-3.5" /> Validieren
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs ml-auto" onClick={() => toast.info('Vollprofil wird geladen…')}>
                      <ExternalLink className="h-3.5 w-3.5" /> Profil öffnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Initiale Ansicht (vor erster Suche) ── */}
      {!hasSearched && !isSearching && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-10 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg">Starten Sie Ihre Recherche</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Geben Sie einen Firmennamen oder eine Branche ein, oder nutzen Sie die Filter, um gezielt nach potenziellen Kunden in der Immobilienbranche zu suchen.
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={handleShowAll}>
              <Building2 className="h-4 w-4" /> Alle Firmen anzeigen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
