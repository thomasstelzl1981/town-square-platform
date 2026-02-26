/**
 * MOD-07: MOD-04 Document Picker
 * Dialog to import property documents from MOD-04 portfolio
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  FileText, Download, Loader2, CheckCircle2, 
  Building, FileImage, FileCheck 
} from 'lucide-react';
import { toast } from 'sonner';

interface MOD04DocumentPickerProps {
  propertyId: string;
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface PropertyDocument {
  id: string;
  document_id: string;
  doc_type: string | null;
  name: string;
  size_bytes: number | null;
}

// Doc types that are relevant for financing
const RELEVANT_DOC_TYPES = [
  'DOC_EXPOSE_BUY',
  'DOC_EXPOSE_RENT',
  'DOC_LAND_REGISTER',
  'DOC_ENERGY_CERT',
  'DOC_FLOORPLAN',
  'DOC_FLOOR_PLAN',
  'DOC_PURCHASE_CONTRACT',
  'DOC_PARTITION_DECL',
  'DOC_BUILDING_DESC',
  'DOC_SITE_PLAN',
  'DOC_PHOTOS',
];

const DOC_TYPE_LABELS: Record<string, string> = {
  DOC_EXPOSE_BUY: 'Exposé (Kauf)',
  DOC_EXPOSE_RENT: 'Exposé (Miete)',
  DOC_LAND_REGISTER: 'Grundbuchauszug',
  DOC_ENERGY_CERT: 'Energieausweis',
  DOC_FLOORPLAN: 'Grundriss',
  DOC_FLOOR_PLAN: 'Grundriss',
  DOC_PURCHASE_CONTRACT: 'Kaufvertrag',
  DOC_PARTITION_DECL: 'Teilungserklärung',
  DOC_BUILDING_DESC: 'Baubeschreibung',
  DOC_SITE_PLAN: 'Lageplan',
  DOC_PHOTOS: 'Fotos',
};

export function MOD04DocumentPicker({
  propertyId,
  requestId,
  open,
  onOpenChange,
  onComplete,
}: MOD04DocumentPickerProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Fetch property documents
  const { data: propertyDocs, isLoading } = useQuery({
    queryKey: ['property-documents-for-finance', propertyId],
    queryFn: async () => {
      if (!propertyId || !activeTenantId) return [];

      const { data } = await supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          document:documents(id, name, doc_type, size_bytes)
        `)
        .eq('tenant_id', activeTenantId)
        .eq('object_type', 'property')
        .eq('object_id', propertyId);

      return (data || [])
        .filter(d => d.document?.doc_type && RELEVANT_DOC_TYPES.includes(d.document.doc_type))
        .map(d => ({
          id: d.id,
          document_id: d.document_id,
          doc_type: d.document?.doc_type || null,
          name: d.document?.name || '',
          size_bytes: d.document?.size_bytes || null,
        })) as PropertyDocument[];
    },
    enabled: open && !!propertyId && !!activeTenantId,
  });

  // Import documents mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!activeTenantId || selectedDocs.size === 0) return;

      const docsToImport = propertyDocs?.filter(d => selectedDocs.has(d.id)) || [];
      
      // Create document_links for the finance request
      for (const doc of docsToImport) {
        const { error } = await supabase
          .from('document_links')
          .insert({
            tenant_id: activeTenantId,
            document_id: doc.document_id,
            object_type: 'finance_request',
            object_id: requestId,
            link_status: 'linked',
            source_link_id: doc.id, // Reference to original property link
          });

        if (error) {
          console.error('Failed to import document:', error);
          throw error;
        }
      }

      return docsToImport.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['finance-request-documents'] });
      toast.success(`${count} Dokument(e) verknüpft`);
      setSelectedDocs(new Set());
      onOpenChange(false);
      onComplete?.();
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast.error('Fehler beim Importieren der Dokumente');
    },
  });

  const toggleDoc = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const selectAll = () => {
    if (!propertyDocs) return;
    if (selectedDocs.size === propertyDocs.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(propertyDocs.map(d => d.id)));
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '–';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Dokumente aus Portfolio übernehmen
          </DialogTitle>
          <DialogDescription>
            Wählen Sie die Objektunterlagen aus, die Sie für die Finanzierungsanfrage verknüpfen möchten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : propertyDocs && propertyDocs.length > 0 ? (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="text-sm font-medium">
                  {propertyDocs.length} Dokument(e) verfügbar
                </Label>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selectedDocs.size === propertyDocs.length ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
              </div>

              {/* Document List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {propertyDocs.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDocs.has(doc.id) 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => toggleDoc(doc.id)}
                  >
                    <Checkbox
                      checked={selectedDocs.has(doc.id)}
                      onCheckedChange={() => toggleDoc(doc.id)}
                    />
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {DOC_TYPE_LABELS[doc.doc_type || ''] || doc.doc_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatSize(doc.size_bytes)}
                        </span>
                      </div>
                    </div>
                    {selectedDocs.has(doc.id) && (
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Keine relevanten Dokumente im Portfolio gefunden.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={selectedDocs.size === 0 || importMutation.isPending}
            className="gap-2"
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {selectedDocs.size} Dokument(e) verknüpfen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MOD04DocumentPicker;
