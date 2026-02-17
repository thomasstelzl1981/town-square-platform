/**
 * SoT Footer — Clean, minimal footer
 */
import { Link } from 'react-router-dom';
import { Building2, Linkedin, Twitter, Github } from 'lucide-react';

const footerLinks = {
  plattform: [
    { label: 'Real Estate', href: '/website/sot/real-estate' },
    { label: 'Finance', href: '/website/sot/finance' },
    { label: 'Management', href: '/website/sot/management' },
    { label: 'Energy', href: '/website/sot/energy' },
  ],
  ressourcen: [
    { label: 'Karriere', href: '/website/sot/karriere' },
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
    <footer className="border-t border-border/40 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/website/sot" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-bold tracking-wider uppercase">System of a Town</span>
            </Link>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Der digitale Manager für Immobilien und private Finanzen.
            </p>
            <div className="flex gap-2">
              {[Linkedin, Twitter, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, links]) => (
            <div key={key}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4">{key}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} System of a Town. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ✦ in Germany
          </p>
        </div>
      </div>
    </footer>
  );
}
