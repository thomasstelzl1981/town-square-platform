/**
 * MasterTemplatesImmobilienakte — Orchestrator
 * R-33: 444 → ~80 lines
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { Accordion } from '@/components/ui/accordion';
import { Building2, FileText, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IMMO_AKTE_BLOCKS, IMMO_AKTE_BLOCK_J } from '@/components/admin/templates/immoAkteBlocks';
import { EntityBadge, BlockAccordion } from '@/components/admin/templates/ImmoAkteBlockView';

export default function MasterTemplatesImmobilienakte() {
  const totalFields = IMMO_AKTE_BLOCKS.reduce((sum, b) => sum + b.fields.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold">Immobilienakte — Mastervorlage (v1)</h1><p className="text-sm text-muted-foreground">Read-Only Referenz aus current Types</p></div>
        </div>
        <Link to="/admin/master-templates"><Button variant="outline" size="sm">← Zurück zu Master-Vorlagen</Button></Link>
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm"><p className="font-medium text-blue-800 dark:text-blue-200">Datenquelle</p><p className="text-blue-700 dark:text-blue-300">Alle Felder werden aus <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">src/types/immobilienakte.ts</code> abgeleitet.</p></div>
        </CardContent>
      </Card>

      <div className={DESIGN.KPI_GRID.FULL}>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{IMMO_AKTE_BLOCKS.length}</CardTitle><CardDescription>Blöcke (A–J)</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{totalFields}</CardTitle><CardDescription>Felder gesamt</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">{IMMO_AKTE_BLOCK_J.fields.length}</CardTitle><CardDescription>Dokument-Typen</CardDescription></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-2xl">8</CardTitle><CardDescription>Entitäten</CardDescription></CardHeader></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Block-Struktur (A–J)</CardTitle><CardDescription>Klicken Sie auf einen Block, um die Feldliste anzuzeigen</CardDescription></CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={['A']}>
            {IMMO_AKTE_BLOCKS.map(block => <BlockAccordion key={block.id} block={block} />)}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Legende: Entitäten</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(['property', 'unit', 'lease', 'loan', 'nk_period', 'accounting', 'document', 'derived'] as const).map(e => <EntityBadge key={e} entity={e} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
