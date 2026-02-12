/**
 * PV Dokumente Tab — DMS overview with showcase empty state
 */
import { useNavigate } from 'react-router-dom';
import { DESIGN } from '@/config/designManifest';
import { usePvPlants } from '@/hooks/usePvPlants';
import { PV_REQUIRED_DOCS } from '@/hooks/usePvDMS';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Folder, FolderOpen, FileText, Plus, CheckCircle2, Circle, Upload, Sun,
} from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';

const PV_DMS_FOLDERS = [
  '01_Stammdaten',
  '02_MaStR_BNetzA',
  '03_Netzbetreiber',
  '04_Zaehler',
  '05_Wechselrichter_und_Speicher',
  '06_Versicherung',
  '07_Steuer_USt_BWA',
  '08_Wartung_Service',
];

export default function DokumenteTab() {
  const navigate = useNavigate();
  const { plants } = usePvPlants();
  const hasPlants = plants.length > 0;

  return (
    <PageShell>
      <ModulePageHeader
        title="Dokumente"
        description={hasPlants ? 'Dokumentenmanagement für Ihre PV-Anlagen' : 'Automatische Dokumentenstruktur pro Anlage'}
      />

      {hasPlants ? (
        /* Real DMS view per plant */
        <div className="space-y-6">
          {plants.map((plant) => (
            <Card key={plant.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sun className="h-4 w-4 text-primary" />
                    {plant.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/portal/photovoltaik/${plant.id}`)}>
                    Akte öffnen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Folder tree */}
                <div className={DESIGN.KPI_GRID.FULL}>
                  {PV_DMS_FOLDERS.map((f) => (
                    <div key={f} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm hover:bg-muted/50 cursor-pointer">
                      <Folder className="h-4 w-4 text-primary/70 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
                {/* Checklist */}
                <div>
                  <p className="text-sm font-medium mb-2">Pflichtdokumente</p>
                  <div className="space-y-1.5">
                    {PV_REQUIRED_DOCS.map((doc) => (
                      <div key={doc.name} className="flex items-center gap-2 text-sm">
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="text-muted-foreground">{doc.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">Fehlend</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Showcase Empty State */
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Automatische Ordnerstruktur pro Anlage
              </CardTitle>
            </CardHeader>
            <CardContent className="opacity-50 pointer-events-none">
              <div className={DESIGN.KPI_GRID.FULL}>
                {PV_DMS_FOLDERS.map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                    <Folder className="h-4 w-4 text-primary/70 shrink-0" />
                    <span className="truncate">{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pflichtdokumente-Checkliste
              </CardTitle>
            </CardHeader>
            <CardContent className="opacity-50 pointer-events-none">
              <div className="space-y-1.5">
                {PV_REQUIRED_DOCS.map((doc) => (
                  <div key={doc.name} className="flex items-center gap-2 text-sm">
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="text-muted-foreground">{doc.name}</span>
                    <span className="text-xs text-muted-foreground/50 ml-auto">{doc.folder}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Diese Struktur wird automatisch für jede neue PV-Anlage angelegt.
            </p>
            <Button onClick={() => navigate('/portal/photovoltaik/neu')}>
              <Plus className="h-4 w-4 mr-2" />
              Anlage anlegen
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
