/**
 * Social Content Creation — 3-Step Generator + Draft Editor
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, Sparkles } from 'lucide-react';

export function CreatePage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Content Creation</h1>
        <p className="text-muted-foreground mt-1">
          Erstelle LinkedIn Posts, Instagram Captions, Facebook Posts — in deinem Stil, KI-gestützt.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <PenTool className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Noch kein Entwurf</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Wähle ein Format, eine Grundlage und lass die KI hochwertige Drafts generieren — mit Copywriter-Tools zum Verfeinern.
            </p>
          </div>
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Entwurf erstellen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
