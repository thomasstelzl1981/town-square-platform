/**
 * MOD-07: Finance Documents Manager
 * Two-panel layout: DMS Tree + Interactive Checklist with Upload
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, FolderOpen, Bell, BellOff } from 'lucide-react';
import { FinanceStorageTree } from './FinanceStorageTree';
import { DocumentChecklistPanel } from './DocumentChecklistPanel';
import { DocumentReminderToggle } from './DocumentReminderToggle';
import { FinanceUploadZone } from './FinanceUploadZone';
import { MOD04DocumentPicker } from './MOD04DocumentPicker';

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

export function FinanceDocumentsManager() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [showMOD04Picker, setShowMOD04Picker] = useState(false);

  // Fetch persistent applicant profile
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

  // Fetch active finance request (draft or submitted)
  const { data: activeRequest } = useQuery({
    queryKey: ['active-finance-request', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data } = await supabase
        .from('finance_requests')
        .select('id, public_id, property_id, object_address, status, storage_folder_id')
        .eq('tenant_id', activeTenantId)
        .in('status', ['draft', 'submitted', 'assigned', 'in_review'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!activeTenantId,
  });

  // Fetch checklist items
  const { data: checklistItems, isLoading: loadingChecklist } = useQuery({
    queryKey: ['document-checklist-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_checklist_items')
        .select('*')
        .order('sort_index', { ascending: true });
      return (data || []) as ChecklistItem[];
    },
  });

  // Fetch uploaded documents (applicant profile)
  const { data: profileDocs } = useQuery({
    queryKey: ['applicant-profile-documents', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !activeTenantId) return [];
      const { data } = await supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          document:documents(id, name, doc_type)
        `)
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

  // Fetch uploaded documents (active request)
  const { data: requestDocs } = useQuery({
    queryKey: ['finance-request-documents', activeRequest?.id],
    queryFn: async () => {
      if (!activeRequest?.id || !activeTenantId) return [];
      const { data } = await supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          document:documents(id, name, doc_type)
        `)
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

  // Filter checklist by employment type
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

  // Calculate completion stats
  const allDocs = [...(profileDocs || []), ...(requestDocs || [])];
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

  const handleUploadClick = (docType: string, checklistType: 'applicant' | 'request') => {
    setSelectedDocType(docType);
    // TODO: Auto-select the correct folder node based on category
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['applicant-profile-documents'] });
    queryClient.invalidateQueries({ queryKey: ['finance-request-documents'] });
    setSelectedDocType(null);
  };

  if (loadingChecklist) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status Header */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-primary" />
              Dokumentenstatus
            </CardTitle>
            <DocumentReminderToggle requestId={activeRequest?.id} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Gesamtfortschritt</span>
              <span className="text-muted-foreground">
                {totalUploaded} von {totalRequired} Pflichtdokumenten
              </span>
            </div>
            <Progress value={completionPercent} className="h-2" />
            <div className="flex gap-2 pt-2">
              <Badge variant={uploadedApplicantCount === requiredApplicant.length ? 'default' : 'outline'}>
                Bonität: {uploadedApplicantCount}/{requiredApplicant.length}
              </Badge>
              {activeRequest && (
                <Badge variant={uploadedRequestCount === requiredRequest.length ? 'default' : 'outline'}>
                  Objekt: {uploadedRequestCount}/{requiredRequest.length}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: Storage Tree */}
        <div className="space-y-4">
          <FinanceStorageTree
            profileId={profile?.id}
            requestId={activeRequest?.id}
            requestLabel={activeRequest?.object_address || activeRequest?.public_id}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {/* Right: Checklist + Upload */}
        <div className="space-y-6">
          {/* Applicant Checklist */}
          <DocumentChecklistPanel
            title="Bonitätsunterlagen"
            subtitle="Permanent gespeichert für alle Anfragen"
            items={applicantChecklist}
            uploadedDocs={profileDocs || []}
            onUploadClick={(docType) => handleUploadClick(docType, 'applicant')}
            employmentType={employmentType}
          />

          {/* Request Checklist (if active) */}
          {activeRequest && (
            <DocumentChecklistPanel
              title="Objektunterlagen"
              subtitle={`Für Anfrage: ${activeRequest.object_address || activeRequest.public_id}`}
              items={requestChecklist}
              uploadedDocs={requestDocs || []}
              onUploadClick={(docType) => handleUploadClick(docType, 'request')}
              showMOD04Import={!!activeRequest.property_id}
              onMOD04Import={() => setShowMOD04Picker(true)}
            />
          )}

          {/* Upload Zone */}
          <FinanceUploadZone
            profileId={profile?.id}
            requestId={activeRequest?.id}
            selectedDocType={selectedDocType}
            onComplete={handleUploadComplete}
          />
        </div>
      </div>

      {/* MOD-04 Document Picker Dialog */}
      {showMOD04Picker && activeRequest?.property_id && (
        <MOD04DocumentPicker
          propertyId={activeRequest.property_id}
          requestId={activeRequest.id}
          open={showMOD04Picker}
          onOpenChange={setShowMOD04Picker}
          onComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}

export default FinanceDocumentsManager;
