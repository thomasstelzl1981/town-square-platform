/**
 * MasterDataGrid — Erfassungsakten link cards
 * R-18 sub-component
 */
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, FileText, FolderKanban, ChevronRight } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

const AKTEN = [
  { to: '/admin/masterdata/immobilienakte', icon: Building2, title: 'Immobilienakte', desc: 'MOD-04 • 10 Blöcke (A–J) • 106 Felder' },
  { to: '/admin/masterdata/selbstauskunft', icon: FileText, title: 'Selbstauskunft', desc: 'MOD-07 • 9 Sektionen • 67 Felder' },
  { to: '/admin/masterdata/projektakte', icon: FolderKanban, title: 'Projektakte', desc: 'MOD-13 • 10 Blöcke (A–J) • 91 Felder' },
  { to: '/admin/masterdata/fahrzeugakte', title: 'Fahrzeugakte', desc: 'MOD-17 • 9 Blöcke (A–I) • 47 Felder', svgPath: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2|M7 17a2 2 0 100-4 2 2 0 000 4z|M9 17h6|M17 17a2 2 0 100-4 2 2 0 000 4z' },
  { to: '/admin/masterdata/photovoltaikakte', title: 'Photovoltaikakte', desc: 'MOD-19 • 7 Blöcke (A–G) • 45 Felder', svgPath: 'M12 2v2|M12 20v2|m-7.07-14.07 1.41 1.41|m12.73 12.73 1.41 1.41|M2 12h2|M20 12h2|m-16.66 5.66-1.41 1.41|m14.14-14.14-1.41 1.41' },
  { to: '/admin/masterdata/finanzierungsakte', title: 'Finanzierungsakte', desc: 'MOD-11 • 8 Blöcke (A–H) • 55 Felder', svgPath: 'M12 1v22|M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { to: '/admin/masterdata/versicherungsakte', title: 'Versicherungsakte', desc: 'MOD-11 • 7 Blöcke (A–G) • 25 Felder', svgPath: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z' },
  { to: '/admin/masterdata/vorsorgeakte', title: 'Vorsorgeakte', desc: 'MOD-11 • 6 Blöcke (A–F) • 21 Felder', svgPath: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' },
  { to: '/admin/masterdata/personenakte', title: 'Personenakte', desc: 'MOD-01 • 8 Blöcke (A–H) • 36 Felder', svgPath: 'M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2|M12 7a4 4 0 100-8 4 4 0 000 8z' },
  { to: '/admin/masterdata/haustierakte', title: 'Haustierakte', desc: 'MOD-05 • 5 Blöcke (A–E) • 19 Felder', svgPath: 'M11 4a2 2 0 100-4 2 2 0 000 4z|M18 8a2 2 0 100-4 2 2 0 000 4z|M20 16a2 2 0 100-4 2 2 0 000 4z|M9 10a5 5 0 015 5v3.5a3.5 3.5 0 01-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 015.5 10Z' },
];

function AkteIcon({ icon: Icon, svgPath }: { icon?: React.ComponentType<{ className?: string }>; svgPath?: string }) {
  if (Icon) return <Icon className="h-5 w-5 text-primary" />;
  if (!svgPath) return null;
  const paths = svgPath.split('|');
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
      {paths.map((d, i) => d.includes('a') || d.includes('A') ? <path key={i} d={d} /> : <path key={i} d={d} />)}
    </svg>
  );
}

export function MasterDataGrid() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">Master Data — Erfassungsakten</h2>
      <div className={DESIGN.WIDGET_GRID.FULL}>
        {AKTEN.map(a => (
          <Link key={a.to} to={a.to}>
            <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <AkteIcon icon={a.icon} svgPath={(a as any).svgPath} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <CardDescription>{a.desc}</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
