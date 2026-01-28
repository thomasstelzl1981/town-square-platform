import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilePreview } from '@/components/shared/FileUploader';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { 
  Upload, Download, Trash2, Loader2, FileSpreadsheet, 
  Building2, Users, FileText, Home, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface TestBatch {
  batch_id: string;
  batch_name: string;
  imported_at: string;
  imported_by: string;
  entity_counts: Record<string, number>;
}

interface ExcelPropertyRow {
  Objekt?: string;
  Art?: string;
  Adresse?: string;
  Ort?: string;
  PLZ?: string | number;
  qm?: string | number;
  Kaltmiete?: string | number;
  Mieter?: string;
  'Mieter seit'?: string;
  Mieterhöhung?: string;
  Kaufpreis?: string | number;
  Restschuld?: string | number;
  Zinssatz?: string | number;
  Tilgung?: string | number;
  Bank?: string;
}

function normalizeHeaderCell(val: unknown): string {
  if (val === undefined || val === null) return '';
  const raw = String(val).trim().toLowerCase();
  // normalize german chars
  const de = raw
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
  // keep only alphanumerics
  return de.replace(/[^a-z0-9]/g, '');
}

const HEADER_ALIASES: Record<string, keyof ExcelPropertyRow> = {
  // object code
  objekt: 'Objekt',
  code: 'Objekt',
  objektid: 'Objekt',
  objektnr: 'Objekt',
  objektnummer: 'Objekt',

  // basics
  art: 'Art',
  ort: 'Ort',
  adresse: 'Adresse',
  strassehausnummer: 'Adresse',
  strasse: 'Adresse',
  hausnummer: 'Adresse',
  plz: 'PLZ',
  postleitzahl: 'PLZ',

  // size
  qm: 'qm',
  groesse: 'qm',
  flaeche: 'qm',
  gesamtflaeche: 'qm',
  groessesqm: 'qm',

  // rent
  kaltmiete: 'Kaltmiete',
  warmmiete: 'Kaltmiete', // best-effort fallback when only warm rent exists

  // tenant
  mieter: 'Mieter',
  mieterseit: 'Mieter seit',
  mieterhoehung: 'Mieterhöhung',

  // purchase/financing
  kaufpreis: 'Kaufpreis',
  restschuld: 'Restschuld',
  zinssatz: 'Zinssatz',
  zins: 'Zinssatz',
  tilgung: 'Tilgung',
  bank: 'Bank',
};

function scoreHeaderRow(row: unknown[]): { score: number; mapped: Set<keyof ExcelPropertyRow> } {
  const mapped = new Set<keyof ExcelPropertyRow>();
  for (const cell of row) {
    const key = HEADER_ALIASES[normalizeHeaderCell(cell)];
    if (key) mapped.add(key);
  }
  return { score: mapped.size, mapped };
}

function pickBestSheetAndHeader(workbook: XLSX.WorkBook) {
  let best: {
    sheetName: string;
    headerRowIndex: number;
    headerRow: unknown[];
    mapped: Set<keyof ExcelPropertyRow>;
    score: number;
  } | null = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
    const maxScan = Math.min(matrix.length, 60);

    for (let i = 0; i < maxScan; i++) {
      const row = matrix[i] || [];
      const { score, mapped } = scoreHeaderRow(row);

      // Require at least a plausible core set: object-code + art + one of address/city/postal
      const isPlausible = mapped.has('Objekt') && mapped.has('Art') && (mapped.has('Adresse') || mapped.has('Ort') || mapped.has('PLZ'));
      if (!isPlausible) continue;

      if (!best || score > best.score) {
        best = { sheetName, headerRowIndex: i, headerRow: row, mapped, score };
      }
    }
  }

  return best;
}

