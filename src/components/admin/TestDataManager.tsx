import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilePreview } from '@/components/shared/FileUploader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  Building2, Users, FileText, Home, CheckCircle2, AlertCircle, Sparkles, X,
  Database, RefreshCw, Car, ShieldCheck, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { getXlsx } from '@/lib/lazyXlsx';
import { seedDemoData, type DemoSeedResult } from '@/hooks/useDemoSeedEngine';
import { cleanupDemoData } from '@/hooks/useDemoCleanup';
import demoManifest from '../../../public/demo-data/demo_manifest.json';

// ─── SSOT Entity Definitions from Manifest ─────────────────

interface ManifestEntity {
  file: string | null;
  expectedCount: number;
  dbTable: string;
  seedMethod?: string;
}

const ENTITY_LABELS: Record<string, { label: string; icon: string }> = {
  contacts: { label: 'Kontakte', icon: 'users' },
  properties: { label: 'Immobilien', icon: 'building' },
  units: { label: 'Einheiten', icon: 'home' },
  leases: { label: 'Mietverträge', icon: 'file' },
  loans: { label: 'Darlehen', icon: 'file' },
  bank_accounts: { label: 'Bankkonten', icon: 'database' },
  bank_transactions: { label: 'Transaktionen', icon: 'database' },
  household_persons: { label: 'Haushalt', icon: 'users' },
  vehicles: { label: 'Fahrzeuge', icon: 'car' },
  pv_plants: { label: 'PV-Anlagen', icon: 'shield' },
  insurance_contracts: { label: 'Versicherungen', icon: 'shield' },
  kv_contracts: { label: 'KV-Verträge', icon: 'shield' },
  vorsorge_contracts: { label: 'Vorsorge', icon: 'shield' },
  user_subscriptions: { label: 'Abos', icon: 'package' },
  private_loans: { label: 'Privatkredite', icon: 'file' },
  miety_homes: { label: 'Zuhause', icon: 'home' },
  miety_contracts: { label: 'Hausverträge', icon: 'file' },
  acq_mandates: { label: 'Mandate', icon: 'file' },
  pet_customers: { label: 'Tierkunden', icon: 'users' },
  pets: { label: 'Haustiere', icon: 'package' },
  pet_bookings: { label: 'Buchungen', icon: 'file' },
};

function getEntityIcon(type: string) {
  const info = ENTITY_LABELS[type];
  const iconType = info?.icon ?? 'file';
  switch (iconType) {
    case 'users': return <Users className="h-3 w-3" />;
    case 'building': return <Building2 className="h-3 w-3" />;
    case 'home': return <Home className="h-3 w-3" />;
    case 'car': return <Car className="h-3 w-3" />;
    case 'shield': return <ShieldCheck className="h-3 w-3" />;
    case 'database': return <Database className="h-3 w-3" />;
    case 'package': return <Package className="h-3 w-3" />;
    default: return <FileText className="h-3 w-3" />;
  }
}

interface TestBatch {
  batch_id: string;
  batch_name: string;
  imported_at: string;
  imported_by: string;
  entity_counts: Record<string, number>;
}

interface AIExtractedRow {
  code: string;
  art: string;
  adresse: string;
  ort: string;
  plz: string;
  qm: number | null;
  kaltmiete: number | null;
  mieter: string | null;
  mieterSeit: string | null;
  mieterhoehung: string | null;
  kaufpreis: number | null;
  restschuld: number | null;
  zinssatz: number | null;
  tilgung: number | null;
  bank: string | null;
  confidence: number;
  notes: string | null;
}

interface AISummary {
  totalRows: number;
  uniqueProperties: number;
  avgConfidence: number;
  issues: string[];
}

