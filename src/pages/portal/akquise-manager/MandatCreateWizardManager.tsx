import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function MandatCreateWizardManager() {
  const navigate = useNavigate();
  return (
    <PageShell>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/mandate')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Neues Mandat erstellen</h1>
          <p className="text-muted-foreground">Kontakt-First Workflow</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Schritt 1: Kontakt auswählen oder anlegen</CardTitle>
          <CardDescription>
            Wählen Sie einen bestehenden Kontakt aus MOD-02 oder legen Sie einen neuen an.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Der Kontakt-First Wizard wird in Phase 2 implementiert.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/akquise-manager/mandate')}>
            Zurück
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