function buildColumnIndexMap(headerRow: unknown[]): Map<number, keyof ExcelPropertyRow> {
  const map = new Map<number, keyof ExcelPropertyRow>();
  headerRow.forEach((cell, idx) => {
    const alias = HEADER_ALIASES[normalizeHeaderCell(cell)];
    if (alias) map.set(idx, alias);
  });
  return map;
}

function parseWorkbookToRows(workbook: XLSX.WorkBook): {
  sheetName: string;
  rows: ExcelPropertyRow[];
  headerColumns: string[];
} {
  const picked = pickBestSheetAndHeader(workbook);
  const fallbackSheetName = workbook.SheetNames[0];

  if (!fallbackSheetName) {
    return { sheetName: '—', rows: [], headerColumns: [] };
  }

  if (!picked) {
    // Backwards-compatible behavior
    const sheet = workbook.Sheets[fallbackSheetName];
    const rows: ExcelPropertyRow[] = XLSX.utils.sheet_to_json(sheet);
    const headerColumns = rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : [];
    return { sheetName: fallbackSheetName, rows, headerColumns };
  }

  const sheet = workbook.Sheets[picked.sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
  const headerColumns = (picked.headerRow || []).map((c) => String(c || '')).filter(Boolean);
  const indexMap = buildColumnIndexMap(picked.headerRow);

  const rows: ExcelPropertyRow[] = [];
  for (let r = picked.headerRowIndex + 1; r < matrix.length; r++) {
    const rowArr = matrix[r] || [];
    // skip fully empty rows
    if (!rowArr.some((c) => String(c ?? '').trim() !== '')) continue;

    const out: ExcelPropertyRow = {};
    for (const [colIdx, key] of indexMap.entries()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[key] = rowArr[colIdx] as any;
    }
    rows.push(out);
  }

  return { sheetName: picked.sheetName, rows, headerColumns };
}

// Utility to parse German/EN number formats (1.234,56 OR 1,234.56 → 1234.56)
function parseGermanNumber(val: string | number | undefined): number | null {
  if (val === undefined || val === null || val === '' || val === '-') return null;
  if (typeof val === 'number') return val;

  const raw = val.toString().trim();
  if (!raw) return null;

  // Keep digits, separators, minus
  const stripped = raw.replace(/[^0-9,.-]/g, '');
  if (!stripped) return null;

  const lastComma = stripped.lastIndexOf(',');
  const lastDot = stripped.lastIndexOf('.');

  let normalized = stripped;
  if (lastComma !== -1 && lastDot !== -1) {
    // both present → decide decimal by last separator
    if (lastComma > lastDot) {
      // 1.234,56 (DE)
      normalized = stripped.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 (EN)
      normalized = stripped.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // comma only: could be decimal or thousand
    const decimals = stripped.length - lastComma - 1;
    normalized = decimals === 2 ? stripped.replace(',', '.') : stripped.replace(/,/g, '');
  } else if (lastDot !== -1) {
    // dot only: could be decimal or thousand
    const decimals = stripped.length - lastDot - 1;
    normalized = decimals === 2 ? stripped : stripped.replace(/\./g, '');
  }

  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

// Map property type abbreviations
function mapPropertyType(art: string | undefined): string {
  if (!art) return 'residential';
  const upper = art.toUpperCase();
  if (upper.includes('MFH') || upper.includes('MEHRFAMILIEN')) return 'multi_family';
  if (upper.includes('DHH') || upper.includes('DOPPEL')) return 'semi_detached';
  if (upper.includes('EFH') || upper.includes('EINFAMILIEN')) return 'single_family';
  if (upper.includes('ETW') || upper.includes('EIGENTUM')) return 'condo';
  if (upper.includes('GEW') || upper.includes('GEWERBE')) return 'commercial';
  return 'residential';
}

export function TestDataManager() {
  const { user, activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastParseInfo, setLastParseInfo] = useState<{sheetName: string; rowCount: number; columns: string[]} | null>(null);

  // Fetch test batches from test_data_registry
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['test-batches', activeOrganization?.id],
    queryFn: async (): Promise<TestBatch[]> => {
      if (!activeOrganization?.id) return [];
      
      // Type-safe query with explicit typing
      const result = await supabase
        .from('test_data_registry')
        .select('batch_id, batch_name, imported_at, imported_by, entity_type')
        .eq('tenant_id', activeOrganization.id)
        .order('imported_at', { ascending: false });

      if (result.error) {
        console.error('Error fetching batches:', result.error);
        return [];
      }

      const data = result.data as Array<{ 
        batch_id: string; 
        batch_name: string | null; 
        imported_at: string; 
        imported_by: string | null; 
        entity_type: string 
      }> | null;

      // Group by batch_id
      const batchMap = new Map<string, TestBatch>();
      (data || []).forEach((row) => {
        const existing = batchMap.get(row.batch_id);
        if (existing) {
          existing.entity_counts[row.entity_type] = (existing.entity_counts[row.entity_type] || 0) + 1;
        } else {
          batchMap.set(row.batch_id, {
            batch_id: row.batch_id,
            batch_name: row.batch_name || `Import ${row.batch_id.slice(0, 8)}`,
            imported_at: row.imported_at,
            imported_by: row.imported_by || user?.id || '',
            entity_counts: { [row.entity_type]: 1 }
          });
        }
      });

      return Array.from(batchMap.values());
    },
    enabled: !!activeOrganization?.id
  });

  // Delete batch mutation
  const deleteBatch = useMutation({
    mutationFn: async (batchId: string) => {
      if (!activeOrganization?.id) throw new Error('No organization');

      // Get all entities in this batch
      const { data: entities } = await supabase
        .from('test_data_registry')
        .select('entity_type, entity_id')
        .eq('batch_id', batchId)
        .eq('tenant_id', activeOrganization.id);

      if (!entities || entities.length === 0) return;

      // Delete in correct order (respecting foreign keys)
      const deleteOrder = ['listing_publication', 'listing_partner_term', 'listing', 'lease', 'document_link', 'document', 'unit', 'storage_node', 'contact', 'property_financing', 'property'];
      
      for (const entityType of deleteOrder) {
        const ids = entities.filter(e => e.entity_type === entityType).map(e => e.entity_id);
        if (ids.length > 0) {
          // Use type-safe table names
          let tableName: string;
          switch (entityType) {
            case 'listing_publication': tableName = 'listing_publications'; break;
            case 'listing_partner_term': tableName = 'listing_partner_terms'; break;
            case 'property_financing': tableName = 'property_financing'; break;
            case 'property': tableName = 'properties'; break;
            case 'unit': tableName = 'units'; break;
            case 'contact': tableName = 'contacts'; break;
            case 'lease': tableName = 'leases'; break;
            case 'listing': tableName = 'listings'; break;
            case 'document': tableName = 'documents'; break;
            case 'document_link': tableName = 'document_links'; break;
            case 'storage_node': tableName = 'storage_nodes'; break;
            default: tableName = `${entityType}s`;
          }
          
          // Delete using raw SQL via rpc or direct delete with correct types
          try {
            if (tableName === 'properties') {
              await supabase.from('properties').delete().in('id', ids);
            } else if (tableName === 'units') {
              await supabase.from('units').delete().in('id', ids);
            } else if (tableName === 'contacts') {
              await supabase.from('contacts').delete().in('id', ids);
            } else if (tableName === 'leases') {
              await supabase.from('leases').delete().in('id', ids);
            } else if (tableName === 'listings') {
              await supabase.from('listings').delete().in('id', ids);
            } else if (tableName === 'listing_publications') {
              await supabase.from('listing_publications').delete().in('id', ids);
            } else if (tableName === 'listing_partner_terms') {
              await supabase.from('listing_partner_terms').delete().in('id', ids);
            } else if (tableName === 'property_financing') {
              await supabase.from('property_financing').delete().in('id', ids);
            } else if (tableName === 'documents') {
              await supabase.from('documents').delete().in('id', ids);
            } else if (tableName === 'document_links') {
              await supabase.from('document_links').delete().in('id', ids);
            } else if (tableName === 'storage_nodes') {
              await supabase.from('storage_nodes').delete().in('id', ids);
            }
          } catch (err) {
            console.warn(`Error deleting ${entityType}:`, err);
          }
        }
      }

      // Finally delete registry entries
      await supabase
        .from('test_data_registry')
        .delete()
        .eq('batch_id', batchId)
        .eq('tenant_id', activeOrganization.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-batches'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Testdaten erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Download template - updated for new format
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Portfolio sheet (main data entry)
    const portfolioData = [
      ['Objekt', 'Art', 'Adresse', 'Ort', 'PLZ', 'qm', 'Kaltmiete', 'Mieter', 'Mieter seit', 'Mieterhöhung', 'Kaufpreis', 'Restschuld', 'Zinssatz', 'Tilgung', 'Bank'],
      ['ZL001', 'MFH', 'Hauptstraße 15', 'Leipzig', '04103', '120,5', '850,00 €', 'Max Mustermann', '01.01.2020', 'IVD 2025', '250.000 €', '180.000 €', '3,5%', '2%', 'Sparkasse'],
      ['ZL001', 'MFH', 'Hauptstraße 15', 'Leipzig', '04103', '95,0', '720,00 €', 'Erika Musterfrau', '15.06.2021', 'IVD 2024', '-', '-', '-', '-', '-'],
      ['ZL002', 'DHH', 'Nebenweg 8', 'Dresden', '01097', '180', '1.200,00 €', 'Firma GmbH', '01.03.2022', 'Staffel', '320.000 €', '220.000 €', '2,8%', '2,5%', 'VR Bank'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(portfolioData), 'Portfolio');

    XLSX.writeFile(wb, 'Immobilienaufstellung_Vorlage.xlsx');
    toast.success('Vorlage heruntergeladen');
  };

  // Process file (shared between input change and drag-drop)
  const processFile = async (file: File) => {
    if (!file || !activeOrganization?.id) {
      toast.error('Keine Datei oder Organisation ausgewählt');
      return;
    }

    setSelectedFile(file);
    setIsImporting(true);
    setLastParseInfo(null);
    const batchId = crypto.randomUUID();
    const batchName = `Import_${new Date().toISOString().slice(0, 16).replace('T', '_')}`;
    const tenantId = activeOrganization.id;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      console.log('Excel sheets found:', workbook.SheetNames);
      
      const parsed = parseWorkbookToRows(workbook);
      const rows = parsed.rows;

      // Debug info
      setLastParseInfo({ sheetName: parsed.sheetName, rowCount: rows.length, columns: parsed.headerColumns });
      console.log('Parsed sheet:', parsed.sheetName, 'Rows:', rows.length, 'Columns:', parsed.headerColumns);
      
      if (rows.length === 0) {
        toast.error(
          `Keine Datenzeilen erkannt. Tipp: Die Datei muss eine Spalte "Objekt" oder "Code" enthalten (und eine Header-Zeile).`
        );
        return;
      }

      // Track created entities
      const propertyMap = new Map<string, string>(); // code -> id
      const contactMap = new Map<string, string>(); // name -> id
      const createdEntities: { entity_type: string; entity_id: string }[] = [];
      
      let unitCount = 0;
      let propertyCount = 0;
      let contactCount = 0;
      let leaseCount = 0;

      // Process each row (1 row = 1 unit)
      for (const row of rows) {
        const code = row.Objekt?.toString().trim();
        if (!code) continue;

        // Check if property exists or create it
        let propertyId = propertyMap.get(code);
        
        if (!propertyId) {
          // Create property using explicit array format for insert
          const { data: newProp, error: propError } = await supabase
            .from('properties')
            .insert([{
              tenant_id: tenantId,
              code: code,
              property_type: mapPropertyType(row.Art),
               address: row.Adresse || '',
              city: row.Ort || '',
              postal_code: row.PLZ?.toString() || null,
              usage_type: 'residential',
              status: 'active',
              purchase_price: parseGermanNumber(row.Kaufpreis),
              public_id: `P-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            }])
            .select('id')
            .single();

          if (propError) {
            console.error('Property insert error:', propError);
            continue;
          }

          propertyId = newProp.id;
          propertyMap.set(code, propertyId);
          propertyCount++;

          createdEntities.push({ entity_type: 'property', entity_id: propertyId });

          // Create financing if present
          const restschuld = parseGermanNumber(row.Restschuld);
          const zinssatz = parseGermanNumber(row.Zinssatz);
          
          if (restschuld && restschuld > 0) {
            const { data: financing } = await supabase
              .from('property_financing')
              .insert([{
                tenant_id: tenantId,
                property_id: propertyId,
                lender_name: row.Bank || null,
                current_balance: restschuld,
                interest_rate: zinssatz,
                amortization_rate: parseGermanNumber(row.Tilgung),
                is_active: true
              }])
              .select('id')
              .single();

            if (financing) {
              createdEntities.push({ entity_type: 'property_financing', entity_id: financing.id });
            }
          }
        }

        // Create unit
        const areaSqm = parseGermanNumber(row.qm);
        const monthlyRent = parseGermanNumber(row.Kaltmiete);
        
        // Generate unit number
        const existingUnitsForProp = createdEntities.filter(e => e.entity_type === 'unit').length;
        const unitNumber = `WE${existingUnitsForProp + 1}`;

        const unitInsert = {
          tenant_id: tenantId,
          property_id: propertyId,
          unit_number: unitNumber,
          area_sqm: areaSqm,
          current_monthly_rent: monthlyRent,
          usage_type: 'residential',
          public_id: `U-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        };

        const { data: newUnit, error: unitError } = await supabase
          .from('units')
          .insert(unitInsert)
          .select('id')
          .single();

        if (unitError) {
          console.error('Unit insert error:', unitError);
          continue;
        }

        unitCount++;
        createdEntities.push({ entity_type: 'unit', entity_id: newUnit.id });

        // Create contact if tenant name present
        const mieterName = row.Mieter?.trim();
        if (mieterName && mieterName !== '-') {
          let contactId = contactMap.get(mieterName);

          if (!contactId) {
            // Parse name
            const nameParts = mieterName.split(' ');
            const firstName = nameParts[0] || 'Unbekannt';
            const lastName = nameParts.slice(1).join(' ') || mieterName;
            const isCompany = mieterName.toLowerCase().includes('gmbh') || 
                             mieterName.toLowerCase().includes('kg') ||
                             mieterName.toLowerCase().includes('ag');

            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .insert({
                tenant_id: tenantId,
                first_name: isCompany ? mieterName : firstName,
                last_name: isCompany ? '' : lastName,
                company: isCompany ? mieterName : null,
                public_id: `C-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
              })
              .select('id')
              .single();

            if (contactError) {
              console.error('Contact insert error:', contactError);
            } else {
              contactId = newContact.id;
              contactMap.set(mieterName, contactId);
              contactCount++;
              createdEntities.push({ entity_type: 'contact', entity_id: contactId });
            }
          }

          // Create lease
          if (contactId) {
            const { data: newLease, error: leaseError } = await supabase
              .from('leases')
              .insert({
                tenant_id: tenantId,
                unit_id: newUnit.id,
                tenant_contact_id: contactId,
                monthly_rent: monthlyRent || 0,
                start_date: '2020-01-01',
                status: 'active',
                rent_increase: row.Mieterhöhung || null
              })
              .select('id')
              .single();

            if (leaseError) {
              console.error('Lease insert error:', leaseError);
            } else {
              leaseCount++;
              createdEntities.push({ entity_type: 'lease', entity_id: newLease.id });
            }
          }
        }
      }

      // Register all entities in test_data_registry
      if (createdEntities.length > 0) {
        const registryRows = createdEntities.map(e => ({
          tenant_id: tenantId,
          batch_id: batchId,
          batch_name: batchName,
          entity_type: e.entity_type,
          entity_id: e.entity_id,
          imported_at: new Date().toISOString(),
          imported_by: user?.id || null
        }));

        await supabase.from('test_data_registry').insert(registryRows);
      }

      toast.success(`Import erfolgreich: ${propertyCount} Objekte, ${unitCount} Einheiten, ${contactCount} Kontakte, ${leaseCount} Mietverträge`);
      queryClient.invalidateQueries({ queryKey: ['test-batches'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import fehlgeschlagen');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      toast.error('Bitte nur Excel-Dateien (.xlsx, .xls) hochladen');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'property': return <Building2 className="h-3 w-3" />;
      case 'unit': return <Home className="h-3 w-3" />;
      case 'contact': return <Users className="h-3 w-3" />;
      case 'document': return <FileText className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel-Import (Unit-basiert)
          </CardTitle>
          <CardDescription>
            Importieren Sie Ihre Immobilienaufstellung. Jede Zeile = 1 Einheit (Wohnung/Gewerbe). 
            Gebäude mit gleicher Objekt-ID werden automatisch zusammengefasst.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isImporting && fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer
              ${isDragOver 
                ? 'border-primary bg-primary/5 scale-[1.01]' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
              }
              ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium">Datei angenommen – wird gelesen & importiert...</p>
              </>
            ) : (
              <>
                <Upload className={`h-10 w-10 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-center">
                  <p className="text-sm font-medium">Excel-Datei hier ablegen</p>
                  <p className="text-xs text-muted-foreground">oder klicken zum Auswählen (.xlsx, .xls)</p>
                </div>
              </>
            )}
          </div>

          {selectedFile && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Letzte Datei:</div>
              <FilePreview file={selectedFile} />
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadTemplate} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Vorlage herunterladen
            </Button>
          </div>
          
          {/* Debug info after parse attempt */}
          {lastParseInfo && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><strong>Letzter Parse:</strong> Sheet "{lastParseInfo.sheetName}" mit {lastParseInfo.rowCount} Zeilen</p>
              <p><strong>Gefundene Spalten:</strong> {lastParseInfo.columns.join(', ') || 'keine'}</p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Erwartete Spalten (Alias ok):</strong> Objekt/Code, Art, Adresse/Straße+Hausnummer, Ort, PLZ/Postleitzahl, qm/Größe, Kaltmiete/Warmmiete, Mieter, Kaufpreis, Restschuld, Zinssatz/Zins, Tilgung, Bank</p>
            <p><strong>Hinweis:</strong> 1 Zeile = 1 Wohneinheit. Gebäude werden über Objekt-Code gruppiert.</p>
          </div>
        </CardContent>
      </Card>

      {/* Active Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Test-Batches</CardTitle>
          <CardDescription>
            Importierte Testdaten-Batches. Ein Batch kann vollständig mit allen verknüpften Daten gelöscht werden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Testdaten vorhanden</p>
              <p className="text-sm">Laden Sie eine Excel-Datei hoch, um zu starten</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Importiert</TableHead>
                  <TableHead>Datensätze</TableHead>
                  <TableHead className="w-24">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.batch_id}>
                    <TableCell className="font-medium">{batch.batch_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(batch.imported_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(batch.entity_counts).map(([type, count]) => (
                          <Badge key={type} variant="secondary" className="text-xs gap-1">
                            {getEntityIcon(type)} {type}: {count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Batch löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Alle Daten aus "{batch.batch_name}" werden unwiderruflich gelöscht, 
                              einschließlich aller verknüpften Einträge (Properties, Units, Documents, etc.).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBatch.mutate(batch.batch_id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {deleteBatch.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
