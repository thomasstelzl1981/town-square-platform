/**
 * ProjektLandingLayout — Minimal layout for public project landing pages
 * No portal header, no auth required
 */
import { Outlet } from 'react-router-dom';

export default function ProjektLandingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
