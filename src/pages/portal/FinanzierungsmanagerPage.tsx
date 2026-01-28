import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, User, Send, Clock, Loader2, 
  CheckCircle2, Building2, AlertCircle 
} from 'lucide-react';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';

// Lazy load tab components
const HowItWorksTab = React.lazy(() => import('./finanzierungsmanager/HowItWorksTab'));
const CaseDetailTab = React.lazy(() => import('./finanzierungsmanager/CaseDetailTab'));
const SubmitToBankTab = React.lazy(() => import('./finanzierungsmanager/SubmitToBankTab'));
const StatusTab = React.lazy(() => import('./finanzierungsmanager/StatusTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const FinanzierungsmanagerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cases, isLoading } = useFutureRoomCases();

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/selbstauskunft')) return 'selbstauskunft';
    if (path.includes('/einreichen')) return 'einreichen';
    if (path.includes('/status')) return 'status';
    return 'how-it-works';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'how-it-works':
        navigate('/portal/finanzierungsmanager');
        break;
      case 'selbstauskunft':
        navigate('/portal/finanzierungsmanager/selbstauskunft');
        break;
      case 'einreichen':
        navigate('/portal/finanzierungsmanager/einreichen');
        break;
      case 'status':
        navigate('/portal/finanzierungsmanager/status');
        break;
    }
  };

  const activeCases = cases?.filter(c => c.status !== 'closed').length || 0;
  const readyToSubmit = cases?.filter(c => c.status === 'ready_to_submit').length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finanzierungsmanager</h1>
          <p className="text-muted-foreground">
            Bearbeiten und reichen Sie Finanzierungsanfragen bei Banken ein
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            {activeCases} aktive Fälle
          </Badge>
          {readyToSubmit > 0 && (
            <Badge variant="default" className="gap-1 bg-green-500">
              <CheckCircle2 className="h-3 w-3" />
              {readyToSubmit} bereit
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="how-it-works" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            So funktioniert's
          </TabsTrigger>
          <TabsTrigger value="selbstauskunft" className="gap-2">
            <User className="h-4 w-4" />
            Selbstauskunft
          </TabsTrigger>
          <TabsTrigger value="einreichen" className="gap-2">
            <Send className="h-4 w-4" />
            Einreichen
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2">
            <Clock className="h-4 w-4" />
            Status
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Route Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<HowItWorksTab />} />
          <Route path="selbstauskunft" element={<CaseDetailTab cases={cases || []} isLoading={isLoading} />} />
          <Route path="selbstauskunft/:caseId" element={<CaseDetailTab cases={cases || []} isLoading={isLoading} />} />
          <Route path="einreichen" element={<SubmitToBankTab cases={cases || []} isLoading={isLoading} />} />
          <Route path="einreichen/:caseId" element={<SubmitToBankTab cases={cases || []} isLoading={isLoading} />} />
          <Route path="status" element={<StatusTab cases={cases || []} isLoading={isLoading} />} />
        </Routes>
      </React.Suspense>
    </div>
  );
};

export default FinanzierungsmanagerPage;
