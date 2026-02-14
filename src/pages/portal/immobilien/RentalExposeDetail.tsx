/**
 * RentalExposeDetail — Stub redirect
 * Legacy MSV rental expose routes redirect to Verwaltung.
 */
import { Navigate } from 'react-router-dom';

const RentalExposeDetail = () => {
  return <Navigate to="/portal/immobilien/verwaltung" replace />;
};

export default RentalExposeDetail;
