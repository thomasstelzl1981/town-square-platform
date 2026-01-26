import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Wrench, Zap, Paintbrush, Home, Square, Flame, Package,
  ArrowRight, Mail, FileText, AlertCircle
} from 'lucide-react';

const WORKFLOW_STEPS = [
  { id: 'draft', label: 'Entwurf', active: false },
  { id: 'sent', label: 'Versendet', active: false },
  { id: 'offers', label: 'Angebote', active: false },
  { id: 'awarded', label: 'Vergeben', active: false },
  { id: 'completed', label: 'Fertig', active: false },
];

const CATEGORIES = [
  { id: 'sanitaer', label: 'Sanitär', icon: Wrench, count: 0 },
  { id: 'elektro', label: 'Elektro', icon: Zap, count: 0 },
  { id: 'maler', label: 'Maler', icon: Paintbrush, count: 0 },
  { id: 'dach', label: 'Dach', icon: Home, count: 0 },
  { id: 'fenster', label: 'Fenster', icon: Square, count: 0 },
  { id: 'heizung', label: 'Heizung', icon: Flame, count: 0 },
  { id: 'sonstige', label: 'Sonstige', icon: Package, count: 0 },
];

export function SanierungTab() {
  return (
    <div className="space-y-6">
      {/* Workflow Visualisierung */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workflow: Ausschreibung → Angebot → Vergabe → Dokumentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`
                  flex-1 py-2 px-3 text-center text-sm rounded-md border
                  ${step.active 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-muted/50 text-muted-foreground border-muted'
                  }
                `}>
                  {step.label}
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Header mit Aktion */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Aktive Vorgänge</h2>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Vorgang
          <Badge variant="secondary" className="ml-2 text-xs">
            in Entwicklung
          </Badge>
        </Button>
      </div>

      {/* Aktive Vorgänge Tabelle */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Tender-ID</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Objekt</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground">–</TableCell>
                <TableCell className="text-muted-foreground">–</TableCell>
                <TableCell className="text-muted-foreground">–</TableCell>
                <TableCell className="text-muted-foreground">–</TableCell>
                <TableCell className="text-muted-foreground">–</TableCell>
                <TableCell className="text-right text-muted-foreground">–</TableCell>
                <TableCell className="text-muted-foreground">–</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Keine aktiven Sanierungsvorgänge vorhanden</p>
                    <p className="text-sm text-muted-foreground/70">
                      Starten Sie eine Ausschreibung für Sanitär, Elektro, Maler, Dach, Fenster oder andere Gewerke.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unzugeordnete Angebote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Unzugeordnete Angebote
          </CardTitle>
          <CardDescription>
            Eingehende E-Mails mit Angeboten, die keiner Tender-ID zugeordnet werden können
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center border border-dashed rounded-lg">
            <Mail className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Keine unzugeordneten Angebote vorhanden</p>
          </div>
        </CardContent>
      </Card>

      {/* Kategorien Übersicht */}
      <div className="space-y-4">
        <h3 className="font-medium">Kategorien</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.id} className="text-center">
                <CardContent className="py-4">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-2xl font-bold text-muted-foreground">{cat.count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info-Hinweis */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">E-Mail-Integration für Ausschreibungen</p>
            <p className="text-sm text-muted-foreground">
              Die automatische E-Mail-Versendung und Angebots-Erfassung befindet sich in Entwicklung. 
              Ausschreibungen werden derzeit manuell verwaltet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
