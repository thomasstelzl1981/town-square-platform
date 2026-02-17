/**
 * LennoxMeineTiere — Zone 3 Tier-Verwaltung (CRUD auf pet_z1_pets)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PawPrint, Plus, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const petSchema = z.object({
  name: z.string().trim().min(1, 'Name erforderlich').max(100),
  species: z.enum(['dog', 'cat', 'bird', 'small_animal', 'reptile', 'other']).default('dog'),
  breed: z.string().trim().max(100).optional(),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  birth_date: z.string().optional(),
  weight_kg: z.number().positive().max(500).optional().nullable(),
  chip_number: z.string().trim().max(50).optional(),
  neutered: z.boolean().default(false),
});

const speciesLabels: Record<string, string> = {
  dog: 'Hund', cat: 'Katze', bird: 'Vogel', small_animal: 'Kleintier', reptile: 'Reptil', other: 'Sonstiges',
};
const genderLabels: Record<string, string> = { male: 'Männlich', female: 'Weiblich', unknown: 'Unbekannt' };

type PetForm = z.infer<typeof petSchema>;
const emptyPet: PetForm = { name: '', species: 'dog', breed: '', gender: 'unknown', birth_date: '', weight_kg: null, chip_number: '', neutered: false };

export default function LennoxMeineTiere() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<PetForm>(emptyPet);
  const [saving, setSaving] = useState(false);

  const loadPets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/website/tierservice/login'); return; }

    const { data: customer } = await supabase
      .from('pet_z1_customers')
      .select('id, tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!customer) { setLoading(false); return; }
    setCustomerId(customer.id);
    setTenantId(customer.tenant_id);

    const { data: petData } = await supabase
      .from('pet_z1_pets' as any)
      .select('*')
      .eq('z1_customer_id', customer.id)
      .order('created_at', { ascending: true });

    setPets(petData || []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadPets(); }, [loadPets]);

  const handleSave = async () => {
    const parsed = petSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0]?.message); return; }
    if (!customerId || !tenantId) return;

    setSaving(true);
    const payload: any = {
      name: parsed.data.name,
      species: parsed.data.species,
      breed: parsed.data.breed || null,
      gender: parsed.data.gender,
      birth_date: parsed.data.birth_date || null,
      weight_kg: parsed.data.weight_kg || null,
      chip_number: parsed.data.chip_number || null,
      neutered: parsed.data.neutered,
    };

    if (editId) {
      const { error } = await (supabase.from('pet_z1_pets' as any) as any).update(payload).eq('id', editId);
      if (error) toast.error('Fehler beim Aktualisieren');
      else toast.success('Tier aktualisiert!');
    } else {
      payload.z1_customer_id = customerId;
      payload.tenant_id = tenantId;
      const { error } = await (supabase.from('pet_z1_pets' as any) as any).insert(payload);
      if (error) toast.error('Fehler beim Anlegen');
      else toast.success('Tier angelegt!');
    }
    setSaving(false);
    setEditId(null);
    setShowAdd(false);
    setForm(emptyPet);
    loadPets();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from('pet_z1_pets' as any) as any).delete().eq('id', id);
    if (error) toast.error('Fehler beim Löschen');
    else { toast.success('Tier entfernt'); loadPets(); }
  };

  const startEdit = (pet: any) => {
    setEditId(pet.id);
    setShowAdd(true);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      gender: pet.gender || 'unknown',
      birth_date: pet.birth_date || '',
      weight_kg: pet.weight_kg,
      chip_number: pet.chip_number || '',
      neutered: pet.neutered || false,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(25,85%,55%)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/website/tierservice/profil" className="inline-flex items-center gap-1 text-sm text-[hsl(25,15%,55%)] hover:text-[hsl(25,85%,55%)]">
        <ArrowLeft className="h-4 w-4" /> Zurück zum Profil
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[hsl(25,30%,15%)]">Meine Tiere</h1>
        {!showAdd && (
          <Button onClick={() => { setShowAdd(true); setEditId(null); setForm(emptyPet); }} className="rounded-full bg-[hsl(25,85%,55%)] hover:bg-[hsl(25,85%,48%)] text-white" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Tier hinzufügen
          </Button>
        )}
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <Card className="border-[hsl(25,85%,55%,0.3)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[hsl(25,30%,15%)]">{editId ? 'Tier bearbeiten' : 'Neues Tier'}</CardTitle>
              <button onClick={() => { setShowAdd(false); setEditId(null); setForm(emptyPet); }}>
                <X className="h-4 w-4 text-[hsl(25,15%,55%)]" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={100} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Tierart</label>
                <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value as any }))} className="w-full h-10 rounded-md border border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)] px-3 text-sm">
                  {Object.entries(speciesLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Rasse</label>
                <Input value={form.breed || ''} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={100} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Geschlecht</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))} className="w-full h-10 rounded-md border border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)] px-3 text-sm">
                  {Object.entries(genderLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Geburtsdatum</label>
                <Input type="date" value={form.birth_date || ''} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} className="border-[hsl(35,30%,85%)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Gewicht (kg)</label>
                <Input type="number" step="0.1" value={form.weight_kg ?? ''} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value ? parseFloat(e.target.value) : null }))} className="border-[hsl(35,30%,85%)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Chip-Nr.</label>
                <Input value={form.chip_number || ''} onChange={e => setForm(f => ({ ...f, chip_number: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={50} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[hsl(25,20%,35%)]">
              <input type="checkbox" checked={form.neutered} onChange={e => setForm(f => ({ ...f, neutered: e.target.checked }))} className="rounded" />
              Kastriert / Sterilisiert
            </label>
            <Button onClick={handleSave} disabled={saving} className="rounded-full bg-[hsl(25,85%,55%)] hover:bg-[hsl(25,85%,48%)] text-white">
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Speichern...' : editId ? 'Aktualisieren' : 'Anlegen'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pet list */}
      {pets.length === 0 && !showAdd ? (
        <Card className="border-dashed border-[hsl(35,30%,85%)]">
          <CardContent className="p-8 text-center">
            <PawPrint className="h-10 w-10 mx-auto text-[hsl(25,85%,55%,0.3)] mb-3" />
            <p className="text-sm text-[hsl(25,15%,55%)]">Du hast noch keine Tiere angelegt.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pets.map(pet => (
            <Card key={pet.id} className="border-[hsl(35,30%,90%)]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[hsl(35,40%,94%)] flex items-center justify-center">
                    <PawPrint className="h-5 w-5 text-[hsl(25,85%,55%)]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[hsl(25,30%,15%)]">{pet.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] bg-[hsl(35,40%,94%)] text-[hsl(25,30%,35%)]">
                        {speciesLabels[pet.species] || pet.species}
                      </Badge>
                      {pet.breed && <span className="text-[10px] text-[hsl(25,15%,55%)]">{pet.breed}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(pet)} className="text-xs text-[hsl(25,85%,55%)]">
                    Bearbeiten
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(pet.id)} className="text-[hsl(0,60%,50%)] h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
