/**
 * LennoxMeinBereich — Alpine Chic Dashboard
 */
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PawPrint, Calendar, FileText, Settings, LogOut, Plus, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useZ3Auth } from '@/hooks/useZ3Auth';

const C = {
  forest: 'hsl(155,35%,22%)',
  cream: 'hsl(38,45%,96%)',
  bark: 'hsl(25,30%,18%)',
  barkMuted: 'hsl(25,15%,42%)',
  sand: 'hsl(32,35%,82%)',
  sandLight: 'hsl(35,40%,92%)',
  coral: 'hsl(10,78%,58%)',
};

export default function LennoxMeinBereich() {
  const navigate = useNavigate();
  const { z3User, z3Loading, z3Logout } = useZ3Auth();

  useEffect(() => {
    if (!z3Loading && !z3User) {
      navigate('/website/tierservice/login?returnTo=/website/tierservice/mein-bereich');
    }
  }, [z3Loading, z3User, navigate]);

  const { data: pets = [] } = useQuery({
    queryKey: ['my_z1_pets', z3User?.id],
    queryFn: async () => {
      if (!z3User) return [];
      const { data } = await supabase
        .from('pet_z1_pets')
        .select('*')
        .eq('z1_customer_id', z3User.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!z3User?.id,
  });

  const handleLogout = async () => {
    await z3Logout();
    toast.success('Abgemeldet');
    navigate('/website/tierservice');
  };

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
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-8" style={{ background: C.cream, minHeight: '60vh' }}>
      <Link to="/website/tierservice" className="inline-flex items-center gap-1.5 text-sm hover:gap-2.5 transition-all"
        style={{ color: C.barkMuted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: C.bark }}>Mein Bereich</h1>
          <p className="text-sm" style={{ color: C.barkMuted }}>Hallo, {displayName} 👋</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={handleLogout}
          style={{ borderColor: C.sand, color: C.barkMuted }}>
          <LogOut className="h-4 w-4 mr-1" /> Abmelden
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* MEINE TIERE */}
        <Card className="border shadow-sm" style={{ borderColor: C.sandLight, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2" style={{ color: C.bark }}>
                <PawPrint className="h-5 w-5" style={{ color: C.forest }} />
                Meine Tiere
              </h2>
              <Badge variant="outline" className="text-xs" style={{ borderColor: C.sand, color: C.barkMuted }}>{pets.length}</Badge>
            </div>
            {pets.length === 0 ? (
              <p className="text-sm" style={{ color: C.barkMuted }}>Noch keine Tiere angelegt.</p>
            ) : (
              <div className="space-y-2">
                {pets.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm" style={{ color: C.bark }}>
                    <PawPrint className="h-3.5 w-3.5" style={{ color: C.forest }} />
                    <span className="font-medium">{p.name}</span>
                    {p.breed && <span style={{ color: C.barkMuted }}>({p.breed})</span>}
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full rounded-full text-xs"
              style={{ borderColor: C.sand, color: C.forest }}>
              <Plus className="h-3 w-3 mr-1" /> Tier hinzufügen
            </Button>
          </CardContent>
        </Card>

        {/* BUCHUNGEN */}
        <Card className="border shadow-sm" style={{ borderColor: C.sandLight, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: C.bark }}>
              <Calendar className="h-5 w-5" style={{ color: C.forest }} />
              Meine Buchungen
            </h2>
            <p className="text-sm" style={{ color: C.barkMuted }}>Keine aktiven Buchungen.</p>
            <div className="h-16 rounded-lg flex items-center justify-center" style={{ background: C.sandLight }}>
              <p className="text-xs" style={{ color: C.barkMuted }}>Buchungsübersicht kommt bald</p>
            </div>
          </CardContent>
        </Card>

        {/* RECHNUNGEN */}
        <Card className="border shadow-sm" style={{ borderColor: C.sandLight, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: C.bark }}>
              <FileText className="h-5 w-5" style={{ color: C.forest }} />
              Rechnungen
            </h2>
            <p className="text-sm" style={{ color: C.barkMuted }}>Keine Rechnungen vorhanden.</p>
            <div className="h-16 rounded-lg flex items-center justify-center" style={{ background: C.sandLight }}>
              <p className="text-xs" style={{ color: C.barkMuted }}>Rechnungen-Bereich kommt bald</p>
            </div>
          </CardContent>
        </Card>

        {/* EINSTELLUNGEN */}
        <Card className="border shadow-sm" style={{ borderColor: C.sandLight, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: C.bark }}>
              <Settings className="h-5 w-5" style={{ color: C.forest }} />
              Einstellungen
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span style={{ color: C.barkMuted }}>E-Mail</span>
                <span className="font-medium" style={{ color: C.bark }}>{z3User.email}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: C.barkMuted }}>Telefon</span>
                <span className="font-medium" style={{ color: C.bark }}>{z3User.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: C.barkMuted }}>Ort</span>
                <span className="font-medium" style={{ color: C.bark }}>
                  {[z3User.postal_code, z3User.city].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
