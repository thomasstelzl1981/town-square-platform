/**
 * Pets — Tierakte Detail Page (Platzhalter)
 * RecordCard-Akte für ein einzelnes Tier
 */
import { useParams } from 'react-router-dom';
import { PawPrint } from 'lucide-react';

export default function PetDetailPage() {
  const { petId } = useParams<{ petId: string }>();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <PawPrint className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Tierakte</h2>
        <span className="text-sm text-muted-foreground">ID: {petId}</span>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Tierakte — Platzhalter</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Vollständige Akte mit allen Datenfeldern (RecordCard-Pattern).
        </p>
      </div>
    </div>
  );
}
