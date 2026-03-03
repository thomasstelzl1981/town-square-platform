/**
 * Pets — Meine Tiere Tab
 * RecordCard-Grid mit universeller PetDossier-Tierakte (shared component)
 */
import { useState } from 'react';
import { PawPrint, Plus, Dog, Cat, Bird, Rabbit } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { PetDossier } from '@/components/shared/pet-dossier';
import { RECORD_CARD } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePets, useCreatePet } from '@/hooks/usePets';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';

const SPECIES_ICONS: Record<string, typeof PawPrint> = { dog: Dog, cat: Cat, bird: Bird, rabbit: Rabbit };

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', rabbit: 'Kaninchen',
  hamster: 'Hamster', fish: 'Fisch', reptile: 'Reptil', horse: 'Pferd', other: 'Sonstiges',
};

function getAge(birthDate: string | null): string {
  if (!birthDate) return '';
  const bd = parseISO(birthDate);
  const years = differenceInYears(new Date(), bd);
  if (years >= 1) return `${years} ${years === 1 ? 'Jahr' : 'Jahre'}`;
  const months = differenceInMonths(new Date(), bd);
  return `${months} ${months === 1 ? 'Monat' : 'Monate'}`;
}

export default function PetsMeineTiere() {
  const { data: allPets = [], isLoading } = usePets();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PETS');
  const pets = demoEnabled ? allPets : allPets.filter(p => !isDemoId(p.id));
  const createPet = useCreatePet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openPetId, setOpenPetId] = useState<string | null>(null);
  const [newPet, setNewPet] = useState({ name: '', species: 'dog' as string, breed: '' });

  const handleCreate = async () => {
    if (!newPet.name.trim()) return;
    await createPet.mutateAsync({ name: newPet.name, species: newPet.species as any, breed: newPet.breed || null });
    setNewPet({ name: '', species: 'dog', breed: '' });
    setDialogOpen(false);
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Meine Tiere"
        description="Verwalte deine Haustiere"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="glass" size="icon-round"><Plus className="h-5 w-5" /></Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Neues Tier anlegen</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name *</Label>
                <Input value={newPet.name} onChange={e => setNewPet(p => ({ ...p, name: e.target.value }))} placeholder="z.B. Luna" />
              </div>
              <div>
                <Label>Tierart</Label>
                <Select value={newPet.species} onValueChange={v => setNewPet(p => ({ ...p, species: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SPECIES_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rasse</Label>
                <Input value={newPet.breed} onChange={e => setNewPet(p => ({ ...p, breed: e.target.value }))} placeholder="z.B. Golden Retriever" />
              </div>
              <Button onClick={handleCreate} disabled={createPet.isPending || !newPet.name.trim()} className="w-full">Anlegen</Button>
            </div>
          </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden…</div>
      ) : pets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium text-muted-foreground">Noch keine Tiere angelegt</h3>
          <p className="mt-2 text-sm text-muted-foreground/70">Klicken Sie auf „Tier anlegen" um Ihr erstes Haustier zu registrieren.</p>
        </div>
      ) : (
        <>
          {/* Block 1: Alle Karten — IMMER geschlossen */}
          <div className={RECORD_CARD.GRID}>
            {pets.map((pet) => {
              const age = getAge(pet.birth_date);
              const summaryItems = [
                ...(pet.breed ? [{ label: '', value: `${SPECIES_LABELS[pet.species] || pet.species} · ${pet.breed}` }] : [{ label: '', value: SPECIES_LABELS[pet.species] || pet.species }]),
                ...(age ? [{ label: '', value: age }] : []),
                ...(pet.weight_kg ? [{ label: '', value: `${pet.weight_kg} kg` }] : []),
                ...(pet.chip_number ? [{ label: '', value: `Chip: ${pet.chip_number}` }] : []),
              ];
              const isDemo = isDemoId(pet.id);
              return (
                <RecordCard
                  key={pet.id}
                  id={pet.id}
                  entityType="pet"
                  isOpen={false}
                  onToggle={() => setOpenPetId(prev => prev === pet.id ? null : pet.id)}
                  thumbnailUrl={pet.photo_url || undefined}
                  title={pet.name}
                  subtitle={SPECIES_LABELS[pet.species] || pet.species}
                  summary={summaryItems}
                  glowVariant={isDemo ? 'emerald' : (openPetId === pet.id ? 'teal' : undefined)}
                  badges={isDemo ? [{ label: 'DEMO', variant: 'outline' as const }] : undefined}
                >
                  {null}
                </RecordCard>
              );
            })}
          </div>

          {/* Block 2: Universelle PetDossier-Tierakte */}
          {openPetId && (
            <div className="rounded-xl border border-teal-500/20 bg-card p-4">
              <PetDossier
                key={openPetId}
                petId={openPetId}
                context="z2-client"
                readOnly={false}
                showOwner={false}
              />
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}