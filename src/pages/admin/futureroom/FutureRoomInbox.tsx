import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Inbox, Loader2, User, Building2, ArrowRight, 
  FileText, CheckCircle2, Clock, Users
} from 'lucide-react';
import { 
  useFinanceMandates, 
  useDelegateMandate, 
  useUpdateMandateStatus 
} from '@/hooks/useFinanceMandate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function FutureRoomInbox() {
  const { data: mandates, isLoading } = useFinanceMandates();
  const delegateMandate = useDelegateMandate();
  const updateStatus = useUpdateMandateStatus();
  
  const [selectedMandateId, setSelectedMandateId] = React.useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = React.useState<string>('');
  const [delegateOpen, setDelegateOpen] = React.useState(false);

  // Fetch available finance managers (users with finance_manager role)
  const { data: managers } = useQuery({
    queryKey: ['available-finance-managers'],
    queryFn: async () => {
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('role', 'finance_manager');

      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];

      const userIds = memberships.map(m => m.user_id);

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      if (profileError) throw profileError;
      return profiles || [];
    },
  });

  const handleDelegate = async () => {
    if (!selectedMandateId || !selectedManagerId) return;
    
    await delegateMandate.mutateAsync({
      mandateId: selectedMandateId,
      managerId: selectedManagerId,
    });
    
    setDelegateOpen(false);
    setSelectedMandateId(null);
    setSelectedManagerId('');
  };

  const handleTriage = async (mandateId: string) => {
    await updateStatus.mutateAsync({
      mandateId,
      status: 'triage',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">Neu</Badge>;
      case 'triage':
        return <Badge variant="secondary">In Prüfung</Badge>;
      case 'delegated':
        return <Badge variant="outline">Zugewiesen</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Angenommen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeMandates = mandates?.filter(m => 
    ['new', 'triage', 'delegated'].includes(m.status)
  ) || [];

  if (activeMandates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine offenen Mandate</h3>
          <p className="text-muted-foreground">
            Aktuell gibt es keine Finanzierungsanfragen zu bearbeiten.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Anfragen</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mandates?.filter(m => m.status === 'new').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Prüfung</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mandates?.filter(m => m.status === 'triage').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zugewiesen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mandates?.filter(m => m.status === 'delegated').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Fälle</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mandates?.filter(m => m.status === 'accepted').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mandate List */}
      <div className="space-y-3">
        {activeMandates.map((mandate) => {
          const request = mandate.finance_requests;
          const applicant = request?.applicant_profiles?.[0];
          const completionScore = applicant?.completion_score || 0;

          return (
            <Card key={mandate.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {applicant?.first_name && applicant?.last_name
                            ? `${applicant.first_name} ${applicant.last_name}`
                            : 'Name nicht angegeben'}
                        </span>
                        {getStatusBadge(mandate.status)}
                        <Badge variant="outline">
                          {completionScore}% vollständig
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{mandate.public_id || request?.public_id}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(mandate.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {applicant?.loan_amount_requested && (
                      <span className="font-medium">
                        {new Intl.NumberFormat('de-DE', { 
                          style: 'currency', 
                          currency: 'EUR', 
                          maximumFractionDigits: 0 
                        }).format(applicant.loan_amount_requested)}
                      </span>
                    )}
                    
                    {mandate.status === 'new' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleTriage(mandate.id)}
                      >
                        Prüfen
                      </Button>
                    )}
                    
                    {(mandate.status === 'new' || mandate.status === 'triage') && (
                      <Dialog open={delegateOpen && selectedMandateId === mandate.id} onOpenChange={(open) => {
                        setDelegateOpen(open);
                        if (open) setSelectedMandateId(mandate.id);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Zuweisen
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manager zuweisen</DialogTitle>
                            <DialogDescription>
                              Wählen Sie einen Finanzierungsmanager für dieses Mandat aus.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="py-4">
                            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Manager auswählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {managers?.map((manager) => (
                                  <SelectItem key={manager.id} value={manager.id}>
                                    {manager.display_name || manager.email || manager.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {(!managers || managers.length === 0) && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Keine Manager mit der Rolle "finance_manager" gefunden.
                              </p>
                            )}
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDelegateOpen(false)}>
                              Abbrechen
                            </Button>
                            <Button 
                              onClick={handleDelegate}
                              disabled={!selectedManagerId || delegateMandate.isPending}
                            >
                              {delegateMandate.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              Zuweisen
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
