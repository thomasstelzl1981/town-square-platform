import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, FileText, FolderOpen, Clock, Loader2 } from 'lucide-react';

// Lazy load tab components
const SelbstauskunftTab = React.lazy(() => import('./finanzierung/SelbstauskunftTab'));
const DokumenteTab = React.lazy(() => import('./finanzierung/DokumenteTab'));
const AnfrageTab = React.lazy(() => import('./finanzierung/AnfrageTab'));
const AnfrageDetailPage = React.lazy(() => import('./finanzierung/AnfrageDetailPage'));
const StatusTab = React.lazy(() => import('./finanzierung/StatusTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const FinanzierungPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/dokumente')) return 'dokumente';
    if (path.includes('/anfrage')) return 'anfrage';
    if (path.includes('/status')) return 'status';
    return 'selbstauskunft';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'selbstauskunft':
        navigate('/portal/finanzierung/selbstauskunft');
        break;
      case 'dokumente':
        navigate('/portal/finanzierung/dokumente');
        break;
      case 'anfrage':
        navigate('/portal/finanzierung/anfrage');
        break;
      case 'status':
        navigate('/portal/finanzierung/status');
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Finanzierung</h1>
        <p className="text-muted-foreground">
          Erstellen Sie Ihre Selbstauskunft und beantragen Sie Finanzierungen
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="selbstauskunft" className="gap-2">
            <User className="h-4 w-4" />
            Selbstauskunft
          </TabsTrigger>
          <TabsTrigger value="dokumente" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="anfrage" className="gap-2">
            <FileText className="h-4 w-4" />
            Anfrage
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
          <Route index element={<Navigate to="selbstauskunft" replace />} />
          <Route path="selbstauskunft" element={<SelbstauskunftTab />} />
          <Route path="dokumente" element={<DokumenteTab />} />
          <Route path="anfrage" element={<AnfrageTab />} />
          <Route path="anfrage/:requestId" element={<AnfrageDetailPage />} />
          <Route path="status" element={<StatusTab />} />
          
          {/* Legacy redirects */}
          <Route path="vorgaenge" element={<Navigate to="/portal/finanzierung/anfrage" replace />} />
          <Route path="readiness" element={<Navigate to="/portal/finanzierung/selbstauskunft" replace />} />
          <Route path="export" element={<Navigate to="/portal/finanzierung/anfrage" replace />} />
          <Route path="partner" element={<Navigate to="/portal/finanzierung/status" replace />} />
        </Routes>
      </React.Suspense>
    </div>
  );
};

export default FinanzierungPage;
