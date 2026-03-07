/**
 * Pets — Meine Tiere Tab
 * RecordCard-Grid mit universeller PetDossier-Tierakte (shared component)
 * AES-Standard: Inline Card statt Dialog für Neuanlage
 */
import { useState, useCallback } from 'react';
import { PawPrint, Plus, Dog, Cat, Bird, Rabbit, X } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { RecordCard } from '@/components/shared/RecordCard';
import { PetDossier } from '@/components/shared/pet-dossier';
import { RECORD_CARD } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePets, useCreatePet } from '@/hooks/usePets';
import { useRecordCardDMS } from '@/hooks/useRecordCardDMS';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';

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
  const { activeTenantId } = useAuth();
  const demoEnabled = isEnabled('GP-PETS');
  const pets = demoEnabled ? allPets : allPets.filter(p => !isDemoId(p.id));
  const createPet = useCreatePet();
  const { createDMS } = useRecordCardDMS();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [openPetId, setOpenPetId] = useState<string | null>(null);
  const [newPet, setNewPet] = useState({ name: '', species: 'dog' as string, breed: '' });

  const handleCreate = async () => {
    if (!newPet.name.trim()) return;
    const pet = await createPet.mutateAsync({ name: newPet.name, species: newPet.species as any, breed: newPet.breed || null });
    // DAT: Create DMS folder + Sort-Container via standard hook
    if (pet && activeTenantId) {
      createDMS.mutate({
        entityType: 'pet',
        entityId: pet.id,
        entityName: pet.name,
        tenantId: activeTenantId,
        keywords: [pet.name, pet.breed, pet.chip_number].filter(Boolean) as string[],
      });
    }
    setNewPet({ name: '', species: 'dog', breed: '' });
    setShowNew(false);
  };

  const handleCancel = () => {
    setNewPet({ name: '', species: 'dog', breed: '' });
    setShowNew(false);
  };

  /** Upload photo directly from RecordCard drag-and-drop — SSOT via tenant-documents */
  const handlePhotoDrop = useCallback(async (petId: string, tenantId: string, file: File) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${tenantId}/MOD_22/${petId}/profile.${ext}`;
    try {
      const { error: upErr } = await supabase.storage
        .from('tenant-documents')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = await supabase.storage.from('tenant-documents').createSignedUrl(path, 3600);
      const photoUrl = data?.signedUrl || '';

      const { error: dbErr } = await supabase
        .from('pets')
        .update({ photo_url: photoUrl } as Record<string, unknown>)
        .eq('id', petId);
      if (dbErr) throw dbErr;

      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast.success('Foto aktualisiert');
    } catch (err) {
      console.error('handlePhotoDrop error:', err);
      toast.error('Foto-Upload fehlgeschlagen');
    }
  }, [queryClient]);

  return (
    <PageShell>
      <ModulePageHeader
        title="Meine Tiere"
        description="Verwalte deine Haustiere"
        actions={
          <Button
            variant="glass"
            size="icon-round"
            onClick={() => { setShowNew(true); setOpenPetId(null); }}
            disabled={showNew}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden…</div>
      ) : pets.length === 0 && !showNew ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
          <PawPrint className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium text-muted-foreground">Noch keine Tiere angelegt</h3>
          <p className="mt-2 text-sm text-muted-foreground/70">Klicken Sie auf „+" um Ihr erstes Haustier zu registrieren.</p>
        </div>
      ) : (
        <>
          {/* Block 1: Alle Karten — IMMER geschlossen */}
          {pets.length > 0 && (
            <div className={RECORD_CARD.GRID}>
              {pets.map((pet) => {
                const age = getAge(pet.birth_date);
                const summaryItems = [
                  { label: '', value: SPECIES_LABELS[pet.species] || pet.species },
                  ...(pet.breed ? [{ label: '', value: pet.breed }] : []),
                  { label: '', value: age || 'Alter unbekannt' },
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
                    onPhotoDrop={(file) => handlePhotoDrop(pet.id, pet.tenant_id, file)}
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
          )}

          {/* Block 2: Universelle PetDossier-Tierakte (Inline-Detail) */}
          {openPetId && !showNew && (
            <div className="rounded-xl border border-border/40 bg-card p-4">
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

      {/* AES Inline Create Card — unterhalb des Grids */}
      {showNew && (
        <Card className="border-primary/30 bg-card shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Neues Tier anlegen</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newPet.name}
                  onChange={e => setNewPet(p => ({ ...p, name: e.target.value }))}
                  placeholder="z.B. Luna"
                  autoFocus
                />
              </div>
              <div>
                <Label>Tierart</Label>
                <Select value={newPet.species} onValueChange={v => setNewPet(p => ({ ...p, species: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIES_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rasse</Label>
                <Input
                  value={newPet.breed}
                  onChange={e => setNewPet(p => ({ ...p, breed: e.target.value }))}
                  placeholder="z.B. Golden Retriever"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCancel}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={createPet.isPending || !newPet.name.trim()}>
                Speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
