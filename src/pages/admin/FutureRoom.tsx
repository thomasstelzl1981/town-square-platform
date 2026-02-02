import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Inbox, Building2, Users, Loader2 } from 'lucide-react';
import { useFinanceMandates, useFinanceBankContacts } from '@/hooks/useFinanceMandate';

// Lazy load sub-pages
const FutureRoomInbox = React.lazy(() => import('./futureroom/FutureRoomInbox'));
const FutureRoomBanks = React.lazy(() => import('./futureroom/FutureRoomBanks'));
const FutureRoomManagers = React.lazy(() => import('./futureroom/FutureRoomManagers'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export default function FutureRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: mandates } = useFinanceMandates();
  const { data: banks } = useFinanceBankContacts();

  const newMandates = mandates?.filter(m => m.status === 'new').length || 0;

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/bankkontakte')) return 'bankkontakte';
    if (path.includes('/finanzierungsmanager')) return 'finanzierungsmanager';
    return 'inbox';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'inbox':
        navigate('/admin/futureroom');
        break;
      case 'bankkontakte':
        navigate('/admin/futureroom/bankkontakte');
        break;
      case 'finanzierungsmanager':
        navigate('/admin/futureroom/finanzierungsmanager');
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Future Room</h1>
          <p className="text-muted-foreground">
            Finanzierungsmandate verwalten und an Manager delegieren
          </p>
        </div>
        {newMandates > 0 && (
          <Badge variant="destructive" className="text-sm">
            {newMandates} neue Anfragen
          </Badge>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Mandate-Eingang
            {newMandates > 0 && (
              <Badge variant="secondary" className="ml-1">{newMandates}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bankkontakte" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bankkontakte
            <Badge variant="outline" className="ml-1">{banks?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="finanzierungsmanager" className="gap-2">
            <Users className="h-4 w-4" />
            Manager
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Route Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<FutureRoomInbox />} />
          <Route path="bankkontakte" element={<FutureRoomBanks />} />
          <Route path="finanzierungsmanager" element={<FutureRoomManagers />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}