type ImportPhase = 'idle' | 'uploading' | 'analyzing' | 'preview' | 'importing' | 'done';

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
  
  // State
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedRows, setExtractedRows] = useState<AIExtractedRow[]>([]);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SSOT Demo State
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // ─── SSOT Live Counts ────────────────────────────────────
  const entities = demoManifest.entities as Record<string, ManifestEntity>;
  const entityKeys = Object.keys(entities);

  const { data: liveCounts, isLoading: isLoadingCounts, refetch: refetchCounts } = useQuery({
    queryKey: ['demo-ssot-counts', activeOrganization?.id],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!activeOrganization?.id) return {};
      const counts: Record<string, number> = {};

      // Fetch counts in parallel for all entity tables
      const results = await Promise.allSettled(
        entityKeys.map(async (key) => {
          const table = entities[key].dbTable;
          const { count, error } = await (supabase as any)
            .from(table)
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', activeOrganization.id);
          return { key, count: error ? 0 : (count ?? 0) };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          counts[r.value.key] = r.value.count;
        }
      }
      return counts;
    },
    enabled: !!activeOrganization?.id,
    refetchInterval: false,
  });

  // ─── Seed Demo Data ──────────────────────────────────────
  const handleSeedDemo = async () => {
    if (!activeOrganization?.id) return;
    setIsSeeding(true);
    try {
      const result = await seedDemoData(activeOrganization.id);
      if (result.success) {
        toast.success('Demo-Daten erfolgreich eingespielt', {
          description: `${Object.values(result.seeded).reduce((a, b) => a + b, 0)} Datensätze in ${Object.keys(result.seeded).length} Tabellen`,
        });
      } else {
        toast.warning('Demo-Daten teilweise eingespielt', {
          description: `${result.errors.length} Fehler aufgetreten`,
        });
      }
      refetchCounts();
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err) {
      toast.error('Fehler beim Einspielen der Demo-Daten');
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  // ─── Cleanup Demo Data ───────────────────────────────────
  const handleCleanupDemo = async () => {
    if (!activeOrganization?.id) return;
    setIsCleaning(true);
    try {
      const result = await cleanupDemoData(activeOrganization.id);
      if (result.success) {
        const total = Object.values(result.deleted).reduce((a, b) => a + b, 0);
        toast.success('Demo-Daten bereinigt', {
          description: `${total} Datensätze gelöscht`,
        });
      } else {
        toast.warning('Bereinigung mit Fehlern', {
          description: result.errors.join(', '),
        });
      }
      refetchCounts();
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err) {
      toast.error('Fehler bei der Bereinigung');
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  // Fetch test batches from test_data_registry
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['test-batches', activeOrganization?.id],
    queryFn: async (): Promise<TestBatch[]> => {
      if (!activeOrganization?.id) return [];
      
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
          try {
            if (entityType === 'property') await supabase.from('properties').delete().in('id', ids);
            else if (entityType === 'unit') await supabase.from('units').delete().in('id', ids);
            else if (entityType === 'contact') await supabase.from('contacts').delete().in('id', ids);
            else if (entityType === 'lease') await supabase.from('leases').delete().in('id', ids);
            else if (entityType === 'listing') await supabase.from('listings').delete().in('id', ids);
            else if (entityType === 'listing_publication') await supabase.from('listing_publications').delete().in('id', ids);
            else if (entityType === 'listing_partner_term') await supabase.from('listing_partner_terms').delete().in('id', ids);
            else if (entityType === 'property_financing') await supabase.from('property_financing').delete().in('id', ids);
            else if (entityType === 'document') await supabase.from('documents').delete().in('id', ids);
            else if (entityType === 'document_link') await supabase.from('document_links').delete().in('id', ids);
            else if (entityType === 'storage_node') await supabase.from('storage_nodes').delete().in('id', ids);
          } catch (err) {
            console.warn(`Error deleting ${entityType}:`, err);
          }
        }
      }

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

  // Download template
  const downloadTemplate = async () => {
    const XLSX = await getXlsx();
    const wb = XLSX.utils.book_new();
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

  // Reset state
  const resetImport = () => {
    setPhase('idle');
    setSelectedFile(null);
    setExtractedRows([]);
    setAiSummary(null);
    setImportProgress(0);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // PHASE 1+2: Upload file → send to AI
  const processFile = async (file: File) => {
    if (!file || !activeOrganization?.id) {
      toast.error('Keine Datei oder Organisation ausgewählt');
      return;
    }

    setSelectedFile(file);
    setPhase('uploading');
    setErrorMessage(null);

    try {
      // Convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      setPhase('analyzing');

      // Call AI extraction edge function
      const { data, error } = await supabase.functions.invoke('sot-excel-ai-import', {
        body: { excelBase64: base64, fileName: file.name }
      });

      if (error) {
        console.error('AI extraction error:', error);
        setErrorMessage(error.message || 'KI-Extraktion fehlgeschlagen');
        setPhase('idle');
        return;
      }

      if (!data?.success) {
        setErrorMessage(data?.error || 'Keine Daten erkannt');
        setPhase('idle');
        return;
      }

      setExtractedRows(data.data || []);
      setAiSummary(data.summary || null);
      setPhase('preview');

    } catch (err) {
      console.error('File processing error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setPhase('idle');
    }
  };

  // PHASE 3: Import extracted data to DB
  const importExtractedData = async () => {
    if (!activeOrganization?.id || extractedRows.length === 0) return;

    setPhase('importing');
    setImportProgress(0);

    const batchId = crypto.randomUUID();
    const batchName = `KI-Import_${new Date().toISOString().slice(0, 16).replace('T', '_')}`;
    const tenantId = activeOrganization.id;

    const propertyMap = new Map<string, string>();
    const contactMap = new Map<string, string>();
    const createdEntities: { entity_type: string; entity_id: string }[] = [];

    let propertyCount = 0;
    let unitCount = 0;
    let contactCount = 0;
    let leaseCount = 0;

    try {
      for (let i = 0; i < extractedRows.length; i++) {
        const row = extractedRows[i];
        setImportProgress(Math.round((i / extractedRows.length) * 100));

        const code = row.code?.trim();
        if (!code) continue;

        // Create or get property
        let propertyId = propertyMap.get(code);

        if (!propertyId) {
          const { data: newProp, error: propError } = await supabase
            .from('properties')
            .insert([{
              tenant_id: tenantId,
              code: code,
              property_type: mapPropertyType(row.art),
              address: row.adresse || '',
              city: row.ort || '',
              postal_code: row.plz || null,
              usage_type: 'residential',
              status: 'active',
              purchase_price: row.kaufpreis,
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
          if (row.restschuld && row.restschuld > 0) {
            const { data: financing } = await supabase
              .from('property_financing')
              .insert([{
                tenant_id: tenantId,
                property_id: propertyId,
                lender_name: row.bank || null,
                current_balance: row.restschuld,
                interest_rate: row.zinssatz,
                amortization_rate: row.tilgung,
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
        const unitNumber = `WE${createdEntities.filter(e => e.entity_type === 'unit').length + 1}`;

        const { data: newUnit, error: unitError } = await supabase
          .from('units')
          .insert({
            tenant_id: tenantId,
            property_id: propertyId,
            unit_number: unitNumber,
            area_sqm: row.qm,
            current_monthly_rent: row.kaltmiete,
            usage_type: 'residential',
            public_id: `U-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
          })
          .select('id')
          .single();

        if (unitError) {
          console.error('Unit insert error:', unitError);
          continue;
        }

        unitCount++;
        createdEntities.push({ entity_type: 'unit', entity_id: newUnit.id });

        // Create contact if tenant name present
        const mieterName = row.mieter?.trim();
        if (mieterName && mieterName !== '-') {
          let contactId = contactMap.get(mieterName);

          if (!contactId) {
            const nameParts = mieterName.split(' ');
            const firstName = nameParts[0] || 'Unbekannt';
            const lastName = nameParts.slice(1).join(' ') || mieterName;
            const isCompany = /gmbh|kg|ag|ug/i.test(mieterName);

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

            if (!contactError && newContact) {
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
                monthly_rent: row.kaltmiete || 0,
                start_date: row.mieterSeit || '2020-01-01',
                status: 'active',
                rent_increase: row.mieterhoehung || null
              })
              .select('id')
              .single();

            if (!leaseError && newLease) {
              leaseCount++;
              createdEntities.push({ entity_type: 'lease', entity_id: newLease.id });
            }
          }
        }
      }

      // Register in test_data_registry
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

      setImportProgress(100);
      setPhase('done');
      toast.success(`Import erfolgreich: ${propertyCount} Objekte, ${unitCount} Einheiten, ${contactCount} Kontakte, ${leaseCount} Mietverträge`);

      queryClient.invalidateQueries({ queryKey: ['test-batches'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });

      // Reset after delay
      setTimeout(resetImport, 2000);

    } catch (err) {
      console.error('Import error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Import fehlgeschlagen');
      setPhase('preview');
    }
  };

  // File handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-green-600 text-xs">✓ {Math.round(confidence * 100)}%</Badge>;
    if (confidence >= 0.7) return <Badge className="bg-yellow-600 text-xs">⚠ {Math.round(confidence * 100)}%</Badge>;
    return <Badge variant="destructive" className="text-xs">! {Math.round(confidence * 100)}%</Badge>;
  };

  const isProcessing = phase === 'uploading' || phase === 'analyzing' || phase === 'importing';

  // Helper: status color for entity count
  const getCountStatus = (actual: number, expected: number) => {
    if (actual >= expected) return 'bg-green-500/15 border-green-500/30 text-green-700';
    if (actual > 0) return 'bg-yellow-500/15 border-yellow-500/30 text-yellow-700';
    return 'bg-muted border-border text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Demo-Daten SSOT Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Demo-Daten SSOT
          </CardTitle>
          <CardDescription>
            Komplette Demo-Umgebung aus <code className="bg-muted px-1 rounded text-xs">public/demo-data/</code> — 
            {entityKeys.length} Entity-Typen, gesteuert über <code className="bg-muted px-1 rounded text-xs">demo_manifest.json</code>.
            IDs: <code className="bg-muted px-1 rounded text-xs">d0000000-*</code> / <code className="bg-muted px-1 rounded text-xs">e0000000-*</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Grid */}
          {isLoadingCounts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="p-2 bg-background rounded border animate-pulse h-10" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-sm">
              {entityKeys.map((key) => {
                const entity = entities[key];
                const actual = liveCounts?.[key] ?? 0;
                const expected = entity.expectedCount;
                const label = ENTITY_LABELS[key]?.label ?? key;
                return (
                  <div
                    key={key}
                    className={`p-2 rounded border flex items-center gap-1.5 ${getCountStatus(actual, expected)}`}
                  >
                    {getEntityIcon(key)}
                    <span className="truncate">
                      {label}: <strong>{actual}</strong>/{expected}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSeedDemo} 
              disabled={isSeeding || isCleaning}
              className="flex-1"
            >
              {isSeeding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Einspielen / Aktualisieren
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSeeding || isCleaning}>
                  {isCleaning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Zurücksetzen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Demo-Daten löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Alle Demo-Daten (IDs <code>d0000000-*</code> / <code>e0000000-*</code>) werden 
                    unwiderruflich aus allen {entityKeys.length} Tabellen gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCleanupDemo}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Alle Demo-Daten löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          {/* Info */}
          <p className="text-xs text-muted-foreground">
            Seed-Engine: <code className="bg-muted px-1 rounded">useDemoSeedEngine</code> | 
            Cleanup: <code className="bg-muted px-1 rounded">useDemoCleanup</code> | 
            Manifest v{demoManifest.version}
          </p>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-gestützter Excel-Import
          </CardTitle>
          <CardDescription>
            Laden Sie beliebige Excel-Dateien hoch – die KI erkennt automatisch Spalten und extrahiert Immobiliendaten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Phase: Idle - Show upload zone */}
          {phase === 'idle' && (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer
                  ${isDragOver 
                    ? 'border-primary bg-primary/5 scale-[1.01]' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
                  }
                `}
              >
                <Upload className={`h-10 w-10 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-center">
                  <p className="text-sm font-medium">Excel-Datei hier ablegen</p>
                  <p className="text-xs text-muted-foreground">oder klicken zum Auswählen (.xlsx, .xls)</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={downloadTemplate} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Vorlage herunterladen
                </Button>
              </div>
            </>
          )}

          {/* Phase: Uploading/Analyzing */}
          {(phase === 'uploading' || phase === 'analyzing') && (
            <div className="space-y-4">
              {selectedFile && <FilePreview file={selectedFile} />}
              
              <div className="flex items-center justify-center gap-3 p-6 bg-muted/50 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div>
                  <p className="font-medium">
                    {phase === 'uploading' ? 'Datei wird hochgeladen...' : 'KI analysiert Ihre Daten...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {phase === 'analyzing' && 'Spalten werden erkannt und Daten extrahiert'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Phase: Preview */}
          {phase === 'preview' && (
            <div className="space-y-4">
              {selectedFile && <FilePreview file={selectedFile} onRemove={resetImport} />}

              {/* Summary */}
              {aiSummary && (
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="text-sm">
                    {aiSummary.totalRows} Zeilen erkannt
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    {aiSummary.uniqueProperties} Objekte
                  </Badge>
                  <Badge className="bg-green-600 text-sm">
                    Ø Konfidenz: {Math.round(aiSummary.avgConfidence * 100)}%
                  </Badge>
                  {aiSummary.issues?.length > 0 && (
                    <Badge variant="destructive" className="text-sm">
                      {aiSummary.issues.length} Hinweise
                    </Badge>
                  )}
                </div>
              )}

              {/* Preview Table */}
              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Konfidenz</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Art</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Ort</TableHead>
                      <TableHead className="text-right">qm</TableHead>
                      <TableHead className="text-right">Miete</TableHead>
                      <TableHead>Mieter</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedRows.map((row, idx) => (
                      <TableRow key={idx} className={row.confidence < 0.7 ? 'bg-yellow-500/5' : ''}>
                        <TableCell>{getConfidenceBadge(row.confidence)}</TableCell>
                        <TableCell className="font-mono text-xs">{row.code || '–'}</TableCell>
                        <TableCell>{row.art || '–'}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.adresse || '–'}</TableCell>
                        <TableCell>{row.ort || '–'}</TableCell>
                        <TableCell className="text-right">{row.qm?.toFixed(0) || '–'}</TableCell>
                        <TableCell className="text-right">{row.kaltmiete ? `${row.kaltmiete.toFixed(0)} €` : '–'}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{row.mieter || '–'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetImport}>
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
                <Button onClick={importExtractedData} disabled={extractedRows.length === 0}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {extractedRows.length} Zeilen importieren
                </Button>
              </div>
            </div>
          )}

          {/* Phase: Importing */}
          {phase === 'importing' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">Importiere Daten...</span>
              </div>
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{importProgress}% abgeschlossen</p>
            </div>
          )}

          {/* Phase: Done */}
          {phase === 'done' && (
            <div className="flex items-center justify-center gap-3 p-6 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-700">Import erfolgreich abgeschlossen!</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isProcessing}
          />
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
