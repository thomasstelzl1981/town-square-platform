/**
 * Hook: CRUD for compliance_documents + compliance_document_versions
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataEventLedger } from '@/hooks/useDataEventLedger';
import { toast } from 'sonner';

export interface ComplianceDocument {
  id: string;
  doc_key: string;
  doc_type: string;
  scope: string;
  brand: string | null;
  locale: string;
  title: string;
  description: string | null;
  status: string;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  status: string;
  content_md: string;
  change_note: string | null;
  created_at: string;
  created_by: string | null;
  activated_at: string | null;
}

export function useComplianceDocuments(scope?: string) {
  const qc = useQueryClient();
  const { logEvent } = useDataEventLedger();

  const docs = useQuery({
    queryKey: ['compliance-documents', scope],
    queryFn: async () => {
      let q = supabase.from('compliance_documents' as any).select('*').order('doc_key');
      if (scope) q = q.eq('scope', scope);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as ComplianceDocument[];
    },
  });

  const createVersion = useMutation({
    mutationFn: async ({ documentId, contentMd, changeNote }: { documentId: string; contentMd: string; changeNote?: string }) => {
      // Get current version
      const doc = docs.data?.find(d => d.id === documentId);
      const nextVersion = (doc?.current_version || 0) + 1;

      const { error } = await supabase.from('compliance_document_versions' as any).insert({
        document_id: documentId,
        version: nextVersion,
        content_md: contentMd,
        change_note: changeNote || null,
        status: 'draft',
      } as any);
      if (error) throw error;

      // Update current_version
      await supabase.from('compliance_documents' as any).update({ current_version: nextVersion, updated_at: new Date().toISOString() } as any).eq('id', documentId);

      logEvent({ zone: 'Z1', eventType: 'legal.document.version_created', direction: 'mutate', source: 'admin',
        payload: { doc_key: doc?.doc_key, version: nextVersion, change_note: changeNote } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-documents'] });
      qc.invalidateQueries({ queryKey: ['compliance-doc-versions'] });
      toast.success('Version erstellt');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  const activateVersion = useMutation({
    mutationFn: async ({ documentId, versionId, version }: { documentId: string; versionId: string; version: number }) => {
      // Deprecate all previous active versions
      await supabase.from('compliance_document_versions' as any).update({ status: 'deprecated' } as any).eq('document_id', documentId).eq('status', 'active');
      // Activate this version
      await supabase.from('compliance_document_versions' as any).update({ status: 'active', activated_at: new Date().toISOString() } as any).eq('id', versionId);
      // Update document status
      await supabase.from('compliance_documents' as any).update({ status: 'active', updated_at: new Date().toISOString() } as any).eq('id', documentId);

      const doc = docs.data?.find(d => d.id === documentId);
      logEvent({ zone: 'Z1', eventType: 'legal.document.activated', direction: 'mutate', source: 'admin',
        payload: { doc_key: doc?.doc_key, version } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-documents'] });
      qc.invalidateQueries({ queryKey: ['compliance-doc-versions'] });
      toast.success('Version aktiviert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return { documents: docs.data || [], isLoading: docs.isLoading, createVersion, activateVersion };
}

export function useDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: ['compliance-doc-versions', documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_document_versions' as any)
        .select('*')
        .eq('document_id', documentId!)
        .order('version', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DocumentVersion[];
    },
  });
}
