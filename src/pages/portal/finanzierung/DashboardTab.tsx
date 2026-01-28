import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, FileText, TrendingUp, Clock, CheckCircle2, 
  Send, Users, ArrowRight 
} from 'lucide-react';
import { useFinanceRequests, useCreateFinanceRequest } from '@/hooks/useFinanceRequest';
import { Loader2 } from 'lucide-react';

export default function DashboardTab() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = useFinanceRequests();
  const createRequest = useCreateFinanceRequest();

  const handleCreate = async () => {
    const result = await createRequest.mutateAsync({});
    if (result?.id) {
      navigate(`/portal/finanzierung/faelle/${result.id}`);
    }
  };

  // Calculate stats
  const stats = {
    total: requests?.length || 0,
    draft: requests?.filter(r => r.status === 'draft').length || 0,
    submitted: requests?.filter(r => r.status === 'submitted').length || 0,
    ready: requests?.filter(r => r.status === 'ready').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Finanzierungsanträge</span>
            <Button onClick={handleCreate} disabled={createRequest.isPending}>
              {createRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Neue Finanzierung
            </Button>
          </CardTitle>
          <CardDescription>
            Erstellen und verwalten Sie Ihre Finanzierungsanträge
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entwürfe</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bereit</p>
                <p className="text-2xl font-bold">{stats.ready}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eingereicht</p>
                <p className="text-2xl font-bold">{stats.submitted}</p>
              </div>
              <Send className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      {requests && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letzte Anträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => {
                const primaryApplicant = request.applicant_profiles?.find(
                  (p: any) => p.party_role === 'primary'
                );
                
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/portal/finanzierung/faelle/${request.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{request.public_id || 'Neuer Antrag'}</p>
                        <p className="text-sm text-muted-foreground">
                          {primaryApplicant?.first_name && primaryApplicant?.last_name
                            ? `${primaryApplicant.first_name} ${primaryApplicant.last_name}`
                            : 'Antragsteller ausfüllen'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={request.status === 'submitted' ? 'default' : 'secondary'}>
                        {request.status === 'draft' && 'Entwurf'}
                        {request.status === 'collecting' && 'Sammeln'}
                        {request.status === 'ready' && 'Bereit'}
                        {request.status === 'submitted' && 'Eingereicht'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {requests.length > 5 && (
              <Button
                variant="ghost"
                className="w-full mt-3"
                onClick={() => navigate('/portal/finanzierung/faelle')}
              >
                Alle {requests.length} Anträge anzeigen
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!requests || requests.length === 0) && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Finanzierungsanträge</h3>
            <p className="text-muted-foreground mb-6">
              Erstellen Sie Ihren ersten Finanzierungsantrag, um Dokumente zu sammeln und einzureichen.
            </p>
            <Button onClick={handleCreate} disabled={createRequest.isPending}>
              {createRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Neue Finanzierung
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
