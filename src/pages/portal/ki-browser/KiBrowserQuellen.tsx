import { Link2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const KiBrowserQuellen = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quellen & Belege</h1>
          <p className="text-muted-foreground mt-1">
            Automatisch generierte Zitatliste mit URL, Timestamp und Screenshot-Hash.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            PDF Export
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Markdown
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Zitatliste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keine Quellen vorhanden. Führen Sie eine Browser-Session durch, um Quellen zu sammeln.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KiBrowserQuellen;
