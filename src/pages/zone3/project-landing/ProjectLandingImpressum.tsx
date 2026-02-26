/**
 * ProjectLandingImpressum — Dynamic Impressum from developer_contexts
 * 
 * §5 TMG compliant: Name, Anschrift, Vertretungsberechtigter, HRB, USt-IdNr
 * Falls landing_pages.imprint_text gesetzt → manueller Override
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ProjectLandingImpressum() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['project-landing-impressum', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: lp } = await supabase
        .from('landing_pages')
        .select('id, project_id, imprint_text, footer_company_name')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();
      if (!lp?.project_id) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, developer_context_id, seller_name')
        .eq('id', lp.project_id)
        .maybeSingle();
      if (!project) return null;

      // Fetch developer_context for legal data
      let devContext: any = null;
      if ((project as any).developer_context_id) {
        const { data: ctx } = await supabase
          .from('developer_contexts')
          .select('*')
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
  const manualOverride = landingPage.imprint_text;

  return (
    <div className="py-12 px-6 lg:px-10 max-w-3xl mx-auto">
      <Link to={`/website/projekt/${slug}`} className="inline-flex items-center gap-2 text-sm text-[hsl(210,80%,55%)] hover:underline mb-8">
        <ArrowLeft className="h-4 w-4" />Zurück zur Startseite
      </Link>

      <h1 className="text-3xl font-bold text-[hsl(220,20%,10%)] mb-8">Impressum</h1>

      {manualOverride ? (
        <div className="prose prose-sm max-w-none text-[hsl(215,16%,47%)] whitespace-pre-line">
          {manualOverride}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Anbieter / Verkaufende Gesellschaft */}
          <Card className="border-[hsl(214,32%,91%)]">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-4">Angaben gemäß § 5 TMG</h2>
              {devContext ? (
                <div className="space-y-3 text-sm text-[hsl(215,16%,47%)]">
                  <p className="font-semibold text-[hsl(220,20%,10%)]">
                    {devContext.name}{devContext.legal_form ? ` ${devContext.legal_form}` : ''}
                  </p>
                  <p>
                    {[devContext.street, devContext.house_number].filter(Boolean).join(' ')}<br />
                    {[devContext.postal_code, devContext.city].filter(Boolean).join(' ')}
                  </p>
                  {devContext.managing_director && (
                    <p><strong>Vertretungsberechtigter Geschäftsführer:</strong><br />{devContext.managing_director}</p>
                  )}
                  {devContext.hrb_number && (
                    <p><strong>Registergericht:</strong> {devContext.register_court || 'Amtsgericht'}, {devContext.hrb_number}</p>
                  )}
                  {devContext.ust_id && (
                    <p><strong>USt-IdNr.:</strong> {devContext.ust_id}</p>
                  )}
                  {devContext.email && (
                    <p><strong>E-Mail:</strong> <a href={`mailto:${devContext.email}`} className="text-[hsl(210,80%,55%)] hover:underline">{devContext.email}</a></p>
                  )}
                  {devContext.phone && (
                    <p><strong>Telefon:</strong> {devContext.phone}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-sm text-[hsl(215,16%,47%)]">
                  <p className="font-semibold text-[hsl(220,20%,10%)]">
                    {project.seller_name || landingPage.footer_company_name || project.name}
                  </p>
                  <p className="italic">Weitere Angaben werden ergänzt.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vertrieb / KAUFY */}
          <Card className="border-[hsl(214,32%,91%)]">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-4">Vertrieb</h2>
              <div className="space-y-3 text-sm text-[hsl(215,16%,47%)]">
                <p className="font-semibold text-[hsl(220,20%,10%)]">KAUFY by System of a Town GmbH</p>
                <p>
                  Dieses Angebot wird im Vertrieb von KAUFY, einer Marke der System of a Town GmbH, betreut.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Haftungshinweise */}
          <Card className="border-[hsl(214,32%,91%)]">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-[hsl(220,20%,10%)] mb-4">Haftung für Inhalte</h2>
              <div className="text-sm text-[hsl(215,16%,47%)] space-y-3">
                <p>
                  Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und 
                  Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG 
                  für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                </p>
                <p>
                  Alle Angaben zu Kaufpreisen, Mieten, Renditen und Flächen sind unverbindlich. Irrtümer und Änderungen bleiben vorbehalten.
                  Maßgeblich sind die im notariellen Kaufvertrag vereinbarten Konditionen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
