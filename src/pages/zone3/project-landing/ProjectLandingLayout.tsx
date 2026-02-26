/**
 * ProjectLandingLayout — Zone 3 Website Layout for Project Landing Pages
 * 
 * Isolated from Kaufy — same visual pattern (1400px container, Inter font, light mode)
 * but completely separate data sources (dev_projects + dev_project_units)
 * 
 * Routes: /website/projekt/:slug
 */
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveStorageSignedUrl } from '@/lib/storage-url';

export default function ProjectLandingLayout() {
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: landingData } = useQuery({
    queryKey: ['project-landing-layout', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('landing_pages')
        .select(`
          id, slug, hero_headline, footer_company_name, footer_address,
          contact_email, contact_phone, status,
          dev_projects!inner (id, name, city, seller_name, developer_context_id)
        `)
        .eq('slug', slug)
        .in('status', ['draft', 'preview', 'active'])
        .maybeSingle();
      if (error) {
        console.error('Landing page fetch error:', error);
        return null;
      }

      // Fetch developer context for seller info
      let devContext: any = null;
      const project = (data as any)?.dev_projects;
      if (project?.developer_context_id) {
        const { data: ctx } = await supabase
          .from('developer_contexts')
          .select('name, legal_form')
          .eq('id', project.developer_context_id)
          .maybeSingle();
        devContext = ctx;
      }

      // Load logo from document_links
      let logoUrl: string | null = null;
      if (project?.id) {
        const { data: links } = await supabase
          .from('document_links')
          .select('slot_key, documents!inner(storage_path)')
          .eq('object_id', project.id)
          .eq('object_type', 'project')
          .eq('link_status', 'linked')
          .eq('slot_key', 'logo')
          .limit(1);

        if (links?.length) {
          const storagePath = (links[0] as any).documents?.storage_path;
          if (storagePath) {
            const { data: signedData } = await supabase.storage
              .from('tenant-documents')
              .createSignedUrl(storagePath, 3600);
            if (signedData?.signedUrl) {
              logoUrl = resolveStorageSignedUrl(signedData.signedUrl);
            }
          }
        }
      }

      return { ...data, _devContext: devContext, _logoUrl: logoUrl };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const project = (landingData as any)?.dev_projects;
  const devContext = (landingData as any)?._devContext;
  const logoUrl = (landingData as any)?._logoUrl;
  const projectName = landingData?.hero_headline || project?.name || 'Projekt';
  const sellerName = devContext
    ? `${devContext.name}${devContext.legal_form ? ` ${devContext.legal_form}` : ''}`
    : project?.seller_name || landingData?.footer_company_name || '';
  const basePath = `/website/projekt/${slug}`;

  const navLinks = useMemo(() => [
    { path: basePath, label: 'Startseite', exact: true },
    { path: `${basePath}/objekt`, label: 'Objekt' },
    { path: `${basePath}/beratung`, label: 'Beratung' },
  ], [basePath]);

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const lightModeVars: React.CSSProperties = {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',
    '--primary': '222.2 47.4% 11.2%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96.1%',
    '--secondary-foreground': '222.2 47.4% 11.2%',
    '--muted': '210 40% 96.1%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '210 40% 96.1%',
    '--accent-foreground': '222.2 47.4% 11.2%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '222.2 84% 4.9%',
    colorScheme: 'light',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[hsl(210,40%,97%)] light" data-theme="light" style={lightModeVars}>
      <div className="kaufy2026-container">
        {/* Header */}
        <header className="kaufy2026-header">
          <div className="flex items-center justify-between h-16 px-6 lg:px-10">
            <Link to={basePath} className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 w-auto max-w-[120px] object-contain"
                />
              )}
              <span className="text-xl font-bold text-[hsl(220,20%,10%)] truncate max-w-[200px] lg:max-w-none">
                {projectName}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                    isActive(link.path, link.exact)
                      ? "bg-[hsl(220,20%,10%)] text-white"
                      : "text-[hsl(220,20%,10%)] hover:bg-[hsl(210,30%,95%)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to={`${basePath}/beratung`}>
                <Button size="sm" className="rounded-full bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)]">
                  Beratung anfragen
                </Button>
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden border-t px-6 py-4 space-y-2 bg-white">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.path, link.exact)
                      ? "bg-[hsl(220,20%,10%)] text-white"
                      : "text-[hsl(220,20%,10%)] hover:bg-[hsl(210,30%,95%)]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t">
                <Link to={`${basePath}/beratung`} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Beratung anfragen</Button>
                </Link>
              </div>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="kaufy2026-main">
          <Outlet context={{ landingData, slug }} />
        </main>

        {/* Footer */}
        <footer className="kaufy2026-footer">
          <div className="px-6 lg:px-10 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-6 w-auto max-w-[100px] object-contain" />
                  )}
                  <span className="text-xl font-bold text-[hsl(220,20%,10%)]">{projectName}</span>
                </div>
                {sellerName && (
                  <p className="mt-2 text-sm text-[hsl(215,16%,47%)]">
                    Ein Angebot der {sellerName}
                  </p>
                )}
                <p className="mt-1 text-xs text-[hsl(215,16%,47%)]">
                  Vertrieb: KAUFY by System of a Town
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Navigation</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  {navLinks.map(link => (
                    <li key={link.path}>
                      <Link to={link.path} className="hover:text-[hsl(220,20%,10%)] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[hsl(220,20%,10%)] mb-4 text-sm uppercase tracking-wide">Rechtliches</h4>
                <ul className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
                  <li>
                    <Link to={`${basePath}/impressum`} className="hover:text-[hsl(220,20%,10%)] transition-colors">
                      Impressum
                    </Link>
                  </li>
                  <li>
                    <Link to={`${basePath}/datenschutz`} className="hover:text-[hsl(220,20%,10%)] transition-colors">
                      Datenschutzerklärung
                    </Link>
                  </li>
                  {landingData?.contact_email && (
                    <li>
                      <a href={`mailto:${landingData.contact_email}`} className="hover:text-[hsl(220,20%,10%)] transition-colors">
                        {landingData.contact_email}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-[hsl(210,20%,90%)] flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[hsl(215,16%,47%)]">
                © {new Date().getFullYear()} {sellerName || projectName}
              </p>
              <div className="flex items-center gap-4 text-xs text-[hsl(215,16%,47%)]">
                <Link to={`${basePath}/impressum`} className="hover:underline">Impressum</Link>
                <Link to={`${basePath}/datenschutz`} className="hover:underline">Datenschutz</Link>
                <span>Powered by <strong>KAUFY</strong></span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
