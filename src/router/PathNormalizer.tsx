/**
 * PathNormalizer — Canonical lowercase path enforcement
 * 
 * Ensures all URLs are normalized to lowercase to prevent
 * route mismatches caused by mixed-case user input.
 * 
 * Examples:
 * - /Admin/FutureRoom → /admin/futureroom
 * - /Portal/Immobilien → /portal/immobilien
 * 
 * Preserves query string and hash.
 */
import { Navigate, useLocation } from 'react-router-dom';

export function PathNormalizer({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Check if path contains uppercase characters
  const hasUppercase = /[A-Z]/.test(location.pathname);
  
  if (hasUppercase) {
    // Redirect to lowercase version, preserving search and hash
    const normalizedPath = location.pathname.toLowerCase();
    const fullPath = `${normalizedPath}${location.search}${location.hash}`;
    
    return <Navigate to={fullPath} replace />;
  }
  
  return <>{children}</>;
}
