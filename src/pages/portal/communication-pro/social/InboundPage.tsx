/**
 * Social Inbound — Individual Content Studio
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, Upload } from 'lucide-react';

export function InboundPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Individual Content</h1>
        <p className="text-muted-foreground mt-1">
          Lade ein Foto hoch, sprich einen Moment ein — und die KI macht daraus professionelle Posts.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Inbox className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Kein Content eingereicht</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Halte einen Moment fest — per Foto, Sprache oder Text. Die KI erstellt daraus LinkedIn-, Instagram- und Facebook-Drafts.
            </p>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Moment festhalten
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
