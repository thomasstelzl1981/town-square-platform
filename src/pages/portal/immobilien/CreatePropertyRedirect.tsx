/**
 * CreatePropertyRedirect — Redirect to Portfolio with create modal trigger
 * 
 * This is a minimal redirect component that navigates to the portfolio page
 * and triggers the create dialog via URL parameter.
 * 
 * Route: /portal/immobilien/neu
 * Redirects to: /portal/immobilien/portfolio?create=1
 * 
 * The actual creation happens via the CreatePropertyDialog modal in PortfolioTab.
 */
import { Navigate } from 'react-router-dom';

export function CreatePropertyRedirect() {
  // Immediate redirect using Navigate component - no effect hook needed
  return <Navigate to="/portal/immobilien/portfolio?create=1" replace />;
}

export default CreatePropertyRedirect;
