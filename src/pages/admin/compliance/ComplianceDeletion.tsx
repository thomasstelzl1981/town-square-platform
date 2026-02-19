/**
 * Tab: Deletion Requests — Löschanträge Art. 17 DSGVO
 * Vollständiges Case-Management mit Inbox, Detail, Intake und Response Generator.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { useDeletionRequests } from './useComplianceCases';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeletionCaseList } from './deletion/DeletionCaseList';
import { DeletionCaseDetail } from './deletion/DeletionCaseDetail';
import { DeletionIntakeForm } from './deletion/DeletionIntakeForm';

export function ComplianceDeletion() {
  const { requests, isLoading, updateStatus, createRequest } = useDeletionRequests();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showIntake, setShowIntake] = useState(false);

  const { data: companyProfile } = useQuery({
    queryKey: ['compliance-company-profile', 'sot'],
    queryFn: async () => {
      const { data } = await supabase
        .from('compliance_company_profile' as any)
        .select('*')
        .eq('slug', 'sot')
        .maybeSingle();
      return data;
    },
  });

  const selectedRequest = requests.find(r => r.id === selectedId);

  const handleUpdate = (id: string, updates: Record<string, any>) => {
    updateStatus.mutate({ id, ...updates });
  };

  const handleCreate = (data: { requester_email: string; requester_name?: string; request_channel: string; request_received_at: string }) => {
    const receivedAt = new Date(data.request_received_at);
    const dueDate = new Date(receivedAt);
    dueDate.setDate(dueDate.getDate() + 30);

    createRequest.mutate({
      requester_email: data.requester_email,
      requester_name: data.requester_name || null,
      request_channel: data.request_channel,
      request_received_at: receivedAt.toISOString(),
      due_date: dueDate.toISOString().split('T')[0],
    }, {
      onSuccess: () => setShowIntake(false),
    });
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Löschanträge (Art. 17 DSGVO)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showIntake && (
            <DeletionIntakeForm
              onSubmit={handleCreate}
              onCancel={() => setShowIntake(false)}
              isPending={createRequest.isPending}
            />
          )}

          <DeletionCaseList
            requests={requests}
            selectedId={selectedId}
            onSelect={id => setSelectedId(selectedId === id ? null : id)}
            onNewRequest={() => setShowIntake(true)}
          />

          {selectedRequest && (
            <DeletionCaseDetail
              request={selectedRequest}
              companyProfile={companyProfile}
              onUpdate={handleUpdate}
              onClose={() => setSelectedId(null)}
              isPending={updateStatus.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
