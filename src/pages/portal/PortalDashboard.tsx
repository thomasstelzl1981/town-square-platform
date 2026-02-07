import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid } from 'lucide-react';

export default function PortalDashboard() {
  const { activeOrganization, profile, isDevelopmentMode } = useAuth();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase">
          Willkommen{profile?.display_name ? `, ${profile.display_name}` : ''}
        </h1>
        {isDevelopmentMode && (
          <p className="text-xs text-amber-600 mt-1">
            Entwicklungsmodus aktiv
          </p>
        )}
      </div>

      {/* Leerer Dashboard-Bereich */}
      <Card className="p-12 text-center border-dashed">
        <CardContent className="pt-6">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Dashboard</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Wählen Sie ein Modul aus dem Menü links, um zu beginnen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
