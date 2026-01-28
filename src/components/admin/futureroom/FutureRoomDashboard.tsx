import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MandateInbox } from './MandateInbox';
import { BankContactsPanel } from './BankContactsPanel';
import { Inbox, Building2, Users, FileText, BarChart3 } from 'lucide-react';
import { useFinanceMandates, useFinanceBankContacts } from '@/hooks/useFinanceMandate';

export function FutureRoomDashboard() {
  const { data: mandates } = useFinanceMandates();
  const { data: banks } = useFinanceBankContacts();

  const stats = React.useMemo(() => {
    const newCount = mandates?.filter(m => m.status === 'new').length || 0;
    const triageCount = mandates?.filter(m => m.status === 'triage').length || 0;
    const delegatedCount = mandates?.filter(m => m.status === 'delegated').length || 0;
    const acceptedCount = mandates?.filter(m => m.status === 'accepted').length || 0;
    
    return { newCount, triageCount, delegatedCount, acceptedCount };
  }, [mandates]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Anfragen</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCount}</div>
            <p className="text-xs text-muted-foreground">Warten auf Prüfung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Prüfung</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.triageCount}</div>
            <p className="text-xs text-muted-foreground">Werden geprüft</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zugewiesen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delegatedCount}</div>
            <p className="text-xs text-muted-foreground">Warten auf Annahme</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Fälle</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedCount}</div>
            <p className="text-xs text-muted-foreground">Bei Managern</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Mandate-Eingang
          </TabsTrigger>
          <TabsTrigger value="banks" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bankkontakte ({banks?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <MandateInbox />
        </TabsContent>

        <TabsContent value="banks" className="mt-6">
          <BankContactsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
