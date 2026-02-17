/**
 * LennoxBuchen — Zone 3 Buchungsformular
 * Route: /website/tierservice/anbieter/:providerId/buchen
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Send } from 'lucide-react';
import { useProviderDetail } from '@/hooks/usePetProviderSearch';
import { usePublicProviderServices } from '@/hooks/usePublicPetProvider';
import { toast } from 'sonner';

const serviceTypeLabels: Record<string, string> = {
  betreuung: 'Betreuung', gassi: 'Gassi-Service', pflege: 'Pflege',
  training: 'Training', pension: 'Pension', sonstiges: 'Sonstiges',
};

export default function LennoxBuchen() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { data: provider } = useProviderDetail(providerId);
  const { data: services = [] } = usePublicProviderServices(providerId);

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate(`/website/tierservice/login?returnTo=/website/tierservice/anbieter/${providerId}/buchen`);
      else setUserId(user.id);
    });
  }, [navigate, providerId]);

  const handleSubmit = async () => {
    if (!selectedService) { toast.error('Bitte wähle einen Service.'); return; }
    if (!userId) return;

    setSending(true);

    // Get customer profile
    const { data: customer } = await supabase
      .from('pet_z1_customers')
      .select('id, tenant_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!customer) {
      toast.error('Bitte vervollständige zuerst dein Profil.');
      navigate('/website/tierservice/profil');
      return;
    }

    // For now, update pet_z1_customers with a note about the booking request
    const bookingNote = `Buchungsanfrage: ${selectedService}${preferredDate ? ` am ${preferredDate}` : ''}${notes ? ` — ${notes}` : ''} (Provider: ${provider?.company_name || providerId})`;
    
    await supabase
      .from('pet_z1_customers')
      .update({
        notes: bookingNote,
        status: 'qualified',
      } as any)
      .eq('id', customer.id);

    setSending(false);
    toast.success('Buchungsanfrage gesendet! Wir melden uns bei dir.');
    navigate('/website/tierservice/profil');
  };

  if (!userId) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link to={`/website/tierservice/anbieter/${providerId}`} className="inline-flex items-center gap-1 text-sm text-[hsl(25,15%,55%)] hover:text-[hsl(25,85%,55%)]">
        <ArrowLeft className="h-4 w-4" /> Zurück zum Anbieter
      </Link>

      <h1 className="text-2xl font-bold text-[hsl(25,30%,15%)]">
        Termin buchen {provider ? `bei ${provider.company_name}` : ''}
      </h1>

      <Card className="border-[hsl(35,30%,90%)]">
        <CardHeader>
          <CardTitle className="text-base text-[hsl(25,30%,15%)] flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[hsl(25,85%,55%)]" /> Buchungsdetails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Service *</label>
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="w-full h-10 rounded-md border border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)] px-3 text-sm"
            >
              <option value="">— Bitte wählen —</option>
              {services.length > 0
                ? services.map(s => (
                    <option key={s.id} value={s.title}>{s.title} {s.price_cents ? `(${(s.price_cents / 100).toFixed(2)} €)` : ''}</option>
                  ))
                : Object.entries(serviceTypeLabels).map(([k, v]) => (
                    <option key={k} value={v}>{v}</option>
                  ))
              }
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Wunschtermin</label>
            <Input
              type="date"
              value={preferredDate}
              onChange={e => setPreferredDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="border-[hsl(35,30%,85%)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[hsl(25,20%,35%)]">Anmerkungen</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-[hsl(35,30%,85%)] bg-[hsl(35,40%,97%)] px-3 py-2 text-sm placeholder:text-[hsl(25,15%,65%)] focus:outline-none focus:ring-2 focus:ring-[hsl(25,85%,55%,0.3)]"
              placeholder="Besondere Wünsche, Allergien, etc."
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full rounded-full bg-[hsl(25,85%,55%)] hover:bg-[hsl(25,85%,48%)] text-white"
          >
            <Send className="h-4 w-4 mr-1" /> {sending ? 'Wird gesendet...' : 'Anfrage senden'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
