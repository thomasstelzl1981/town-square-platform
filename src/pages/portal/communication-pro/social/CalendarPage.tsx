/**
 * Social Calendar — Planung & Manual Posted
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';

export function CalendarPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Kalender & Planung</h1>
        <p className="text-muted-foreground mt-1">
          Plane deine Drafts für die Woche und markiere sie als gepostet.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Nichts geplant</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Erstelle zuerst einen Entwurf und plane ihn dann hier für einen bestimmten Tag.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Entwurf planen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
