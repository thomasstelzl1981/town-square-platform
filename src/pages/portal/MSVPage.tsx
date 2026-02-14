/**
 * MSV Page — Legacy Redirect
 * 
 * MOD-05 ist jetzt der Website Builder.
 * Alle alten MSV-Routen leiten zu MOD-04 Verwaltung weiter.
 */
import { Navigate } from 'react-router-dom';

const MSVPage = () => {
  return <Navigate to="/portal/immobilien/verwaltung" replace />;
};

export default MSVPage;
