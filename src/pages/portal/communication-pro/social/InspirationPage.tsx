/**
 * Social Inspiration — Quellen & Patterns
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus } from 'lucide-react';

export function InspirationPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ideen & Inspiration</h1>
          <p className="text-muted-foreground mt-1">
            Hinterlege bis zu 10 Profile als Ideengeber — Patterns werden extrahiert, nichts kopiert.
          </p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Keine Inspirationsquellen</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Füge Profile hinzu, deren Posting-Stil dich inspiriert. Die KI extrahiert Muster wie Hook-Typen und Strukturen.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Quelle hinzufügen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
