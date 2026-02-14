/**
 * MOD-11 Finanzierungsmanager — Landing Page Tab
 * Nutzt den Landing Page Builder Standard mit Profil 'finance_broker'
 */
import { Globe } from 'lucide-react';

export default function FMLandingPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Globe className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Landing Page</h2>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <Globe className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Ihre Finanzberater-Landing Page</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Erstellen Sie eine professionelle Landing Page für Ihre Finanzberatung.
          Profil: Finanzierungsberater · Rechner-Widget · KI-Inhaltsgenerierung
        </p>
      </div>
    </div>
  );
}
