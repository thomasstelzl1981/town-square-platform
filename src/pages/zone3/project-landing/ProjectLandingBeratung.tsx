/**
 * ProjectLandingBeratung — Kaufy-branded Beratung & Lead Capture
 * 
 * Ansprechpartner ist IMMER Kaufy. Contact form submits to leads table
 * with source 'project_landing' for Zone 1 processing.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Mail, Phone, Send, CheckCircle2, Shield, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
        .select('id, project_id, contact_email, contact_phone, organization_id')
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

      return { landingPage: lp, project: project as any };
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
      const tenantId = data?.project?.tenant_id || data?.landingPage?.organization_id;
      const { error } = await supabase.from('leads').insert({
        source: `project_landing_${slug}`,
        notes: `[Projekt-Landing: ${data?.project?.name || slug}]\nName: ${formData.name}\nE-Mail: ${formData.email}${formData.phone ? `\nTelefon: ${formData.phone}` : ''}${formData.message ? `\nNachricht: ${formData.message}` : ''}`,
        status: 'new',
        tenant_id: tenantId,
        interest_type: 'kaufinteresse',
        zone1_pool: true,
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

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" /></div>;
  }

  if (!data) {
    return <div className="text-center py-24"><Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" /><p className="text-[hsl(215,16%,47%)]">Projekt nicht gefunden.</p></div>;
  }

  return (
    <div className="py-12 px-6 lg:px-10 space-y-12">
      {/* Kaufy Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(160,60%,95%)] text-[hsl(160,60%,30%)] text-xs font-semibold mb-4">
          <Shield className="h-3.5 w-3.5" />
          KAUFY Immobilienberatung
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(220,20%,10%)]">Ihre KAUFY Berater</h1>
        <p className="mt-4 text-[hsl(215,16%,47%)] text-lg">
          Die KAUFY Immobilienberater begleiten Sie von der Auswahl der passenden Einheit bis zum Kaufabschluss — 
          unabhängig, transparent und kostenfrei für Käufer.
        </p>
      </div>

      {/* Kaufy USPs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { icon: Shield, title: 'Unabhängige Beratung', desc: 'Keine versteckten Kosten — wir arbeiten ausschließlich im Interesse unserer Kunden.' },
          { icon: TrendingUp, title: 'Investment-Expertise', desc: 'Individuelle Renditeberechnung und Steueroptimierung für Ihre Kapitalanlage.' },
          { icon: Users, title: 'Persönlicher Ansprechpartner', desc: 'Ein fester Berater betreut Sie über den gesamten Kaufprozess hinweg.' },
        ].map((usp, i) => (
          <Card key={i} className="border-[hsl(214,32%,91%)]">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[hsl(160,60%,95%)] mx-auto mb-4 flex items-center justify-center">
                <usp.icon className="w-6 h-6 text-[hsl(160,60%,35%)]" />
              </div>
              <h3 className="font-semibold text-[hsl(220,20%,10%)] mb-2">{usp.title}</h3>
              <p className="text-sm text-[hsl(215,16%,47%)]">{usp.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Form */}
      <div className="max-w-xl mx-auto">
        <Card className="border-[hsl(214,32%,91%)] shadow-lg">
          <CardContent className="p-8">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-2">Vielen Dank!</h3>
                <p className="text-[hsl(215,16%,47%)]">Wir haben Ihre Anfrage erhalten und ein KAUFY Berater meldet sich in Kürze bei Ihnen.</p>
                <Link to={`/website/projekt/${slug}`}>
                  <Button variant="outline" className="mt-6">Zurück zur Übersicht</Button>
                </Link>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-2">Kostenlose Beratung anfragen</h3>
                <p className="text-sm text-[hsl(215,16%,47%)] mb-6">Füllen Sie das Formular aus und ein KAUFY Berater kontaktiert Sie innerhalb von 24 Stunden.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm focus:ring-2 focus:ring-[hsl(160,60%,35%,0.3)] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">E-Mail *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm focus:ring-2 focus:ring-[hsl(160,60%,35%,0.3)] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">Telefon</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm focus:ring-2 focus:ring-[hsl(160,60%,35%,0.3)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(220,20%,10%)] mb-1 block">Nachricht</label>
                    <textarea value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(214,32%,91%)] bg-white text-sm min-h-[100px] focus:ring-2 focus:ring-[hsl(160,60%,35%,0.3)] focus:outline-none" placeholder="Ich interessiere mich für..." />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-lg bg-[hsl(160,55%,35%)] hover:bg-[hsl(160,55%,30%)] text-white gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Kostenlose Beratung anfragen
                  </Button>
                  <p className="text-[10px] text-center text-[hsl(215,16%,47%)]">
                    Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten gemäß unserer{' '}
                    <Link to={`/website/projekt/${slug}/datenschutz`} className="underline hover:text-[hsl(220,20%,10%)]">Datenschutzerklärung</Link> zu.
                  </p>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Direct Contact */}
      {(data.landingPage.contact_email || data.landingPage.contact_phone) && (
        <div className="text-center space-y-2">
          <p className="text-sm text-[hsl(215,16%,47%)]">Oder kontaktieren Sie uns direkt:</p>
          <div className="flex items-center justify-center gap-6">
            {data.landingPage.contact_email && (
              <a href={`mailto:${data.landingPage.contact_email}`} className="flex items-center gap-2 text-sm text-[hsl(160,55%,35%)] hover:underline">
                <Mail className="h-4 w-4" />{data.landingPage.contact_email}
              </a>
            )}
            {data.landingPage.contact_phone && (
              <a href={`tel:${data.landingPage.contact_phone}`} className="flex items-center gap-2 text-sm text-[hsl(160,55%,35%)] hover:underline">
                <Phone className="h-4 w-4" />{data.landingPage.contact_phone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Powered by */}
      <div className="text-center pt-4">
        <p className="text-xs text-[hsl(215,16%,60%)]">
          Powered by <span className="font-semibold">KAUFY</span> by System of a Town
        </p>
      </div>
    </div>
  );
}
