/**
 * ImmoAkteBlockView — Block accordion and badge components for MasterTemplatesImmobilienakte
 */
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { FieldDefinition, BlockDefinition } from './immoAkteBlocks';

export function EntityBadge({ entity }: { entity: FieldDefinition['entity'] }) {
  const colors: Record<FieldDefinition['entity'], string> = {
    property: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    unit: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    lease: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    loan: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    nk_period: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    accounting: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    document: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    derived: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[entity]}`}>{entity}</span>;
}

export function TypeBadge({ type }: { type: FieldDefinition['type'] }) {
  return <Badge variant="outline" className="text-xs font-mono">{type}</Badge>;
}

export function BlockAccordion({ block }: { block: BlockDefinition }) {
  const hasUIPending = block.fields.some(f => f.notes?.includes('UI pending'));
  return (
    <AccordionItem value={block.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">{block.id}</Badge>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{block.title}</span>
              <span className="text-muted-foreground text-sm">({block.fields.length} Felder)</span>
              {hasUIPending && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">UI pending</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{block.description}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="border rounded-lg overflow-hidden mt-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-48">field_key</TableHead>
                <TableHead className="w-48">label_de</TableHead>
                <TableHead className="w-28">entity</TableHead>
                <TableHead className="w-24">type</TableHead>
                <TableHead>notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.fields.map(field => (
                <TableRow key={field.fieldKey}>
                  <TableCell className="font-mono text-sm">{field.fieldKey}</TableCell>
                  <TableCell>{field.labelDe}</TableCell>
                  <TableCell><EntityBadge entity={field.entity} /></TableCell>
                  <TableCell><TypeBadge type={field.type} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{field.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
