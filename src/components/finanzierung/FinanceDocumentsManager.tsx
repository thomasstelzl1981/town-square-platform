/**
 * MOD-07: Finance Documents Manager
 * Aligned with MOD-11 / DMS StorageFileManager look.
 * Status header (progress bar) + StorageFileManager filtered to MOD_07 subtree.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { StorageFileManager } from '@/components/dms/StorageFileManager';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { toast } from 'sonner';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';

export interface ChecklistItem {
  id: string;
  checklist_type: 'applicant' | 'request';
  category: string;
  doc_type: string;
  label: string;
  is_required: boolean;
  for_employment_type: 'employed' | 'self_employed' | null;
  sort_index: number;
}

export interface UploadedDoc {
  id: string;
  document_id: string;
  doc_type: string | null;
  name: string;
}

interface StorageNode {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  node_type: string;
  template_id: string | null;
  scope_hint: string | null;
  property_id: string | null;
  unit_id: string | null;
  module_code: string | null;
  created_at: string;
}

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

interface DocumentLink {
  id: string;
  document_id: string;
  node_id: string | null;
  object_type: string | null;
  object_id: string | null;
}

export function FinanceDocumentsManager() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ── Storage nodes (full tree, filtered to MOD_07 subtree) ──
  const { data: allNodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ['storage-nodes', activeTenantId],
    queryFn: async (): Promise<StorageNode[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as StorageNode[];
    },
    enabled: !!activeTenantId,
  });

  // Find MOD_07 root and filter subtree
  const mod07Root = useMemo(() => allNodes.find(n => n.module_code === 'MOD_07' && !n.parent_id), [allNodes]);

  // Collect all descendant node IDs under MOD_07 root
  const mod07NodeIds = useMemo(() => {
    if (!mod07Root) return new Set<string>();
    const ids = new Set<string>([mod07Root.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of allNodes) {
        if (n.parent_id && ids.has(n.parent_id) && !ids.has(n.id)) {
          ids.add(n.id);
          changed = true;
        }
      }
    }
    return ids;
  }, [allNodes, mod07Root]);

  const filteredNodes = useMemo(() => {
    if (!mod07Root) return [];
    // Return MOD_07 children as top-level (re-parent to null so StorageFileManager shows them as roots)
    return allNodes
      .filter(n => mod07NodeIds.has(n.id))
      .map(n => n.id === mod07Root.id ? { ...n, parent_id: null } : n);
  }, [allNodes, mod07NodeIds, mod07Root]);

  // ── Documents + Links ──
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['all-documents', activeTenantId],
    queryFn: async (): Promise<Document[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('id, public_id, name, file_path, mime_type, size_bytes, created_at, uploaded_by')
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return (data || []) as unknown as Document[];
    },
    enabled: !!activeTenantId,
  });

  const { data: documentLinks = [] } = useQuery({
    queryKey: ['document-links', activeTenantId],
    queryFn: async (): Promise<DocumentLink[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('document_links')
        .select('id, document_id, node_id, object_type, object_id')
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return (data || []) as unknown as DocumentLink[];
    },
    enabled: !!activeTenantId,
  });

  // Documents in current folder
  const currentDocuments = useMemo(() => {
    if (!selectedNodeId) return [];
    const docIds = documentLinks.filter(l => l.node_id === selectedNodeId).map(l => l.document_id);
    return allDocuments.filter(d => docIds.includes(d.id));
  }, [selectedNodeId, documentLinks, allDocuments]);

  // ── Upload ──
  const { uploadMultiple, isUploading } = useUniversalUpload();

  const handleUploadFiles = async (files: File[]) => {
    if (!activeTenantId || !selectedNodeId) {
      toast.error('Bitte zuerst einen Ordner auswählen');
      return;
    }
    await uploadMultiple(files, {
      moduleCode: 'MOD_07',
      parentNodeId: selectedNodeId,
    });
    queryClient.invalidateQueries({ queryKey: ['all-documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-links'] });
  };

  // ── Download ──
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownload = async (documentId: string) => {
    const doc = allDocuments.find(d => d.id === documentId);
    if (!doc) return;
    setIsDownloading(true);
    try {
      const { data, error } = await supabase.storage.from('tenant-documents').download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download fehlgeschlagen');
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Delete ──
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const doc = allDocuments.find(d => d.id === documentId);
      if (!doc) return;
      await supabase.from('document_links').delete().eq('document_id', documentId);
      await supabase.from('documents').delete().eq('id', documentId);
      if (doc.file_path) {
        await supabase.storage.from('tenant-documents').remove([doc.file_path]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-links'] });
      toast.success('Dokument gelöscht');
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (nodeId: string) => {
      await supabase.from('storage_nodes').delete().eq('id', nodeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-nodes'] });
      toast.success('Ordner gelöscht');
    },
  });

  const createFolder = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId: string | null }) => {
      if (!activeTenantId) return;
      await supabase.from('storage_nodes').insert({
        tenant_id: activeTenantId,
        parent_id: parentId,
        name,
        node_type: 'folder',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-nodes'] });
      toast.success('Ordner erstellt');
    },
  });

  // ── Checklist status (kept as overview) ──
  const { data: profile } = useQuery({
    queryKey: ['persistent-applicant-profile', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data } = await supabase
        .from('applicant_profiles')
        .select('id, employment_type')
        .eq('tenant_id', activeTenantId)
        .is('finance_request_id', null)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!activeTenantId,
  });

  const { data: activeRequest } = useQuery({
    queryKey: ['active-finance-request', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data } = await supabase
        .from('finance_requests')
        .select('id, public_id, property_id, object_address, status')
        .eq('tenant_id', activeTenantId)
        .in('status', ['draft', 'submitted', 'assigned', 'in_review'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!activeTenantId,
  });

  const { data: checklistItems } = useQuery({
    queryKey: ['document-checklist-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_checklist_items')
        .select('*')
        .order('sort_index', { ascending: true });
      return (data || []) as ChecklistItem[];
    },
  });

  const { data: profileDocs } = useQuery({
    queryKey: ['applicant-profile-documents', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !activeTenantId) return [];
      const { data } = await supabase
        .from('document_links')
        .select('id, document_id, document:documents(id, name, doc_type)')
        .eq('tenant_id', activeTenantId)
        .eq('object_type', 'applicant_profile')
        .eq('object_id', profile.id);
      return (data || []).map(d => ({
        id: d.id,
        document_id: d.document_id,
        doc_type: d.document?.doc_type || null,
        name: d.document?.name || '',
      })) as UploadedDoc[];
    },
    enabled: !!profile?.id && !!activeTenantId,
  });

  const { data: requestDocs } = useQuery({
    queryKey: ['finance-request-documents', activeRequest?.id],
    queryFn: async () => {
      if (!activeRequest?.id || !activeTenantId) return [];
      const { data } = await supabase
        .from('document_links')
        .select('id, document_id, document:documents(id, name, doc_type)')
        .eq('tenant_id', activeTenantId)
        .eq('object_type', 'finance_request')
        .eq('object_id', activeRequest.id);
      return (data || []).map(d => ({
        id: d.id,
        document_id: d.document_id,
        doc_type: d.document?.doc_type || null,
        name: d.document?.name || '',
      })) as UploadedDoc[];
    },
    enabled: !!activeRequest?.id && !!activeTenantId,
  });

  // Completion stats
  const employmentType = profile?.employment_type || 'employed';
  const applicantChecklist = useMemo(() => {
    if (!checklistItems) return [];
    return checklistItems.filter(item =>
      item.checklist_type === 'applicant' &&
      (item.for_employment_type === null || item.for_employment_type === employmentType)
    );
  }, [checklistItems, employmentType]);

  const requestChecklist = useMemo(() => {
    if (!checklistItems) return [];
    return checklistItems.filter(item => item.checklist_type === 'request');
  }, [checklistItems]);

  const requiredApplicant = applicantChecklist.filter(i => i.is_required);
  const requiredRequest = requestChecklist.filter(i => i.is_required);
  const uploadedApplicantCount = requiredApplicant.filter(item =>
    (profileDocs || []).some(d => d.doc_type === item.doc_type)
  ).length;
  const uploadedRequestCount = requiredRequest.filter(item =>
    (requestDocs || []).some(d => d.doc_type === item.doc_type)
  ).length;
  const totalRequired = requiredApplicant.length + (activeRequest ? requiredRequest.length : 0);
  const totalUploaded = uploadedApplicantCount + uploadedRequestCount;
  const completionPercent = totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;

  if (nodesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModulePageHeader title="Dokumente" description="Bonitäts- und Objektunterlagen" />

      {/* StorageFileManager — same look as DMS/MOD-11 */}
      <StorageFileManager
        nodes={filteredNodes}
        documents={currentDocuments}
        allDocuments={allDocuments}
        documentLinks={documentLinks}
        onUploadFiles={handleUploadFiles}
        onDownload={handleDownload}
        onDeleteDocument={(id) => deleteMutation.mutate(id)}
        onDeleteFolder={(id) => deleteFolder.mutate(id)}
        onCreateFolder={(name, parentId) => createFolder.mutate({ name, parentId })}
        onBulkDownload={(ids) => ids.forEach(id => handleDownload(id))}
        onBulkDelete={(ids) => ids.forEach(id => deleteMutation.mutate(id))}
        isUploading={isUploading}
        isDownloading={isDownloading}
        isDeleting={deleteMutation.isPending}
        isCreatingFolder={createFolder.isPending}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />
    </div>
  );
}

export default FinanceDocumentsManager;
