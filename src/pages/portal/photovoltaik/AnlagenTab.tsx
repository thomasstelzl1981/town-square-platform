/**
 * PV Anlagen Tab — Portfolio list + Showcase Empty State
 */
import { useNavigate } from 'react-router-dom';
import { usePvPlants } from '@/hooks/usePvPlants';
import { usePvMonitoring } from '@/hooks/usePvMonitoring';
import { usePvDMS } from '@/hooks/usePvDMS';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sun, Plus, Eye, Zap, MapPin, Activity, Settings, FileText,
  Gauge, FolderOpen, ClipboardCheck, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnlagenTab() {
  const navigate = useNavigate();
  const { plants, isLoading, createPlant, tenantId } = usePvPlants();
  const { liveData } = usePvMonitoring(plants);
  const { createDMSTree } = usePvDMS();
  const { profile } = useAuth();
  const hasPlants = plants.length > 0;

  const handleSeedDemo = async () => {
    if (!tenantId || !profile?.id) return;
    try {
      const demos = [
        { name: 'Thomas – EFH SMA 9,8 kWp', city: 'Berlin', kwp: 9.8, wr_manufacturer: 'SMA', provider: 'demo' },
        { name: 'Gewerbehalle Solar-Log 49,5 kWp', city: 'München', kwp: 49.5, wr_manufacturer: 'Solar-Log', provider: 'demo' },
      ];
      for (const d of demos) {
        const plant = await createPlant.mutateAsync(d);
        await createDMSTree.mutateAsync({ plantId: plant.id, plantName: plant.name });
      }
      toast.success('2 Demo-Anlagen angelegt');
    } catch (e) {
      // error handled in hook
    }
  };

  // Showcase preview data
  const previewRows = [
    { name: 'Thomas – EFH SMA 9,8 kWp', city: 'Berlin', kwp: 9.8, wr: 'SMA', status: 'active', power: '4.230 W', energy: '18,4 kWh', sync: 'vor 5 Sek' },
    { name: 'Gewerbehalle Solar-Log 49,5 kWp', city: 'München', kwp: 49.5, wr: 'Solar-Log', status: 'active', power: '21.780 W', energy: '94,2 kWh', sync: 'vor 8 Sek' },
  ];

  const aktePreviewSections = [
    { icon: MapPin, label: 'Standort' },
    { icon: ClipboardCheck, label: 'MaStR / BNetzA' },
    { icon: Zap, label: 'Netzbetreiber' },
    { icon: Gauge, label: 'Zähler' },
    { icon: Settings, label: 'Technik' },
    { icon: Activity, label: 'Monitoring' },
    { icon: FolderOpen, label: 'Dokumente' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">ANLAGEN</h1>
          <p className="text-muted-foreground mt-1">
            {hasPlants ? `${plants.length} PV-Anlage${plants.length > 1 ? 'n' : ''}` : 'Ihr PV-Portfolio'}
          </p>
        </div>
        <div className="flex gap-2">
          {!hasPlants && (
            <Button variant="outline" onClick={handleSeedDemo} disabled={createPlant.isPending}>
              <Sparkles className="h-4 w-4 mr-2" />
              Demo-Anlagen erzeugen
            </Button>
          )}
          <Button onClick={() => navigate('/portal/photovoltaik/neu')}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Anlage
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : hasPlants ? (
        /* Real data table */
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Ort</TableHead>
                  <TableHead className="hidden sm:table-cell">kWp</TableHead>
                  <TableHead className="hidden lg:table-cell">WR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Leistung</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Ertrag heute</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plants.map((plant) => {
                  const live = liveData.get(plant.id);
                  return (
                    <TableRow key={plant.id} className="cursor-pointer" onClick={() => navigate(`/portal/photovoltaik/${plant.id}`)}>
                      <TableCell className="font-medium">{plant.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{plant.city || '–'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{plant.kwp ?? '–'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{plant.wr_manufacturer || '–'}</TableCell>
                      <TableCell>
                        <Badge variant={plant.status === 'active' ? 'default' : 'secondary'}>
                          {plant.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {live ? `${live.currentPowerW.toLocaleString('de-DE')} W` : '–'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono">
                        {live ? `${live.energyTodayKwh.toLocaleString('de-DE')} kWh` : '–'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/portal/photovoltaik/${plant.id}`); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Showcase Empty State */
        <div className="space-y-6">
          {/* Preview table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Vorschau: So sieht Ihr PV-Portfolio aus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 opacity-50 pointer-events-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Ort</TableHead>
                    <TableHead className="hidden sm:table-cell">kWp</TableHead>
                    <TableHead className="hidden lg:table-cell">WR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Leistung</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Ertrag heute</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{row.city}</TableCell>
                      <TableCell className="hidden sm:table-cell">{row.kwp}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{row.wr}</TableCell>
                      <TableCell><Badge variant="default">Aktiv</Badge></TableCell>
                      <TableCell className="text-right font-mono">{row.power}</TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono">{row.energy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Akte preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                So sieht eine PV-Akte aus
              </CardTitle>
            </CardHeader>
            <CardContent className="opacity-50 pointer-events-none">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {aktePreviewSections.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 rounded-lg border p-3">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{s.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 py-6">
            <Sun className="h-12 w-12 text-primary/30" />
            <p className="text-muted-foreground text-center max-w-md">
              Legen Sie Ihre erste PV-Anlage an und verwalten Sie Monitoring, Dokumente und Stammdaten an einem Ort.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/portal/photovoltaik/neu')}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Anlage anlegen
              </Button>
              <Button onClick={() => navigate('/portal/photovoltaik/neu')}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Anlage anlegen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
