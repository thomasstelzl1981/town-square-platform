/**
 * Immobilien Page (MOD-04) - SSOT for Properties, Units, Leases
 * 
 * P0 Stabilization:
 * - /neu route is NON-LAZY to prevent infinite loader states
 * - ErrorBoundary wraps lazy components to prevent blank pages
 * 
 * Routes:
 * - /portal/immobilien → Redirect to /portfolio (via ManifestRouter)
 * - /portal/immobilien/portfolio → Portfolio Dashboard + List
 * - /portal/immobilien/neu → Create Property (NON-LAZY, shows visible UI)
 * - /portal/immobilien/kontexte → Context Management
 * - /portal/immobilien/sanierung → Renovation (global)
 * - /portal/immobilien/bewertung → Valuation (global)
 * - /portal/immobilien/:id → Canonical Dossier (Immobilienakte)
 */
import React, { Suspense, lazy, Component, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// NON-LAZY: Create redirect must always work without Suspense
import { CreatePropertyRedirect } from './immobilien/CreatePropertyRedirect';

// Lazy load other sub-page components
const PortfolioTab = lazy(() => import('./immobilien/PortfolioTab').then(m => ({ default: m.PortfolioTab })));
const KontexteTab = lazy(() => import('./immobilien/KontexteTab').then(m => ({ default: m.KontexteTab })));
const SanierungTab = lazy(() => import('./immobilien/SanierungTab').then(m => ({ default: m.SanierungTab })));
const BewertungTab = lazy(() => import('./immobilien/BewertungTab').then(m => ({ default: m.BewertungTab })));

// Property detail page (Immobilienakte SSOT) - now canonical location
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

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const ImmobilienPage = () => {
  return (
    <ImmobilienErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* CREATE: NON-LAZY - P0 requirement to prevent infinite loader */}
          <Route path="neu" element={<CreatePropertyRedirect />} />
          
          {/* PRIMARY: Portfolio (default tile) */}
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="portfolio" element={<PortfolioTab />} />
          
          {/* SECONDARY: Context management */}
          <Route path="kontexte" element={<KontexteTab />} />
          <Route path="sanierung" element={<SanierungTab />} />
          <Route path="bewertung" element={<BewertungTab />} />
          
          {/* CANONICAL: Property dossier (Immobilienakte) - :id must be LAST */}
          <Route path=":id" element={<PropertyDetailPage />} />
          
          {/* Fallback for any unmatched paths */}
          <Route path="*" element={<Navigate to="portfolio" replace />} />
        </Routes>
      </Suspense>
    </ImmobilienErrorBoundary>
  );
};

export default ImmobilienPage;
