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
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function CreatePropertyRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to portfolio with create trigger
    navigate('/portal/immobilien/portfolio?create=1', { replace: true });
  }, [navigate]);

  return null;
}

export default CreatePropertyRedirect;
