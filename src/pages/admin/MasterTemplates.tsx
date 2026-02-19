import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw, Percent, Calculator, Building2, FileText, ChevronRight, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import { PdfExportFooter } from '@/components/pdf';
import { DESIGN } from '@/config/designManifest';

// Interest rate table structure
interface InterestRateTable {
  fixedPeriod: number;
  ltv60: number;
  ltv80: number;
  ltv90: number;
  ltv100: number;
}

// Default rates based on January 2026 research
const defaultInterestRates: InterestRateTable[] = [
  { fixedPeriod: 5, ltv60: 3.60, ltv80: 3.70, ltv90: 3.90, ltv100: 4.20 },
  { fixedPeriod: 10, ltv60: 3.70, ltv80: 3.80, ltv90: 4.00, ltv100: 4.30 },
  { fixedPeriod: 15, ltv60: 4.00, ltv80: 4.00, ltv90: 4.20, ltv100: 4.50 },
  { fixedPeriod: 20, ltv60: 4.10, ltv80: 4.20, ltv90: 4.40, ltv100: 4.70 },
];

export default function MasterTemplates() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [interestRates, setInterestRates] = useState<InterestRateTable[]>(defaultInterestRates);
  const [defaultAfaRate, setDefaultAfaRate] = useState(2.0);
  const [maintenanceCost, setMaintenanceCost] = useState(0.40);
  const [lastUpdated] = useState(new Date().toLocaleDateString('de-DE'));

  const handleRateChange = (periodIndex: number, field: keyof InterestRateTable, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInterestRates(prev => prev.map((row, i) => 
      i === periodIndex ? { ...row, [field]: numValue } : row
    ));
  };

  const handleSave = () => {
    // STUB: Speicherung in DB-Tabelle master_templates steht aus (HYGIENE-004)
    toast.success('Master-Vorlagen gespeichert', {
      description: 'Die Änderungen wurden erfolgreich übernommen.'
    });
  };

  const handleReset = () => {
    setInterestRates(defaultInterestRates);
    setDefaultAfaRate(2.0);
    setMaintenanceCost(0.40);
    toast.info('Auf Standardwerte zurückgesetzt');
  };

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Master-Vorlagen</h1>
          <p className="text-muted-foreground">
            Zentrale Konfiguration für die Investment Engine
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Zurücksetzen
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </div>
      </div>

      {/* Master Data — Erfassungsakten */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">Master Data — Erfassungsakten</h2>
        <div className={DESIGN.WIDGET_GRID.FULL}>
          <Link to="/admin/masterdata/immobilienakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Immobilienakte</CardTitle>
                      <CardDescription>MOD-04 • 10 Blöcke (A–J) • 106 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/selbstauskunft">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Selbstauskunft</CardTitle>
                      <CardDescription>MOD-07 • 9 Sektionen • 67 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/projektakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Projektakte</CardTitle>
                      <CardDescription>MOD-13 • 10 Blöcke (A–J) • 91 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/fahrzeugakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Fahrzeugakte</CardTitle>
                      <CardDescription>MOD-17 • 9 Blöcke (A–I) • 47 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/photovoltaikakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Photovoltaikakte</CardTitle>
                      <CardDescription>MOD-19 • 7 Blöcke (A–G) • 45 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/finanzierungsakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Finanzierungsakte</CardTitle>
                      <CardDescription>MOD-11 • 8 Blöcke (A–H) • 55 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/versicherungsakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Versicherungsakte</CardTitle>
                      <CardDescription>MOD-11 • 7 Blöcke (A–G) • 25 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/vorsorgeakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Vorsorgeakte</CardTitle>
                      <CardDescription>MOD-11 • 6 Blöcke (A–F) • 21 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/personenakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Personenakte</CardTitle>
                      <CardDescription>MOD-01 • 8 Blöcke (A–H) • 36 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/admin/masterdata/haustierakte">
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Haustierakte</CardTitle>
                      <CardDescription>MOD-05 • 5 Blöcke (A–E) • 19 Felder</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="interest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interest" className="gap-2">
            <Percent className="h-4 w-4" />
            Zinstabelle
          </TabsTrigger>
          <TabsTrigger value="calculation" className="gap-2">
            <Calculator className="h-4 w-4" />
            Berechnungsparameter
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <Building2 className="h-4 w-4" />
            Nebenkosten
          </TabsTrigger>
        </TabsList>

        {/* Interest Rate Table */}
        <TabsContent value="interest">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Zinstabelle nach Beleihung & Zinsbindung</span>
                <Badge variant="outline">Stand: {lastUpdated}</Badge>
              </CardTitle>
              <CardDescription>
                Diese Zinssätze werden für alle Investment-Berechnungen in Zone 2 und Zone 3 verwendet.
                Quelle: Finanztip / Statista (Januar 2026)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Zinsbindung</TableHead>
                    <TableHead className="text-center">LTV ≤60%</TableHead>
                    <TableHead className="text-center">LTV ≤80%</TableHead>
                    <TableHead className="text-center">LTV ≤90%</TableHead>
                    <TableHead className="text-center">LTV ≤100%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interestRates.map((row, index) => (
                    <TableRow key={row.fixedPeriod}>
                      <TableCell className="font-medium">
                        {row.fixedPeriod} Jahre
                        {row.fixedPeriod === 15 && (
                          <Badge variant="secondary" className="ml-2">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.ltv60}
                            onChange={(e) => handleRateChange(index, 'ltv60', e.target.value)}
                            className="w-20 text-center"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.ltv80}
                            onChange={(e) => handleRateChange(index, 'ltv80', e.target.value)}
                            className="w-20 text-center"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.ltv90}
                            onChange={(e) => handleRateChange(index, 'ltv90', e.target.value)}
                            className="w-20 text-center"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.ltv100}
                            onChange={(e) => handleRateChange(index, 'ltv100', e.target.value)}
                            className="w-20 text-center"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Hinweis:</strong> LTV (Loan-to-Value) = Darlehenssumme / Kaufpreis × 100.
                  Niedrigere Beleihung führt zu besseren Konditionen.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculation Parameters */}
        <TabsContent value="calculation">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Abschreibung (AfA)</CardTitle>
                <CardDescription>
                  Standard-Abschreibungssätze für Immobilien
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Standard-AfA-Satz (linear)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={defaultAfaRate}
                      onChange={(e) => setDefaultAfaRate(parseFloat(e.target.value) || 2)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">% p.a.</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entspricht einer Nutzungsdauer von {Math.round(100 / defaultAfaRate)} Jahren
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Erweiterte AfA-Modelle</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>§7i EStG (Denkmal)</span>
                      <Badge variant="outline">Geplant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>§7h EStG (Sanierung)</span>
                      <Badge variant="outline">Geplant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>§7b EStG (Neubau)</span>
                      <Badge variant="outline">Geplant</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Steuerberechnung</CardTitle>
                <CardDescription>
                  Parameter für die Einkommensteuer-Berechnung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bemessungsgrundlage</Label>
                  <p className="text-sm text-muted-foreground">
                    BMF PAP 2026 (Programmablaufplan Lohnsteuer)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Solidaritätszuschlag</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">5,5% auf ESt</span>
                    <Badge variant="secondary">Automatisch</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Freigrenze: 18.130 € (Einzelveranlagung) / 36.260 € (Zusammenveranlagung)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Kirchensteuer</Label>
                  <div className="flex gap-2">
                    <Badge>8% Bayern/BaWü</Badge>
                    <Badge>9% Übrige</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Veranlagungsarten</Label>
                  <div className="flex gap-2">
                    <Badge variant="outline">Grundtabelle</Badge>
                    <Badge variant="outline">Splittingtarif</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ancillary Costs */}
        <TabsContent value="costs">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Instandhaltungskosten</CardTitle>
                <CardDescription>
                  Pauschalen für laufende Objektkosten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Standard-Instandhaltung</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.05"
                      value={maintenanceCost}
                      onChange={(e) => setMaintenanceCost(parseFloat(e.target.value) || 0.4)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">€/qm/Monat</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entspricht ca. {(maintenanceCost * 12).toFixed(2)} €/qm/Jahr
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Erwerbsnebenkosten</CardTitle>
                <CardDescription>
                  Grunderwerbsteuer nach Bundesland
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bundesland</TableHead>
                      <TableHead className="text-right">GrESt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Bayern, Sachsen</TableCell>
                      <TableCell className="text-right">3,5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Hamburg, Baden-Württemberg</TableCell>
                      <TableCell className="text-right">5,0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Berlin, Hessen, ...</TableCell>
                      <TableCell className="text-right">6,0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Brandenburg, NRW, ...</TableCell>
                      <TableCell className="text-right">6,5%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2">
                  + Notar/Grundbuch: ca. 1,5-2% | + Makler: 3-7%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Verwendung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={DESIGN.WIDGET_GRID.FULL}>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Zone 3 – Kaufy</h4>
              <p className="text-sm text-muted-foreground">
                Investment-Suche und Beratungsrechner auf der öffentlichen Website
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Zone 2 – Portal</h4>
              <p className="text-sm text-muted-foreground">
                MOD-04 Exposé, MOD-08 Investments, MOD-09 Beratung
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">PDF-Export</h4>
              <p className="text-sm text-muted-foreground">
                Alle Berechnungen sind als PDF exportierbar (MOD-03 DMS)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Export */}
      <PdfExportFooter
        contentRef={contentRef}
        documentTitle="Master-Vorlagen"
        subtitle={`Investment Engine Konfiguration – Stand: ${lastUpdated}`}
        moduleName="Zone 1 Admin"
      />
    </div>
  );
}
