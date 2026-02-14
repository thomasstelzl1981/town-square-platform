/**
 * Pets — Fotoalbum Tab (Platzhalter)
 * Foto-Galerie pro Tier
 */
import { Camera } from 'lucide-react';

export default function PetsFotoalbum() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Camera className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Fotoalbum</h2>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <Camera className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Fotoalbum</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Sammeln Sie hier die schönsten Momente Ihrer Tiere.
        </p>
      </div>
    </div>
  );
}
