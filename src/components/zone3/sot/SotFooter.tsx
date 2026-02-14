/**
 * SoT Footer — Dark Premium Footer
 */
import { Link } from 'react-router-dom';
import { Building2, Github, Linkedin, Twitter } from 'lucide-react';

const footerLinks = {
  plattform: [
    { label: 'Real Estate', href: '/website/sot/real-estate' },
    { label: 'Capital', href: '/website/sot/capital' },
    { label: 'Projects', href: '/website/sot/projects' },
    { label: 'Management', href: '/website/sot/management' },
    { label: 'Energy', href: '/website/sot/energy' },
  ],
  ressourcen: [
    { label: 'Karriere', href: '/website/sot/karriere' },
    { label: 'Preise', href: '/website/sot/preise' },
    { label: 'FAQ', href: '/website/sot/faq' },
  ],
  rechtliches: [
    { label: 'Impressum', href: '/website/sot/impressum' },
    { label: 'Datenschutz', href: '/website/sot/datenschutz' },
    { label: 'AGB', href: '/website/sot/agb' },
  ],
};

export function SotFooter() {
  return (
    <footer className="border-t border-[hsl(var(--z3-border))] bg-[hsl(var(--z3-card))]">
      <div className="zone3-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/website/sot" className="flex items-center gap-2.5 mb-4">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--z3-accent))' }}
              >
                <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--z3-background))' }} />
              </div>
              <span className="font-bold">System of a Town</span>
            </Link>
            <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
              Die Plattform für Kapitalanlage, Projekte und Finanzierung.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-[hsl(var(--z3-secondary))] flex items-center justify-center hover:bg-[hsl(var(--z3-muted))] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-[hsl(var(--z3-secondary))] flex items-center justify-center hover:bg-[hsl(var(--z3-muted))] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-[hsl(var(--z3-secondary))] flex items-center justify-center hover:bg-[hsl(var(--z3-muted))] transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Plattform</h4>
            <ul className="space-y-2.5">
              {footerLinks.plattform.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm hover:text-[hsl(var(--z3-accent))] transition-colors"
                    style={{ color: 'hsl(var(--z3-muted-foreground))' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Ressourcen</h4>
            <ul className="space-y-2.5">
              {footerLinks.ressourcen.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm hover:text-[hsl(var(--z3-accent))] transition-colors"
                    style={{ color: 'hsl(var(--z3-muted-foreground))' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2.5">
              {footerLinks.rechtliches.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-sm hover:text-[hsl(var(--z3-accent))] transition-colors"
                    style={{ color: 'hsl(var(--z3-muted-foreground))' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-[hsl(var(--z3-border))] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            © {new Date().getFullYear()} System of a Town. Alle Rechte vorbehalten.
          </p>
          <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
            Made with ✦ in Germany
          </p>
        </div>
      </div>
    </footer>
  );
}