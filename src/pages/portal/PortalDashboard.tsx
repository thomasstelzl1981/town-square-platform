import React, { forwardRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid } from 'lucide-react';

// P1-FIX: Wrap with forwardRef to prevent console warnings
const PortalDashboard = forwardRef<HTMLDivElement>((_, ref) => {
  const { activeOrganization, profile, isDevelopmentMode } = useAuth();

  return (
    <div ref={ref} className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Willkommen{profile?.display_name ? `, ${profile.display_name}` : ''}
        </h1>
        <p className="text-muted-foreground">{activeOrganization?.name}</p>
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
});

PortalDashboard.displayName = 'PortalDashboard';

export default PortalDashboard;
