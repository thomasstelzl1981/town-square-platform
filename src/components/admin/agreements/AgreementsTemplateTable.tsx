/**
 * AgreementsTemplateTable — Templates table for Agreements page
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Eye, Pencil, Plus } from 'lucide-react';

interface AgreementTemplate {
  id: string; code: string; title: string; content: string; version: number;
  is_active: boolean; requires_consent: boolean; valid_from: string;
  valid_until: string | null; created_at: string;
}

interface Props {
  templates: AgreementTemplate[];
  onNew: () => void;
  onEdit: (t: AgreementTemplate) => void;
  onView: (t: AgreementTemplate) => void;
}

export function AgreementsTemplateTable({ templates, onNew, onEdit, onView }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onNew}><Plus className="h-4 w-4 mr-2" />Neue Vorlage</Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Consent erforderlich</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Keine Vorlagen vorhanden</TableCell>
              </TableRow>
            ) : (
              templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm">{t.code}</TableCell>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell><Badge variant="outline">v{t.version}</Badge></TableCell>
                  <TableCell><Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Aktiv' : 'Inaktiv'}</Badge></TableCell>
                  <TableCell>{t.requires_consent ? <CheckCircle className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onView(t)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
