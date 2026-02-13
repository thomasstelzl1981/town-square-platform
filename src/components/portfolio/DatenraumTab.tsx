import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { StorageFileManager } from '@/components/dms/StorageFileManager';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';

interface DatenraumTabProps {
  propertyId: string;
  tenantId: string;
  propertyCode?: string;
}

export function DatenraumTab({ propertyId, tenantId, propertyCode }: DatenraumTabProps) {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Fetch folder structure
  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ['storage-nodes', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && !!tenantId,
  });

  // Fetch document links
  const { data: documentLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ['document-links', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_links')
        .select('id, document_id, node_id, object_type, object_id')
        .eq('object_id', propertyId)
        .eq('object_type', 'property')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && !!tenantId,
  });

  // Fetch all documents linked to this property
  const docIds = documentLinks.map(l => l.document_id).filter(Boolean);
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['property-documents', propertyId, docIds],
    queryFn: async () => {
      if (docIds.length === 0) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('id, public_id, name, file_path, mime_type, size_bytes, created_at, uploaded_by')
        .in('id', docIds);
      if (error) throw error;
      return data;
    },
    enabled: docIds.length > 0,
  });

  const { upload: universalUpload } = useUniversalUpload();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['storage-nodes', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['document-links', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] });
  }, [queryClient, propertyId]);

  const handleUploadFiles = useCallback(async (files: File[]) => {
    if (!activeOrganization) return;
    setIsUploading(true);
    let successCount = 0;
    for (const file of files) {
      try {
        const result = await universalUpload(file, {
          moduleCode: 'MOD_04',
          entityId: propertyId,
          objectType: 'property',
          objectId: propertyId,
          parentNodeId: selectedNodeId || undefined,
          source: 'datenraum',
        });
        if (result.error) throw new Error(result.error);
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Fehler beim Upload von ${file.name}`);
      }
    }
    setIsUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} Datei(en) hochgeladen`);
      invalidate();
    }
  }, [activeOrganization, universalUpload, propertyId, selectedNodeId, invalidate]);

  const handleDownload = useCallback(async (documentId: string) => {
    setIsDownloading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-dms-download-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ document_id: documentId }),
        }
      );
      if (!response.ok) throw new Error('Download URL konnte nicht erstellt werden');
      const { download_url } = await response.json();
      window.open(download_url, '_blank');
    } catch {
      toast.error('Download fehlgeschlagen');
    }
    setIsDownloading(false);
  }, []);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('document_links').delete().eq('document_id', documentId).eq('object_id', propertyId);
      if (error) throw error;
      toast.success('Dokument entfernt');
      invalidate();
    } catch {
      toast.error('Fehler beim Löschen');
    }
    setIsDeleting(false);
  }, [propertyId, invalidate]);

  const handleDeleteFolder = useCallback(async (nodeId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('storage_nodes').delete().eq('id', nodeId);
      if (error) throw error;
      toast.success('Ordner gelöscht');
      invalidate();
    } catch {
      toast.error('Fehler beim Löschen');
    }
    setIsDeleting(false);
  }, [invalidate]);

  const handleCreateFolder = useCallback(async (name: string, parentId: string | null) => {
    setIsCreatingFolder(true);
    try {
      const { error } = await supabase.from('storage_nodes').insert({
        tenant_id: tenantId,
        property_id: propertyId,
        parent_id: parentId,
        name,
        node_type: 'folder',
        auto_created: false,
      });
      if (error) throw error;
      toast.success('Ordner erstellt');
      invalidate();
    } catch {
      toast.error('Fehler beim Erstellen');
    }
    setIsCreatingFolder(false);
  }, [tenantId, propertyId, invalidate]);

  const handleBulkDownload = useCallback(async (ids: Set<string>) => {
    for (const id of ids) {
      await handleDownload(id);
    }
  }, [handleDownload]);

  const handleBulkDelete = useCallback(async (ids: Set<string>) => {
    for (const id of ids) {
      await handleDeleteDocument(id);
    }
  }, [handleDeleteDocument]);

  if (nodesLoading || linksLoading || docsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <StorageFileManager
      nodes={nodes}
      documents={documents.filter(d => {
        const link = documentLinks.find(l => l.document_id === d.id);
        return selectedNodeId ? link?.node_id === selectedNodeId : true;
      })}
      allDocuments={documents}
      documentLinks={documentLinks}
      onUploadFiles={handleUploadFiles}
      onDownload={handleDownload}
      onDeleteDocument={handleDeleteDocument}
      onDeleteFolder={handleDeleteFolder}
      onCreateFolder={handleCreateFolder}
      onBulkDownload={handleBulkDownload}
      onBulkDelete={handleBulkDelete}
      isUploading={isUploading}
      isDownloading={isDownloading}
      isDeleting={isDeleting}
      isCreatingFolder={isCreatingFolder}
      selectedNodeId={selectedNodeId}
      onSelectNode={setSelectedNodeId}
    />
  );
}
