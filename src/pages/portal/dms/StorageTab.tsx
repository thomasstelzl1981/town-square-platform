import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable, FileUploader, DetailDrawer, EmptyState, type Column } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, File, Plus, Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Document {
  id: string;
  public_id: string;
  name: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by: string | null;
}

export function StorageTab() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string>('');

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!activeTenantId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Get signed upload URL from Edge Function
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('sot-dms-upload-url', {
        body: {
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          folder: currentFolder || undefined,
        },
      });

      if (response.error) throw response.error;
      const { upload_url } = response.data;

      // 2. Upload file directly to storage using signed URL
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokument hochgeladen');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Upload fehlgeschlagen');
    },
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await supabase.functions.invoke('sot-dms-download-url', {
        body: { document_id: documentId },
      });

      if (response.error) throw response.error;
      
      // Open download URL in new tab
      window.open(response.data.download_url, '_blank');
      return response.data;
    },
    onError: (error) => {
      console.error('Download error:', error);
      toast.error('Download fehlgeschlagen');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokument gelöscht');
      setIsDrawerOpen(false);
      setSelectedDocument(null);
    },
    onError: () => {
      toast.error('Löschen fehlgeschlagen');
    },
  });

  const handleFileSelect = (files: File[]) => {
    files.forEach(file => uploadMutation.mutate(file));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const columns: Column<Document>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (_, doc) => (
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{doc.name}</span>
        </div>
      ),
    },
    {
      key: 'mime_type',
      header: 'Typ',
      render: (_, doc) => (
        <span className="text-muted-foreground text-sm">
          {doc.mime_type.split('/')[1]?.toUpperCase() || doc.mime_type}
        </span>
      ),
    },
    {
      key: 'size_bytes',
      header: 'Größe',
      render: (_, doc) => formatFileSize(doc.size_bytes),
    },
    {
      key: 'created_at',
      header: 'Hochgeladen',
      render: (_, doc) => formatDistanceToNow(new Date(doc.created_at), { 
        addSuffix: true, 
        locale: de 
      }),
    },
    {
      key: 'actions',
      header: '',
      render: (_, doc) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              downloadMutation.mutate(doc.id);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDocument(doc);
              setIsDrawerOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-16rem)]">
      {/* Left: Folder Tree */}
      <div className="col-span-3 border rounded-lg bg-card">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-medium text-sm">Ordner</span>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-3rem)]">
          <div className="p-2">
            <button
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent ${
                currentFolder === '' ? 'bg-accent' : ''
              }`}
              onClick={() => setCurrentFolder('')}
            >
              <Folder className="h-4 w-4 text-primary" />
              <span>Alle Dokumente</span>
            </button>
          </div>
        </ScrollArea>
      </div>

      {/* Center: Document List */}
      <div className="col-span-9 border rounded-lg bg-card flex flex-col">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Dokumente suchen..." 
              className="max-w-xs h-8"
            />
            <div className="flex-1" />
            <FileUploader
              onFilesSelected={handleFileSelect}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              maxSize={10 * 1024 * 1024}
              className="w-auto"
            >
              <Button size="sm" disabled={uploadMutation.isPending}>
                <Plus className="h-4 w-4 mr-1" />
                Hochladen
              </Button>
            </FileUploader>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {documents.length === 0 ? (
            <EmptyState
              icon={File}
              title="Keine Dokumente"
              description="Laden Sie Ihr erstes Dokument hoch"
            />
          ) : (
            <DataTable
              data={documents}
              columns={columns}
              isLoading={isLoading}
              onRowClick={(doc) => {
                setSelectedDocument(doc);
                setIsDrawerOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Right: Detail Drawer */}
      <DetailDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={selectedDocument?.name || 'Dokument'}
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Dateiname</label>
              <p className="font-medium">{selectedDocument.name}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Typ</label>
              <p>{selectedDocument.mime_type}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Größe</label>
              <p>{formatFileSize(selectedDocument.size_bytes)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Hochgeladen</label>
              <p>{new Date(selectedDocument.created_at).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">ID</label>
              <p className="font-mono text-xs">{selectedDocument.public_id}</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => downloadMutation.mutate(selectedDocument.id)}
                disabled={downloadMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteMutation.mutate(selectedDocument.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
