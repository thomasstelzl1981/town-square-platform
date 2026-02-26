/**
 * ProjectLandingDatenschutz — Datenschutzerklärung
 * 
 * Falls landing_pages.privacy_text gesetzt → manueller Override
 * Sonst: Standardtext mit Verweis auf verkaufende Gesellschaft
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';

export default function ProjectLandingDatenschutz() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['project-landing-datenschutz', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: lp } = await supabase
        .from('landing_pages')
        .select('id, project_id, privacy_text, footer_company_name')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();
      if (!lp?.project_id) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, seller_name, developer_context_id')
        .eq('id', lp.project_id)
        .maybeSingle();
      if (!project) return null;

      let devContext: any = null;
      if ((project as any).developer_context_id) {
        const { data: ctx } = await supabase
          .from('developer_contexts')
          .select('name, legal_form, street, house_number, postal_code, city, email')
          .eq('id', (project as any).developer_context_id)
          .maybeSingle();
        devContext = ctx;
      }

      return { landingPage: lp, project: project as any, devContext };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" /></div>;
  if (!data) return <div className="text-center py-24"><Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" /><p className="text-[hsl(215,16%,47%)]">Nicht gefunden.</p></div>;

  const { landingPage, project, devContext } = data;
  const companyName = devContext?.name
    ? `${devContext.name}${devContext.legal_form ? ` ${devContext.legal_form}` : ''}`
    : project.seller_name || landingPage.footer_company_name || project.name;

  if (landingPage.privacy_text) {
    return (
      <div className="py-12 px-6 lg:px-10 max-w-3xl mx-auto">
        <Link to={`/website/projekt/${slug}`} className="inline-flex items-center gap-2 text-sm text-[hsl(210,80%,55%)] hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />Zurück zur Startseite
        </Link>
        <h1 className="text-3xl font-bold text-[hsl(220,20%,10%)] mb-8">Datenschutzerklärung</h1>
        <div className="prose prose-sm max-w-none text-[hsl(215,16%,47%)] whitespace-pre-line">{landingPage.privacy_text}</div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 lg:px-10 max-w-3xl mx-auto">
      <Link to={`/website/projekt/${slug}`} className="inline-flex items-center gap-2 text-sm text-[hsl(210,80%,55%)] hover:underline mb-8">
        <ArrowLeft className="h-4 w-4" />Zurück zur Startseite
      </Link>

      <h1 className="text-3xl font-bold text-[hsl(220,20%,10%)] mb-8">Datenschutzerklärung</h1>

      <div className="space-y-6 text-sm text-[hsl(215,16%,47%)] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-3">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
            <strong>{companyName}</strong>
            {devContext && (
              <>
                <br />{[devContext.street, devContext.house_number].filter(Boolean).join(' ')}
                <br />{[devContext.postal_code, devContext.city].filter(Boolean).join(' ')}
                {devContext.email && <><br />E-Mail: {devContext.email}</>}
              </>
            )}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-3">2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p>
            Beim Besuch dieser Website werden automatisch Informationen allgemeiner Natur erfasst (sog. Server-Logfiles).
            Diese umfassen u.a. den verwendeten Webbrowser, das Betriebssystem, den Domainnamen Ihres Internet-Service-Providers
            sowie die IP-Adresse. Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. f DSGVO auf Basis unseres berechtigten
            Interesses an der Sicherstellung eines störungsfreien Betriebs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-3">3. Kontaktformular</h2>
          <p>
            Wenn Sie uns über das Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben (Name, E-Mail-Adresse, Telefon, 
            Nachricht) zum Zwecke der Bearbeitung der Anfrage und für den Fall von Anschlussfragen gespeichert. 
            Diese Daten werden an den Vertriebspartner KAUFY (System of a Town GmbH) weitergeleitet, der die Beratung durchführt.
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-3">4. Finanzierungsanfragen</h2>
          <p>
            Bei Nutzung des Finanzierungsformulars werden die eingegebenen personenbezogenen und finanziellen Daten 
            (Einkommen, Vermögenswerte, Beschäftigungsverhältnis) an die FutureRoom Plattform der System of a Town GmbH 
            zur Vorprüfung und Vermittlung übermittelt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-3">5. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO),
            Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch (Art. 21 DSGVO).
            Wenden Sie sich hierzu an die im Impressum genannte Stelle.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-3">6. Vertriebspartner</h2>
          <p>
            Der Vertrieb dieser Immobilien erfolgt durch KAUFY, eine Marke der System of a Town GmbH. 
            Daten, die über das Kontaktformular oder die Finanzierungsanfrage übermittelt werden, werden zur 
            Durchführung der Beratung und Vermittlung an die System of a Town GmbH weitergegeben.
          </p>
        </section>
      </div>
    </div>
  );
}
