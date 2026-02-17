/**
 * LennoxProfil — Zone 3 Halter-Profil (Self-Service)
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PawPrint, Save, LogOut, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'Vorname erforderlich').max(100),
  last_name: z.string().trim().min(1, 'Nachname erforderlich').max(100),
  email: z.string().trim().email('Ungültige E-Mail').max(255),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  postal_code: z.string().trim().max(10).nullable().optional(),
});

export default function LennoxProfil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', postal_code: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/website/tierservice/login'); return; }
      
      const { data } = await supabase
        .from('pet_z1_customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: (data as any).city || '',
          postal_code: (data as any).postal_code || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('pet_z1_customers')
      .update({
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        postal_code: parsed.data.postal_code || null,
      } as any)
      .eq('id', profile.id);
    setSaving(false);
    if (error) toast.error('Fehler beim Speichern');
    else toast.success('Profil gespeichert!');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/website/tierservice');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(25,85%,55%)] border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-[hsl(25,15%,55%)]">Kein Profil gefunden. Bitte registriere dich zuerst.</p>
        <Link to="/website/tierservice/login">
          <Button className="rounded-full bg-[hsl(25,85%,55%)] text-white">Registrieren</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[hsl(25,30%,15%)]">Mein Profil</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[hsl(25,15%,55%)]">
          <LogOut className="h-4 w-4 mr-1" /> Abmelden
        </Button>
      </div>

      {/* Quick link to pets */}
      <Link to="/website/tierservice/profil/tiere" className="block">
        <Card className="border-[hsl(35,30%,90%)] hover:border-[hsl(25,85%,55%,0.4)] transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PawPrint className="h-5 w-5 text-[hsl(25,85%,55%)]" />
              <span className="font-medium text-[hsl(25,30%,15%)]">Meine Tiere verwalten</span>
            </div>
            <ArrowRight className="h-4 w-4 text-[hsl(25,15%,55%)]" />
          </CardContent>
        </Card>
      </Link>

      {/* Profile form */}
      <Card className="border-[hsl(35,30%,90%)]">
        <CardHeader>
          <CardTitle className="text-base text-[hsl(25,30%,15%)]">Kontaktdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Vorname</label>
              <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={100} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Nachname</label>
              <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={100} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[hsl(25,20%,35%)]">E-Mail</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={255} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Telefon</label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={30} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Adresse</label>
            <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[hsl(25,20%,35%)]">PLZ</label>
              <Input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={10} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Ort</label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="border-[hsl(35,30%,85%)]" maxLength={100} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="rounded-full bg-[hsl(25,85%,55%)] hover:bg-[hsl(25,85%,48%)] text-white">
            <Save className="h-4 w-4 mr-1" /> {saving ? 'Speichern...' : 'Profil speichern'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
