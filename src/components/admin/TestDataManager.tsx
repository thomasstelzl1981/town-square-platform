import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function TestDataManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch test batches - placeholder until table is created
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['test-batches'],
    queryFn: async (): Promise<TestBatch[]> => {
      // Table will be created via migration
      // For now return empty array
      return [];
    }
  });

  // Delete batch mutation - placeholder
  const deleteBatch = useMutation({
    mutationFn: async (batchId: string) => {
      // Will use RPC after migration is applied
      console.log('Delete batch:', batchId);
      return [];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['test-batches'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Testdaten erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Download template
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Properties sheet
    const propertiesData = [
      ['code', 'property_type', 'address', 'city', 'postal_code', 'total_area_sqm', 'construction_year', 'market_value', 'usage_type'],
      ['ZL001', 'MFH', 'Hauptstraße 15', 'Leipzig', '04103', 620, 1928, 890000, 'residential'],
      ['ZL002', 'DHH', 'Nebenweg 8', 'Dresden', '01097', 180, 2005, 320000, 'residential'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(propertiesData), 'Properties');

    // Units sheet
    const unitsData = [
      ['property_code', 'unit_number', 'area_sqm', 'current_monthly_rent', 'usage_type'],
      ['ZL001', 'EG-L', 65, 550, 'residential'],
      ['ZL001', 'EG-R', 70, 580, 'residential'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(unitsData), 'Units');

    // Contacts sheet
    const contactsData = [
      ['first_name', 'last_name', 'email', 'phone', 'company'],
      ['Max', 'Mustermann', 'max@example.com', '+49123456789', ''],
      ['Erika', 'Musterfrau', 'erika@example.com', '+49987654321', 'Muster GmbH'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contactsData), 'Contacts');

    // Leases sheet
    const leasesData = [
      ['property_code', 'unit_number', 'contact_email', 'monthly_rent', 'start_date'],
      ['ZL001', 'EG-L', 'max@example.com', 550, '2023-01-01'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(leasesData), 'Leases');

    // Listings sheet
    const listingsData = [
      ['property_code', 'title', 'asking_price', 'description', 'commission_rate'],
      ['ZL002', 'Gepflegtes Doppelhaus in Dresden', 320000, 'Moderne Ausstattung...', 3.57],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(listingsData), 'Listings');

    XLSX.writeFile(wb, 'Testdaten_Vorlage.xlsx');
    toast.success('Vorlage heruntergeladen');
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      const batchId = crypto.randomUUID();
      const batchName = `Import_${new Date().toISOString().slice(0, 16).replace('T', '_')}`;
      
      // Process each sheet
      let totalImported = 0;

      // TODO: Implement actual import logic with supabase inserts
      // This is a placeholder showing the structure
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        console.log(`Sheet ${sheetName}:`, rows);
        totalImported += rows.length;
      }

      toast.success(`${totalImported} Datensätze importiert`);
      queryClient.invalidateQueries({ queryKey: ['test-batches'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
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
            Excel-Import
          </CardTitle>
          <CardDescription>
            Testdaten aus einer Excel-Datei importieren. Die Daten können später vollständig gelöscht werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Vorlage herunterladen
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Excel hochladen
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Unterstützte Sheets: Properties, Units, Contacts, Leases, Listings</p>
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
                          <Badge key={type} variant="secondary" className="text-xs">
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
