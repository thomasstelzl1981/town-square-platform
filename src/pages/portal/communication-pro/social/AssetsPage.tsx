/**
 * Social Assets — Foto & Medien Library
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload } from 'lucide-react';

export function AssetsPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Assets</h1>
        <p className="text-muted-foreground mt-1">
          Lade bis zu 20 Fotos hoch und tagge sie — Business, Casual, Outdoor, Speaking.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Keine Fotos hochgeladen</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Portraits und Situationsbilder helfen der KI, passende Visuals für deine Posts vorzuschlagen.
            </p>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Fotos hochladen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
