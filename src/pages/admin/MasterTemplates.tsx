import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw, Percent, Calculator, Building2, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { PdfExportFooter } from '@/components/pdf';

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
    // TODO: Save to database when implemented
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
          <h1 className="text-3xl font-bold uppercase">Master-Vorlagen</h1>
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

      {/* Quick Links to Sub-Templates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/admin/master-templates/immobilienakte">
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
        <Link to="/admin/master-templates/selbstauskunft">
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
          <div className="grid gap-4 md:grid-cols-3">
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
