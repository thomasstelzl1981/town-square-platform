import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import type { ParseResult, ImportPreviewRow, ImportPreviewField } from '@/types/document-schemas';

interface ImportPreviewProps {
  parsed: ParseResult;
  onImport: (selectedRows: ImportPreviewRow[]) => Promise<void>;
  onCancel: () => void;
  isImporting?: boolean;
  entityType?: 'properties' | 'contacts' | 'units' | 'all';
}

/**
 * ImportPreview Component
 * 
 * Displays AI-extracted data in an editable table format.
 * Users can:
 * - Select/deselect rows for import
 * - Edit extracted values
 * - See confidence scores per field
 * - View warnings for uncertain extractions
 */
export function ImportPreview({
  parsed,
  onImport,
  onCancel,
  isImporting = false,
  entityType = 'all',
}: ImportPreviewProps) {
  const [rows, setRows] = React.useState<ImportPreviewRow[]>([]);
  const [selectAll, setSelectAll] = React.useState(true);

  // Transform parsed data into preview rows
  React.useEffect(() => {
    const previewRows: ImportPreviewRow[] = [];

    // Properties
    if ((entityType === 'all' || entityType === 'properties') && parsed.data.properties) {
      parsed.data.properties.forEach((prop, idx) => {
        const fields: ImportPreviewField[] = [
          { key: 'code', label: 'Code', value: prop.code || '', confidence: 0.9, editable: true },
          { key: 'property_type', label: 'Typ', value: prop.property_type || '', confidence: 0.8, editable: true },
          { key: 'address', label: 'Adresse', value: prop.address || '', confidence: parsed.confidence, editable: true },
          { key: 'city', label: 'Stadt', value: prop.city || '', confidence: parsed.confidence, editable: true },
          { key: 'postal_code', label: 'PLZ', value: prop.postal_code || '', confidence: 0.85, editable: true },
          { key: 'purchase_price', label: 'Kaufpreis', value: prop.purchase_price || '', confidence: 0.7, editable: true },
          { key: 'market_value', label: 'Marktwert', value: prop.market_value || '', confidence: 0.6, editable: true },
        ];

        previewRows.push({
          id: `property-${idx}`,
          type: 'property',
          fields: fields.filter(f => f.value !== ''),
          selected: true,
          hasWarnings: parsed.confidence < 0.7,
        });

        // Add units as sub-rows
        if (prop.units) {
          prop.units.forEach((unit, unitIdx) => {
            const unitFields: ImportPreviewField[] = [
              { key: 'unit_number', label: 'Einheit', value: unit.unit_number || '', confidence: 0.9, editable: true },
              { key: 'area_sqm', label: 'Fläche m²', value: unit.area_sqm || '', confidence: 0.8, editable: true },
              { key: 'monthly_rent', label: 'Miete €', value: unit.monthly_rent || '', confidence: 0.75, editable: true },
              { key: 'tenant_name', label: 'Mieter', value: unit.tenant_name || '', confidence: 0.7, editable: true },
            ];

            previewRows.push({
              id: `unit-${idx}-${unitIdx}`,
              type: 'unit',
              fields: unitFields.filter(f => f.value !== ''),
              selected: true,
              hasWarnings: false,
            });
          });
        }
      });
    }

    // Contacts
    if ((entityType === 'all' || entityType === 'contacts') && parsed.data.contacts) {
      parsed.data.contacts.forEach((contact, idx) => {
        const fields: ImportPreviewField[] = [
          { key: 'first_name', label: 'Vorname', value: contact.first_name || '', confidence: 0.9, editable: true },
          { key: 'last_name', label: 'Nachname', value: contact.last_name || '', confidence: 0.9, editable: true },
          { key: 'email', label: 'E-Mail', value: contact.email || '', confidence: 0.85, editable: true },
          { key: 'phone', label: 'Telefon', value: contact.phone || '', confidence: 0.8, editable: true },
          { key: 'company', label: 'Firma', value: contact.company || '', confidence: 0.75, editable: true },
        ];

        previewRows.push({
          id: `contact-${idx}`,
          type: 'contact',
          fields: fields.filter(f => f.value !== ''),
          selected: true,
          hasWarnings: false,
        });
      });
    }

    setRows(previewRows);
  }, [parsed, entityType]);

  const handleToggleRow = (rowId: string) => {
    setRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, selected: !row.selected } : row
    ));
  };

  const handleToggleAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setRows(prev => prev.map(row => ({ ...row, selected: newSelectAll })));
  };

  const handleFieldChange = (rowId: string, fieldKey: string, newValue: unknown) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        fields: row.fields.map(field => 
          field.key === fieldKey ? { ...field, value: newValue } : field
        ),
      };
    }));
  };

  const handleImport = async () => {
    const selectedRows = rows.filter(row => row.selected);
    await onImport(selectedRows);
  };

  const selectedCount = rows.filter(r => r.selected).length;
  const propertiesCount = rows.filter(r => r.type === 'property' && r.selected).length;
  const unitsCount = rows.filter(r => r.type === 'unit' && r.selected).length;
  const contactsCount = rows.filter(r => r.type === 'contact' && r.selected).length;

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) return <Badge variant="outline" className="bg-green-50 text-green-700">Hoch</Badge>;
    if (confidence >= 0.7) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Mittel</Badge>;
    return <Badge variant="outline" className="bg-red-50 text-red-700">Niedrig</Badge>;
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'property': return 'Immobilie';
      case 'unit': return '↳ Einheit';
      case 'contact': return 'Kontakt';
      case 'financing': return 'Finanzierung';
      default: return type;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Import-Vorschau</CardTitle>
              <CardDescription>
                KI-Konfidenz: {Math.round(parsed.confidence * 100)}% | 
                Erkannt: {parsed.data.detected_type || 'Dokument'}
              </CardDescription>
            </div>
          </div>
          {getConfidenceBadge(parsed.confidence)}
        </div>

        {parsed.warnings.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Hinweise</p>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                  {parsed.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectAll} 
              onCheckedChange={handleToggleAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Alle auswählen ({selectedCount}/{rows.length})
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            {propertiesCount > 0 && <span className="mr-3">{propertiesCount} Immobilien</span>}
            {unitsCount > 0 && <span className="mr-3">{unitsCount} Einheiten</span>}
            {contactsCount > 0 && <span>{contactsCount} Kontakte</span>}
          </div>
        </div>

        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-24">Typ</TableHead>
                <TableHead>Daten</TableHead>
                <TableHead className="w-20">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={`${row.type === 'unit' ? 'bg-muted/30' : ''} ${!row.selected ? 'opacity-50' : ''}`}
                >
                  <TableCell>
                    <Checkbox 
                      checked={row.selected}
                      onCheckedChange={() => handleToggleRow(row.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {getTypeLabel(row.type)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {row.fields.slice(0, 5).map((field) => (
                        <div key={field.key} className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{field.label}:</span>
                          <Input
                            value={String(field.value)}
                            onChange={(e) => handleFieldChange(row.id, field.key, e.target.value)}
                            className={`h-7 w-auto min-w-[80px] max-w-[150px] text-sm ${getConfidenceColor(field.confidence)}`}
                            disabled={!row.selected}
                          />
                        </div>
                      ))}
                      {row.fields.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{row.fields.length - 5} weitere
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.hasWarnings ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Keine Daten zum Importieren gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          Abbrechen
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={isImporting || selectedCount === 0}
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importiere...
            </>
          ) : (
            <>
              {selectedCount} Einträge importieren
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ImportPreview;