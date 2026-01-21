import { useLocation, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';

export default function ModulePlaceholder() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const moduleName = pathParts[1] || 'Modul';
  const subPage = pathParts[2] || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      <div className="mb-6">
        <Link to="/portal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </Link>
      </div>

      <Card className="p-12 text-center max-w-lg mx-auto">
        <Construction className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold capitalize mb-2">
          {moduleName}{subPage ? ` / ${subPage}` : ''}
        </h1>
        <p className="text-muted-foreground mb-6">
          Dieses Modul wird in einer zukünftigen Version implementiert.
        </p>
        <div className="text-sm text-muted-foreground">
          <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
        </div>
      </Card>
    </div>
  );
}
