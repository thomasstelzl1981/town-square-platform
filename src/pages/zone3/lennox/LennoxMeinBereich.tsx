/**
 * LennoxMeinBereich — Zone 3 "Mein Bereich"
 * Two full-width inline sections:
 *   1. Buchungsanfrage + Status list (via pet_service_cases / PLC)
 *   2. Hundeakte (inline CRUD for pet_z1_pets)
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PawPrint, Calendar, Plus, ArrowLeft, Send, Save, X, Trash2, Check, XCircle, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useZ3Auth } from '@/hooks/useZ3Auth';
import { useCasesForZ3Customer, useCreateZ3Case, type CaseWithComputed } from '@/hooks/usePetServiceCases';
import { PLC_PHASE_LABELS, type PLCPhase } from '@/engines/plc/spec';
import { z } from 'zod';
import { LENNOX as C, SPECIES_LABELS, GENDER_LABELS } from './lennoxTheme';

/* ── Pet form schema & helpers ───────────────────────── */
const petSchema = z.object({
  name: z.string().trim().min(1, 'Name erforderlich').max(100),
  species: z.enum(['dog', 'cat', 'bird', 'small_animal', 'reptile', 'other']).default('dog'),
  breed: z.string().trim().max(100).optional(),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  birth_date: z.string().optional(),
  weight_kg: z.number().positive().max(500).optional().nullable(),
  chip_number: z.string().trim().max(50).optional(),
  neutered: z.boolean().default(false),
  vet_name: z.string().trim().max(100).optional(),
  allergies: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});
type PetForm = z.infer<typeof petSchema>;
const emptyPet: PetForm = { name: '', species: 'dog', breed: '', gender: 'unknown', birth_date: '', weight_kg: null, chip_number: '', neutered: false, vet_name: '', allergies: [], notes: '' };

/** PLC phase → status badge config */
const phaseStatusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  provider_selected: { label: 'Angefragt', color: 'hsl(45,80%,50%)', icon: Clock },
  provider_confirmed: { label: 'Bestätigt', color: 'hsl(155,50%,40%)', icon: Check },
  provider_declined: { label: 'Abgelehnt', color: 'hsl(0,60%,50%)', icon: XCircle },
  checked_in: { label: 'Eingecheckt', color: 'hsl(155,60%,35%)', icon: Check },
  checked_out: { label: 'Ausgecheckt', color: 'hsl(200,60%,45%)', icon: Check },
  settlement: { label: 'Abrechnung', color: 'hsl(25,85%,55%)', icon: Clock },
  closed_completed: { label: 'Abgeschlossen', color: 'hsl(155,60%,30%)', icon: Check },
  closed_cancelled: { label: 'Storniert', color: 'hsl(0,60%,50%)', icon: XCircle },
};

const selectCls = `w-full h-10 rounded-md border px-3 text-sm`;

