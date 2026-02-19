/**
 * CreatePropertyRedirect — Redirect to Portfolio with create modal trigger
 * 
 * P0 Stabilization: This component MUST NOT depend on lazy-loading or Suspense.
 * It renders a visible loading state while redirecting to prevent infinite loaders.
 * 
 * Route: /portal/immobilien/neu
 * Redirects to: /portal/immobilien/portfolio?create=1
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { useLegalConsent } from '@/hooks/useLegalConsent';

export function CreatePropertyRedirect() {
  const navigate = useNavigate();
  const { requireConsent, isLoading } = useLegalConsent();
  
  useEffect(() => {
    if (isLoading) return;
    if (!requireConsent()) {
      navigate('/portal/immobilien/portfolio', { replace: true });
      return;
    }
    navigate('/portal/immobilien/portfolio?create=1', { replace: true });
  }, [navigate, isLoading, requireConsent]);
  
  // Always render visible fallback - never null or empty
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <Building2 className="h-12 w-12 text-muted-foreground/50" />
        <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">Immobilie anlegen...</p>
    </div>
  );
}

export default CreatePropertyRedirect;
