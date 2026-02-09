/**
 * Social Knowledge Base — Editorial Focus Topics
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

export function KnowledgePage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          Definiere bis zu 10 Themen, über die du Content erstellen möchtest. Die KI erstellt Briefings als Grundlage.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Keine Themen definiert</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Wähle deine Schwerpunktthemen aus und die KI generiert Hook-Muster, Argumentationslinien und CTAs.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Themen auswählen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
