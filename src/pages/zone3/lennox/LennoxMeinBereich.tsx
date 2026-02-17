/**
 * LennoxMeinBereich — Dashboard für eingeloggte Nutzer
 * Widgets: Meine Tiere, Meine Buchungen, Rechnungen, Einstellungen
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PawPrint, Calendar, FileText, Settings, LogOut, Plus, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const COLORS = {
  primary: 'hsl(155,35%,25%)',
  foreground: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  sand: 'hsl(35,30%,85%)',
};

export default function LennoxMeinBereich() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        navigate('/website/tierservice/login?returnTo=/website/tierservice/mein-bereich');
      } else {
        setUser(u);
      }
      setLoading(false);
    });
  }, [navigate]);

  // Load user's Z1 customer profile
  const { data: customerProfile } = useQuery({
    queryKey: ['my_z1_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('pet_z1_customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Load user's pets
  const { data: pets = [] } = useQuery({
    queryKey: ['my_z1_pets', customerProfile?.id],
    queryFn: async () => {
      if (!customerProfile) return [];
      const { data } = await supabase
        .from('pet_z1_pets')
        .select('*')
        .eq('z1_customer_id', customerProfile.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!customerProfile?.id,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Abgemeldet');
    navigate('/website/tierservice');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: COLORS.primary }} />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
    : user.email;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
      <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: COLORS.muted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* Profile header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.foreground }}>Mein Bereich</h1>
          <p className="text-sm" style={{ color: COLORS.muted }}>Hallo, {displayName}</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" /> Abmelden
        </Button>
      </div>

      {/* Widget Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* ═══ MEINE TIERE ═══ */}
        <Card className="border" style={{ borderColor: COLORS.sand, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2" style={{ color: COLORS.foreground }}>
                <PawPrint className="h-5 w-5" style={{ color: COLORS.primary }} />
                Meine Tiere
              </h2>
              <Badge variant="outline" className="text-xs">{pets.length}</Badge>
            </div>
            {pets.length === 0 ? (
              <p className="text-sm" style={{ color: COLORS.muted }}>Noch keine Tiere angelegt.</p>
            ) : (
              <div className="space-y-2">
                {pets.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm" style={{ color: COLORS.foreground }}>
                    <PawPrint className="h-3.5 w-3.5" style={{ color: COLORS.primary }} />
                    <span className="font-medium">{p.name}</span>
                    {p.breed && <span style={{ color: COLORS.muted }}>({p.breed})</span>}
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full rounded-full text-xs">
              <Plus className="h-3 w-3 mr-1" /> Tier hinzufügen
            </Button>
          </CardContent>
        </Card>

        {/* ═══ MEINE BUCHUNGEN ═══ */}
        <Card className="border" style={{ borderColor: COLORS.sand, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: COLORS.foreground }}>
              <Calendar className="h-5 w-5" style={{ color: COLORS.primary }} />
              Meine Buchungen
            </h2>
            <p className="text-sm" style={{ color: COLORS.muted }}>Keine aktiven Buchungen.</p>
            <div className="h-16 rounded-lg flex items-center justify-center" style={{ background: `hsl(155,20%,95%)` }}>
              <p className="text-xs" style={{ color: COLORS.muted }}>Buchungsübersicht kommt bald</p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ RECHNUNGEN ═══ */}
        <Card className="border" style={{ borderColor: COLORS.sand, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: COLORS.foreground }}>
              <FileText className="h-5 w-5" style={{ color: COLORS.primary }} />
              Rechnungen
            </h2>
            <p className="text-sm" style={{ color: COLORS.muted }}>Keine Rechnungen vorhanden.</p>
            <div className="h-16 rounded-lg flex items-center justify-center" style={{ background: `hsl(155,20%,95%)` }}>
              <p className="text-xs" style={{ color: COLORS.muted }}>Rechnungen-Bereich kommt bald</p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ EINSTELLUNGEN ═══ */}
        <Card className="border" style={{ borderColor: COLORS.sand, background: 'white' }}>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: COLORS.foreground }}>
              <Settings className="h-5 w-5" style={{ color: COLORS.primary }} />
              Einstellungen
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: COLORS.muted }}>E-Mail</span>
                <span style={{ color: COLORS.foreground }}>{user.email}</span>
              </div>
              {customerProfile && (
                <>
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.muted }}>Telefon</span>
                    <span style={{ color: COLORS.foreground }}>{customerProfile.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.muted }}>Ort</span>
                    <span style={{ color: COLORS.foreground }}>
                      {[customerProfile.postal_code, customerProfile.city].filter(Boolean).join(' ') || '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
