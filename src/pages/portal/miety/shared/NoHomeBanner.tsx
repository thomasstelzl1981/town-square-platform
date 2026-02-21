import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Plus } from 'lucide-react';

export function NoHomeBanner({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-3">
        <Home className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Objekt anlegen</p>
          <p className="text-xs text-muted-foreground">Legen Sie zuerst ein Objekt an, um Verträge zu speichern.</p>
        </div>
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-1" />Anlegen
        </Button>
      </CardContent>
    </Card>
  );
}
