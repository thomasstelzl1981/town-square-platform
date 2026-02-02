/**
 * Generic stub page for modules that are not yet implemented.
 * Used to prevent 404 errors when navigating to new modules.
 */

import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function ModuleStubPage() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const moduleName = pathSegments[1] || 'Modul';
  const subPage = pathSegments[2];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">
            {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
            {subPage && ` / ${subPage.charAt(0).toUpperCase() + subPage.slice(1)}`}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto mt-2">
            In Vorbereitung
          </Badge>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Diese Funktion wird derzeit entwickelt und steht in Kürze zur Verfügung.
          </p>
          <Button variant="outline" asChild>
            <Link to="/portal">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ModuleStubPage;