export default function LennoxMeinBereich() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { z3User, z3Loading, z3Logout } = useZ3Auth();

  // ─── Auth guard ────────────────────────────────────
  useEffect(() => {
    if (!z3Loading && !z3User) {
      navigate('/website/tierservice/login?returnTo=/website/tierservice/mein-bereich');
    }
  }, [z3Loading, z3User, navigate]);

  // ─── Tenant ID from provider (for new bookings) ────
  // We'll get it from the selected provider when submitting

  // ─── Pets ──────────────────────────────────────────
  const { data: pets = [], refetch: refetchPets } = useQuery({
    queryKey: ['z3_pets', z3User?.id],
    queryFn: async () => {
      const { data } = await (supabase.from('pet_z1_pets' as any) as any).select('*').eq('z1_customer_id', z3User!.id).order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!z3User?.id,
  });

  // ─── Published providers ──────────────────────────
  const { data: providers = [] } = useQuery({
    queryKey: ['z3_providers'],
    queryFn: async () => {
      const { data } = await supabase.from('pet_providers').select('id, company_name, tenant_id').eq('is_published', true).order('company_name');
      return data || [];
    },
  });

  // ─── Services for selected provider ────────────────
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const { data: services = [] } = useQuery({
    queryKey: ['z3_services', selectedProviderId],
    queryFn: async () => {
      const { data } = await supabase.from('pet_services').select('id, title, price_cents, category').eq('provider_id', selectedProviderId).eq('is_active', true).order('title');
      return data || [];
    },
    enabled: !!selectedProviderId,
  });

  // ─── Cases (PLC) — via Edge Function proxy (P0 security) ──
  const { z3SessionToken } = useZ3Auth();
  const { data: cases = [] } = useCasesForZ3Customer(z3User?.id, z3SessionToken);

  // ─── Create Case mutation (Z3 proxy) ──────────────
  const createCase = useCreateZ3Case();

  // ─── Booking form state ────────────────────────────
  const [bookingService, setBookingService] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingDateEnd, setBookingDateEnd] = useState('');
  const [bookingPetId, setBookingPetId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // ─── Pet form state ────────────────────────────────
  const [petEditId, setPetEditId] = useState<string | null>(null);
  const [showPetForm, setShowPetForm] = useState(false);
  const [petForm, setPetForm] = useState<PetForm>(emptyPet);
  const [petSaving, setPetSaving] = useState(false);

  // ── Set default provider if only one ───────────────
  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  // ── Handlers ───────────────────────────────────────

  const handleLogout = async () => {
    await z3Logout();
    toast.success('Abgemeldet');
    navigate('/website/tierservice');
  };

  const handleBookingSubmit = async () => {
    if (!bookingService) { toast.error('Bitte Service wählen'); return; }
    if (!selectedProviderId) { toast.error('Bitte Anbieter wählen'); return; }
    if (!z3User || !z3SessionToken) return;

    // Find the selected service's ID for pricing SSOT
    const selectedSvc = services.find((s: any) => s.title === bookingService);

    createCase.mutate({
      session_token: z3SessionToken,
      provider_id: selectedProviderId,
      service_id: selectedSvc?.id || null,
      customer_notes: bookingNotes || null,
      scheduled_start: bookingDate || null,
      scheduled_end: bookingDateEnd || null,
      pet_id: bookingPetId || null,
    }, {
      onSuccess: () => {
        setBookingService('');
        setBookingDate('');
        setBookingDateEnd('');
        setBookingPetId('');
        setBookingNotes('');
      },
    });
  };

  const handlePetSave = async () => {
    const parsed = petSchema.safeParse(petForm);
    if (!parsed.success) { toast.error(parsed.error.errors[0]?.message); return; }
    if (!z3User) return;

    // Get tenant from first provider (Z3 pets need a tenant_id)
    const firstProvider = providers[0];
    if (!firstProvider?.tenant_id) { toast.error('Konfiguration fehlt'); return; }

    setPetSaving(true);
    const payload: any = {
      name: parsed.data.name,
      species: parsed.data.species,
      breed: parsed.data.breed || null,
      gender: parsed.data.gender,
      birth_date: parsed.data.birth_date || null,
      weight_kg: parsed.data.weight_kg || null,
      chip_number: parsed.data.chip_number || null,
      neutered: parsed.data.neutered,
      vet_name: parsed.data.vet_name || null,
      allergies: parsed.data.allergies?.length ? parsed.data.allergies : null,
      notes: parsed.data.notes || null,
    };

    if (petEditId) {
      const { error } = await (supabase.from('pet_z1_pets' as any) as any).update(payload).eq('id', petEditId);
      if (error) toast.error('Fehler beim Aktualisieren');
      else toast.success('Tier aktualisiert');
    } else {
      payload.z1_customer_id = z3User.id;
      payload.tenant_id = firstProvider.tenant_id;
      const { error } = await (supabase.from('pet_z1_pets' as any) as any).insert(payload);
      if (error) toast.error('Fehler beim Anlegen');
      else toast.success('Tier angelegt');
    }
    setPetSaving(false);
    setPetEditId(null);
    setShowPetForm(false);
    setPetForm(emptyPet);
    refetchPets();
  };

  const handlePetDelete = async (id: string) => {
    if (!confirm('Tier wirklich löschen?')) return;
    const { error } = await (supabase.from('pet_z1_pets' as any) as any).delete().eq('id', id);
    if (error) toast.error('Fehler beim Löschen');
    else { toast.success('Tier entfernt'); refetchPets(); }
  };

  const startPetEdit = (pet: any) => {
    setPetEditId(pet.id);
    setShowPetForm(true);
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      gender: pet.gender || 'unknown',
      birth_date: pet.birth_date || '',
      weight_kg: pet.weight_kg,
      chip_number: pet.chip_number || '',
      neutered: pet.neutered || false,
      vet_name: pet.vet_name || '',
      allergies: pet.allergies || [],
      notes: pet.notes || '',
    });
  };

  // ── Loading / guard ────────────────────────────────
  if (z3Loading) {
    return (
      <div className="flex justify-center py-20" style={{ background: C.cream }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: C.forest }} />
      </div>
    );
  }
  if (!z3User) return null;

  const displayName = z3User.first_name
    ? `${z3User.first_name} ${z3User.last_name || ''}`
    : z3User.email;

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-8" style={{ background: C.cream, minHeight: '60vh' }}>
      {/* ── Back link ─────────────────────────────────── */}
      <Link to="/website/tierservice" className="inline-flex items-center gap-1.5 text-sm hover:gap-2.5 transition-all" style={{ color: C.barkMuted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* ── Header with profile info ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.bark }}>Mein Bereich</h1>
          <p className="text-sm" style={{ color: C.barkMuted }}>Hallo, {displayName} 👋</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs" style={{ color: C.barkMuted }}>
            <span>{z3User.email}</span>
            {z3User.phone && <span>Tel: {z3User.phone}</span>}
            {(z3User.postal_code || z3User.city) && (
              <span>{[z3User.postal_code, z3User.city].filter(Boolean).join(' ')}</span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full self-start" onClick={handleLogout}
          style={{ borderColor: C.sand, color: C.barkMuted }}>
          Abmelden
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════
          KACHEL 1: BUCHUNGSANFRAGE + STATUS (PLC)
          ══════════════════════════════════════════════════ */}
      <Card className="border shadow-sm" style={{ borderColor: C.sandLight, background: C.white }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: C.bark }}>
            <Calendar className="h-5 w-5" style={{ color: C.forest }} />
            Buchungsanfrage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* ── Booking Form ─────────────────────────── */}
          <div className="space-y-4 p-4 rounded-lg" style={{ background: C.sandLight }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium" style={{ color: C.barkMuted }}>Anbieter *</Label>
                <select value={selectedProviderId} onChange={e => { setSelectedProviderId(e.target.value); setBookingService(''); }}
                  className={selectCls} style={{ borderColor: C.sand, background: C.cream }}>
                  <option value="">— Anbieter wählen —</option>
                  {providers.map((p: any) => <option key={p.id} value={p.id}>{p.company_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium" style={{ color: C.barkMuted }}>Service *</Label>
                <select value={bookingService} onChange={e => setBookingService(e.target.value)}
                  className={selectCls} style={{ borderColor: C.sand, background: C.cream }}>
                  <option value="">— Service wählen —</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.title}>{s.title} {s.price_cents ? `(${(s.price_cents / 100).toFixed(2)} €)` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium" style={{ color: C.barkMuted }}>Von</Label>
                <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ borderColor: C.sand }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium" style={{ color: C.barkMuted }}>Bis</Label>
                <Input type="date" value={bookingDateEnd} onChange={e => setBookingDateEnd(e.target.value)}
                  min={bookingDate || new Date().toISOString().split('T')[0]}
                  style={{ borderColor: C.sand }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium" style={{ color: C.barkMuted }}>Für welches Tier?</Label>
                <select value={bookingPetId} onChange={e => setBookingPetId(e.target.value)}
                  className={selectCls} style={{ borderColor: C.sand, background: C.cream }}>
                  <option value="">— optional —</option>
                  {pets.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({SPECIES_LABELS[p.species] || p.species})</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium" style={{ color: C.barkMuted }}>Anmerkungen</Label>
              <Textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)}
                maxLength={500} rows={2} placeholder="Besondere Wünsche, Allergien, etc."
                style={{ borderColor: C.sand, background: C.cream }} />
            </div>

            <Button onClick={handleBookingSubmit} disabled={createCase.isPending}
              className="rounded-full text-white" style={{ background: C.coral }}>
              <Send className="h-4 w-4 mr-1.5" />
              {createCase.isPending ? 'Wird gesendet...' : 'Anfrage senden'}
            </Button>
          </div>

          {/* ── Booking Status List (PLC Cases) ──────── */}
          {cases.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold" style={{ color: C.bark }}>Meine Buchungen</h3>
              {cases.map((c: CaseWithComputed) => {
                const phase = c.current_phase as string;
                const cfg = phaseStatusConfig[phase] || { label: PLC_PHASE_LABELS[c.current_phase] || phase, color: 'hsl(0,0%,60%)', icon: Clock };
                const StatusIcon = cfg.icon;
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg text-sm"
                    style={{ background: C.sandLight }}>
                    <div className="space-y-0.5">
                      <p className="font-medium" style={{ color: C.bark }}>
                        {PLC_PHASE_LABELS[c.current_phase] || c.current_phase}
                      </p>
                      <p className="text-xs" style={{ color: C.barkMuted }}>
                        {c.scheduled_start && new Date(c.scheduled_start).toLocaleDateString('de-DE')}
                        {c.scheduled_end && ` – ${new Date(c.scheduled_end).toLocaleDateString('de-DE')}`}
                      </p>
                    </div>
                    <Badge className="text-xs rounded-full gap-1 text-white" style={{ background: cfg.color }}>
                      <StatusIcon className="h-3 w-3" /> {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════
          KACHEL 2: HUNDEAKTE
          ══════════════════════════════════════════════════ */}
      <Card className="border shadow-sm" style={{ borderColor: C.sandLight, background: C.white }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: C.bark }}>
              <PawPrint className="h-5 w-5" style={{ color: C.forest }} />
              Hundeakte
              <Badge variant="outline" className="text-xs ml-1" style={{ borderColor: C.sand, color: C.barkMuted }}>{pets.length}</Badge>
            </CardTitle>
            {!showPetForm && (
              <Button variant="outline" size="sm" className="rounded-full text-xs"
                style={{ borderColor: C.sand, color: C.forest }}
                onClick={() => { setShowPetForm(true); setPetEditId(null); setPetForm(emptyPet); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Tier hinzufügen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── Add/Edit Form ────────────────────────── */}
          {showPetForm && (
            <div className="p-4 rounded-lg space-y-4" style={{ background: C.sandLight }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: C.bark }}>{petEditId ? 'Tier bearbeiten' : 'Neues Tier'}</p>
                <button onClick={() => { setShowPetForm(false); setPetEditId(null); setPetForm(emptyPet); }}>
                  <X className="h-4 w-4" style={{ color: C.barkMuted }} />
                </button>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.barkMuted }}>Stammdaten</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Name *</Label>
                  <Input value={petForm.name} onChange={e => setPetForm(f => ({ ...f, name: e.target.value }))} maxLength={100} style={{ borderColor: C.sand }} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Tierart *</Label>
                  <select value={petForm.species} onChange={e => setPetForm(f => ({ ...f, species: e.target.value as any }))}
                    className={selectCls} style={{ borderColor: C.sand, background: C.cream }}>
                    {Object.entries(SPECIES_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Rasse</Label>
                  <Input value={petForm.breed || ''} onChange={e => setPetForm(f => ({ ...f, breed: e.target.value }))} maxLength={100} style={{ borderColor: C.sand }} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Geschlecht</Label>
                  <select value={petForm.gender} onChange={e => setPetForm(f => ({ ...f, gender: e.target.value as any }))}
                    className={selectCls} style={{ borderColor: C.sand, background: C.cream }}>
                    {Object.entries(GENDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: C.barkMuted }}>Körperdaten & Identifikation</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Geburtsdatum</Label>
                  <Input type="date" value={petForm.birth_date || ''} onChange={e => setPetForm(f => ({ ...f, birth_date: e.target.value }))} style={{ borderColor: C.sand }} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Gewicht (kg)</Label>
                  <Input type="number" step="0.1" value={petForm.weight_kg ?? ''} onChange={e => setPetForm(f => ({ ...f, weight_kg: e.target.value ? parseFloat(e.target.value) : null }))} style={{ borderColor: C.sand }} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Chip-Nr.</Label>
                  <Input value={petForm.chip_number || ''} onChange={e => setPetForm(f => ({ ...f, chip_number: e.target.value }))} maxLength={50} style={{ borderColor: C.sand }} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm" style={{ color: C.barkMuted }}>
                <input type="checkbox" checked={petForm.neutered} onChange={e => setPetForm(f => ({ ...f, neutered: e.target.checked }))} className="rounded" />
                Kastriert / Sterilisiert
              </label>

              <p className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: C.barkMuted }}>Gesundheit</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Tierarzt</Label>
                  <Input value={petForm.vet_name || ''} onChange={e => setPetForm(f => ({ ...f, vet_name: e.target.value }))} maxLength={100} style={{ borderColor: C.sand }} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" style={{ color: C.barkMuted }}>Allergien (kommagetrennt)</Label>
                  <Input value={(petForm.allergies || []).join(', ')} onChange={e => setPetForm(f => ({ ...f, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} style={{ borderColor: C.sand }} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: C.barkMuted }}>Notizen</Label>
                <Textarea value={petForm.notes || ''} onChange={e => setPetForm(f => ({ ...f, notes: e.target.value }))} maxLength={500} rows={2} style={{ borderColor: C.sand, background: C.cream }} />
              </div>

              <Button onClick={handlePetSave} disabled={petSaving} className="rounded-full text-white" style={{ background: C.coral }}>
                <Save className="h-4 w-4 mr-1" /> {petSaving ? 'Speichern...' : petEditId ? 'Aktualisieren' : 'Anlegen'}
              </Button>
            </div>
          )}

          {/* ── Pet List ─────────────────────────────── */}
          {pets.length === 0 && !showPetForm ? (
            <div className="text-center py-8">
              <PawPrint className="h-10 w-10 mx-auto mb-3" style={{ color: C.sand }} />
              <p className="text-sm" style={{ color: C.barkMuted }}>Noch keine Tiere angelegt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pets.map((pet: any) => (
                <div key={pet.id} className="p-4 rounded-lg space-y-2" style={{ background: C.sandLight }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4" style={{ color: C.forest }} />
                      <span className="font-semibold text-sm" style={{ color: C.bark }}>{pet.name}</span>
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: C.sand, color: C.barkMuted }}>
                        {SPECIES_LABELS[pet.species] || pet.species}
                      </Badge>
                      {pet.breed && <span className="text-xs" style={{ color: C.barkMuted }}>{pet.breed}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startPetEdit(pet)} className="text-xs" style={{ color: C.coral }}>Bearbeiten</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePetDelete(pet.id)}>
                        <Trash2 className="h-3.5 w-3.5" style={{ color: 'hsl(0,60%,50%)' }} />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs" style={{ color: C.barkMuted }}>
                    <span>Geschlecht: <strong style={{ color: C.bark }}>{GENDER_LABELS[pet.gender] || '—'}</strong></span>
                    <span>Geb.: <strong style={{ color: C.bark }}>{pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('de-DE') : '—'}</strong></span>
                    <span>Gewicht: <strong style={{ color: C.bark }}>{pet.weight_kg ? `${pet.weight_kg} kg` : '—'}</strong></span>
                    <span>Chip: <strong style={{ color: C.bark }}>{pet.chip_number || '—'}</strong></span>
                    <span>Kastriert: <strong style={{ color: C.bark }}>{pet.neutered ? 'Ja' : 'Nein'}</strong></span>
                    <span>Tierarzt: <strong style={{ color: C.bark }}>{pet.vet_name || '—'}</strong></span>
                    <span className="col-span-2">Allergien: <strong style={{ color: C.bark }}>{pet.allergies?.length ? pet.allergies.join(', ') : '—'}</strong></span>
                  </div>
                  {pet.notes && (
                    <p className="text-xs italic" style={{ color: C.barkMuted }}>{pet.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
