import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, FileText, Building2, Upload, Send, 
  CheckCircle2, Clock, AlertTriangle, Loader2, 
  User, FolderOpen
} from 'lucide-react';
import { useFinanceRequest, useSubmitFinanceRequest } from '@/hooks/useFinanceRequest';
import { SelbstauskunftForm } from './SelbstauskunftForm';
import { ObjectSelector } from './ObjectSelector';
import { DocumentUploadSection } from './DocumentUploadSection';
import { toast } from 'sonner';
import type { FinanceRequestStatus } from '@/types/finance';

const statusConfig: Record<FinanceRequestStatus, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-muted text-muted-foreground' },
  collecting: { label: 'Dokumente sammeln', color: 'bg-yellow-500/10 text-yellow-600' },
  ready: { label: 'Bereit zur Einreichung', color: 'bg-green-500/10 text-green-600' },
  submitted: { label: 'Eingereicht', color: 'bg-primary/10 text-primary' },
};

export function FinanceRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading, refetch } = useFinanceRequest(id);
  const submitRequest = useSubmitFinanceRequest();
  const [activeTab, setActiveTab] = React.useState('selbstauskunft');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/portal/finanzierung/faelle')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <div className="mt-8 text-center text-muted-foreground">
          Antrag nicht gefunden
        </div>
      </div>
    );
  }

  const primaryProfile = request.applicant_profiles?.find((p: any) => p.party_role === 'primary');
  const status = statusConfig[request.status as FinanceRequestStatus] || statusConfig.draft;
  const completionScore = primaryProfile?.completion_score || 0;
  const canSubmit = completionScore >= 80 && request.status === 'draft';

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Bitte füllen Sie mindestens 80% der Selbstauskunft aus.');
      return;
    }
    await submitRequest.mutateAsync(request.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/finanzierung/faelle')}>
          <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{request.public_id || 'Neuer Antrag'}</h1>
              <Badge className={status.color}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {primaryProfile?.first_name && primaryProfile?.last_name
                ? `${primaryProfile.first_name} ${primaryProfile.last_name}`
                : 'Antragsteller nicht angegeben'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="w-40 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Vollständigkeit</span>
              <span className="font-medium">{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-2" />
          </div>

          {/* Submit Button */}
          {request.status !== 'submitted' && (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitRequest.isPending}
            >
              {submitRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Einreichen
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="selbstauskunft" className="gap-2">
            <User className="h-4 w-4" />
            Selbstauskunft
          </TabsTrigger>
          <TabsTrigger value="objekt" className="gap-2">
            <Building2 className="h-4 w-4" />
            Objekt
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2">
            <Clock className="h-4 w-4" />
            Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selbstauskunft" className="mt-6">
          {primaryProfile ? (
            <SelbstauskunftForm 
              profile={primaryProfile as any} 
              onSave={() => refetch()}
              readOnly={request.status === 'submitted'}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Kein Antragstellerprofil gefunden.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="objekt" className="mt-6">
          <ObjectSelector
            request={request as any}
            onUpdate={() => refetch()}
            readOnly={request.status === 'submitted'}
          />
        </TabsContent>

        <TabsContent value="dokumente" className="mt-6">
          <DocumentUploadSection
            requestId={request.id}
            storageFolderId={request.storage_folder_id}
            readOnly={request.status === 'submitted'}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Antragsstatus</CardTitle>
              <CardDescription>Verfolgen Sie den Fortschritt Ihres Antrags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Timeline */}
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${request.status !== 'draft' ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Antrag erstellt</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>

                <div className="ml-5 h-8 w-0.5 bg-border" />

                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${completionScore >= 80 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Selbstauskunft</p>
                    <p className="text-sm text-muted-foreground">
                      {completionScore}% ausgefüllt
                    </p>
                  </div>
                  {completionScore >= 80 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>

                <div className="ml-5 h-8 w-0.5 bg-border" />

                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${request.status === 'submitted' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Eingereicht</p>
                    <p className="text-sm text-muted-foreground">
                      {request.submitted_at 
                        ? new Date(request.submitted_at).toLocaleDateString('de-DE')
                        : 'Noch nicht eingereicht'}
                    </p>
                  </div>
                  {request.status === 'submitted' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
