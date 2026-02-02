/**
 * Admin Stub Page for routes not yet implemented
 */

import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function AdminStubPage() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const section = pathSegments[1] || 'Bereich';
  const subSection = pathSegments[2];

  const formatName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">
            {formatName(section)}
            {subSection && ` / ${formatName(subSection)}`}
          </CardTitle>
          <Badge variant="secondary" className="w-fit mx-auto mt-2">
            In Vorbereitung
          </Badge>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Diese Admin-Funktion wird derzeit entwickelt.
          </p>
          <Button variant="outline" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminStubPage;
