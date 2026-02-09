/**
 * Social Performance — Light Tracking + KI Analysis
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus } from 'lucide-react';

export function PerformancePage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-muted-foreground mt-1">
          Erfasse Kennzahlen pro Post und erhalte KI-Analysen zu Themen, Hooks und Timing.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Keine Kennzahlen</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Trage nach dem Posten Impressions, Likes und Kommentare ein — die KI analysiert, was funktioniert hat.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Kennzahlen erfassen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
