/**
 * ProjectLandingBeratung — Beratung & Lead Capture
 * 
 * Shows tenant advisors + contact form (leads → Zone 1)
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Mail, Phone, User, Send, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Advisor {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export default function ProjectLandingBeratung() {
  const { slug } = useParams<{ slug: string }>();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['project-landing-beratung', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data: lp } = await supabase
        .from('landing_pages')
        .select('id, project_id, advisor_ids, contact_email, contact_phone, organization_id')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (!lp?.project_id) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, tenant_id')
        .eq('id', lp.project_id)
        .maybeSingle();

      if (!project) return null;

      // Get advisors from profiles
      let advisors: Advisor[] = [];
      const advisorIds = lp.advisor_ids as string[] | null;

      if (advisorIds && advisorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name, avatar_url, email')
          .in('id', advisorIds);
        advisors = (profiles || []) as unknown as Advisor[];
      }

      return { landingPage: lp, project: project as any, advisors };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Bitte füllen Sie mindestens Name und E-Mail aus.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create lead via insert
      const { error } = await supabase.from('leads').insert({
        source: 'project_landing',
        notes: `[${slug}] ${formData.name} — ${formData.email}${formData.phone ? ` — ${formData.phone}` : ''}${formData.message ? `\n${formData.message}` : ''}`,
        status: 'new',
        tenant_id: data?.project?.tenant_id || data?.landingPage?.organization_id,
      } as any);

      if (error) throw error;
      setSubmitted(true);
      toast.success('Ihre Anfrage wurde gesendet!');
    } catch (err) {
      console.error('Lead submission error:', err);
      toast.error('Fehler beim Senden. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAdvisorName = (a: Advisor) =>
    a.display_name || [a.first_name, a.last_name].filter(Boolean).join(' ') || 'Berater';

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" /></div>;
  }

  if (!data) {
    return <div className="text-center py-24"><Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" /><p className="text-[hsl(215,16%,47%)]">Projekt nicht gefunden.</p></div>;
  }

  const { advisors } = data;

  return (
    <div className="py-12 px-6 lg:px-10 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(220,20%,10%)]">Persönliche Beratung</h1>
        <p className="mt-4 text-[hsl(215,16%,47%)] text-lg">
          Unsere Berater unterstützen Sie bei der Auswahl der passenden Einheit und begleiten Sie durch den gesamten Kaufprozess.
        </p>
      </div>

      {advisors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {advisors.map((advisor) => (
            <Card key={advisor.id} className="border-[hsl(214,32%,91%)] text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 rounded-full bg-[hsl(210,30%,95%)] mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {advisor.avatar_url ? (
                    <img src={advisor.avatar_url} alt={getAdvisorName(advisor)} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[hsl(215,16%,47%)]" />
                  )}
                </div>
                <h3 className="font-semibold text-[hsl(220,20%,10%)]">{getAdvisorName(advisor)}</h3>
                <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Immobilienberater</p>
                {advisor.email && (
                  <a href={`mailto:${advisor.email}`} className="inline-flex items-center gap-1.5 mt-3 text-xs text-[hsl(210,80%,55%)] hover:underline">
                    <Mail className="h-3 w-3" />{advisor.email}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="max-w-xl mx-auto">
        <Card className="border-[hsl(214,32%,91%)]">
          <CardContent className="p-8">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-2">Vielen Dank!</h3>
                <p className="text-[hsl(215,16%,47%)]">Wir haben Ihre Anfrage erhalten und melden uns in Kürze bei Ihnen.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-6">Kontakt aufnehmen</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">E-Mail *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">Telefon</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">Nachricht</label>
                    <textarea value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm min-h-[100px]" placeholder="Ich interessiere mich für..." />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-lg bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Anfrage senden
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {(data.landingPage.contact_email || data.landingPage.contact_phone) && (
        <div className="text-center space-y-2">
          <p className="text-sm text-[hsl(215,16%,47%)]">Oder kontaktieren Sie uns direkt:</p>
          <div className="flex items-center justify-center gap-6">
            {data.landingPage.contact_email && (
              <a href={`mailto:${data.landingPage.contact_email}`} className="flex items-center gap-2 text-sm text-[hsl(210,80%,55%)] hover:underline">
                <Mail className="h-4 w-4" />{data.landingPage.contact_email}
              </a>
            )}
            {data.landingPage.contact_phone && (
              <a href={`tel:${data.landingPage.contact_phone}`} className="flex items-center gap-2 text-sm text-[hsl(210,80%,55%)] hover:underline">
                <Phone className="h-4 w-4" />{data.landingPage.contact_phone}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
