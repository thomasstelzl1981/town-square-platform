/**
 * Immobilien Page (MOD-04) - SSOT for Properties, Units, Leases
 * 
 * OPTIMIZED: Direct imports for sub-tabs (parent is already lazy-loaded)
 * ErrorBoundary retained for error handling.
 * 
 * Routes:
 * - /portal/immobilien → How It Works landing
 * - /portal/immobilien/portfolio → Portfolio Dashboard + List
 * - /portal/immobilien/neu → Create Property (shows visible UI)
 * - /portal/immobilien/kontexte → Context Management
 * - /portal/immobilien/sanierung → Renovation (global)
 * - /portal/immobilien/bewertung → Valuation (global)
 * - /portal/immobilien/:id → Canonical Dossier (Immobilienakte)
 */
import React, { Component, ReactNode, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';


// Direct imports for instant sub-tab navigation
import { CreatePropertyRedirect } from './immobilien/CreatePropertyRedirect';
import { PortfolioTab } from './immobilien/PortfolioTab';
import { KontexteTab } from './immobilien/KontexteTab';
import { SanierungTab } from './immobilien/SanierungTab';
import { BewertungTab } from './immobilien/BewertungTab';

// Property detail page (Immobilienakte SSOT) - lazy for dynamic ID routes
const PropertyDetailPage = lazy(() => import('./immobilien/PropertyDetailPage'));

// =============================================================================
// ERROR BOUNDARY — Prevents blank page on component errors
// =============================================================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ImmobilienErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ImmobilienPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Fehler beim Laden</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Seite neu laden
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ImmobilienPage = () => {
  return (
    <ImmobilienErrorBoundary>
      <Routes>
        {/* CREATE: Direct import for immediate feedback */}
        <Route path="neu" element={<CreatePropertyRedirect />} />
        
        {/* PRIMARY: Redirect to portfolio */}
        <Route index element={<Navigate to="portfolio" replace />} />
        <Route path="portfolio" element={<PortfolioTab />} />
        
        {/* SECONDARY: Context management */}
        <Route path="kontexte" element={<KontexteTab />} />
        <Route path="sanierung" element={<SanierungTab />} />
        <Route path="bewertung" element={<BewertungTab />} />
        
        {/* CANONICAL: Property dossier (Immobilienakte) - :id must be LAST, guarded by GoldenPathGuard */}
        <Route path=":id" element={
          <GoldenPathGuard moduleCode="MOD-04" entityIdParam="id">
            <Suspense fallback={null}>
              <PropertyDetailPage />
            </Suspense>
          </GoldenPathGuard>
        } />
        
        {/* Fallback for any unmatched paths */}
        <Route path="*" element={<Navigate to="/portal/immobilien" replace />} />
      </Routes>
    </ImmobilienErrorBoundary>
  );
};

export default ImmobilienPage;
