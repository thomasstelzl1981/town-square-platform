/**
 * SoT Plattform — Eine Plattform ersetzt 20 Einzellösungen
 */
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Brain, X, Sparkles, Cpu } from 'lucide-react';
import { SOT_WEBSITE_MODULES } from '@/data/sotWebsiteModules';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';
import { SotCTA } from '@/components/zone3/sot';
import * as Icons from 'lucide-react';

/* Modules that are KI-powered with what the KI does */
const KI_MODULES: Record<string, string> = {
  'MOD-02': 'E-Mails & Texte generieren mit GPT-5',
  'MOD-03': 'Dokumentenerkennung & Auto-Kategorisierung',
  'MOD-04': 'Exposé-Extraktion & Objektanalyse',
  'MOD-07': 'Selbstauskunft automatisch befüllen',
  'MOD-14': 'KI-Textgenerierung & E-Mail-Serien',
  'MOD-05': 'NK-Beleg-Parsing & Zuordnung',
  'MOD-13': 'Magic Intake — Projektdaten aus Dokumenten',
  'MOD-08': 'Renditeberechnung & Marktanalyse',
  'MOD-18': 'Cashflow-Prognosen & Szenarien',
};

const replacedTools = [
  { name: 'Excel-Listen', desc: 'für Finanzen & Objekte' },
  { name: 'Papierordner', desc: 'für Verträge & Dokumente' },
  { name: 'Separate E-Mail-Tools', desc: 'für Kommunikation' },
  { name: 'Maklersoftware', desc: 'für Verkauf & Inserate' },
  { name: 'Cloud-Speicher', desc: 'für Dokumente' },
  { name: 'Fahrtenbuch-Apps', desc: 'für den Fuhrpark' },
];

// Area definitions mapping modules to areas
const areaDefinitions = [
  {
    key: 'client',
    label: 'CLIENT',
    title: 'Ihr Vermögen',
    subtitle: 'Finanzen, Immobilien, Finanzierung und Investments — strukturiert verwalten, intelligent analysieren, fundiert entscheiden.',
    moduleCodes: ['MOD-18', 'MOD-04', 'MOD-07', 'MOD-02', 'MOD-06', 'MOD-08'],
    accentColor: 'hsl(217 91% 60%)',
  },
  {
    key: 'service',
    label: 'SERVICE',
    title: 'Ihr Betrieb',
    subtitle: 'Fuhrpark, Energie, Kommunikation, Fortbildung und Einkauf — alles, was Ihr Unternehmen am Laufen hält. Digital statt analog.',
    moduleCodes: ['MOD-17', 'MOD-19', 'MOD-15', 'MOD-05', 'MOD-16', 'MOD-14'],
    accentColor: 'hsl(160 60% 45%)',
  },
  {
    key: 'base',
    label: 'BASE',
    title: 'Ihr Fundament',
    subtitle: 'Dokumente, Kontakte und KI-Intelligenz — das digitale Rückgrat. Einmal aufgebaut, überall verfügbar.',
    moduleCodes: ['MOD-03', 'MOD-01'],
    accentColor: 'hsl(275 45% 50%)',
    extraModules: [
      {
        name: 'Armstrong Intelligence',
        tagline: 'Ihr KI-Co-Pilot.',
        description: 'Armstrong liest Ihren gesamten Datenraum, beantwortet Fragen zu Ihren Dokumenten, generiert Texte und automatisiert Workflows — ohne manuelles Hochladen.',
        painPoints: ['KI-Tools kennen Ihre Daten nicht', 'Manuelles Hochladen bei jeder Frage', 'Keine Verbindung zwischen KI und Ihrem Datenraum'],
        features: ['Datenraum-Extraktion', 'Magic Intake', 'Dokumentenanalyse', 'Textgenerierung', 'Web-Recherche'],
        icon: 'Brain',
      },
    ],
  },
];

function getIcon(iconName: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Users: Icons.Users, Sparkles: Icons.Sparkles, FolderOpen: Icons.FolderOpen,
    Building2: Icons.Building2, Globe: Icons.Globe, FolderKanban: Icons.FolderKanban,
    Sun: Icons.Sun, Landmark: Icons.Landmark, TrendingUp: Icons.TrendingUp,
    Tag: Icons.Tag, Search: Icons.Search, Mail: Icons.Mail,
    GraduationCap: Icons.GraduationCap, ShoppingCart: Icons.ShoppingCart,
    Car: Icons.Car, Home: Icons.Home, Brain: Icons.Brain,
  };
  return iconMap[iconName] || Icons.FileText;
}

export default function SotPlattform() {
  const { ref, isVisible } = useSotScrollAnimation();
  const { ref: replaceRef, isVisible: replaceVisible } = useSotScrollAnimation();

  return (
    <div>
      {/* Hero */}
      <section className="py-20 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div className="zone3-container relative z-10 text-center">
          <div className={`sot-fade-in ${isVisible ? 'visible' : ''}`} ref={ref}>
            <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
              Plattform
            </span>
            <h1 className="sot-display mb-6">
              Eine Plattform ersetzt<br />20 Einzellösungen.
            </h1>
            <p className="sot-subheadline max-w-3xl mx-auto mb-10">
              Von der Finanzanalyse bis zum Fuhrpark, vom Dokumentenmanagement bis zur KI-Assistenz — 
              System of a Town bringt alles in ein System. <strong>Powered by Gemini 2.5 Pro & GPT-5.</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth?mode=register&source=sot" className="sot-btn-primary">
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/website/sot/intelligenz" className="sot-btn-secondary">
                <Brain className="w-4 h-4" />
                Armstrong Intelligence
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What you DON'T need anymore */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className={`sot-fade-in ${replaceVisible ? 'visible' : ''}`} ref={replaceRef}>
            <div className="text-center mb-10">
              <h2 className="sot-headline">Was Sie nicht mehr brauchen</h2>
              <p className="sot-subheadline mt-3 max-w-xl mx-auto">
                System of a Town ersetzt fragmentierte Einzellösungen durch ein einheitliches System.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {replacedTools.map((tool) => (
                <div key={tool.name} className="sot-glass-card p-4 text-center relative">
                  <div className="absolute top-2 right-2">
                    <X className="w-3.5 h-3.5 text-red-400/60" />
                  </div>
                  <p className="text-sm font-medium line-through decoration-red-400/40">{tool.name}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Areas */}
      {areaDefinitions.map((area) => {
        const areaModules = area.moduleCodes
          .map(code => SOT_WEBSITE_MODULES.find(m => m.code === code))
          .filter(Boolean);

        return (
          <AreaSection key={area.key} area={area} modules={areaModules as typeof SOT_WEBSITE_MODULES} />
        );
      })}

      {/* Connecting Element */}
      <section className="py-12 lg:py-16" style={{ backgroundColor: 'hsl(var(--z3-card))' }}>
        <div className="zone3-container">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="sot-headline mb-6">Alle Module arbeiten zusammen</h3>
            <p className="sot-subheadline mb-8">
              Daten fließen automatisch zwischen Bereichen. Ein Dokument im DMS ist automatisch 
              bei der richtigen Immobilie. Ein Kontakt erscheint in allen relevanten Kontexten. 
              Armstrong kennt alles.
            </p>
            <Link to="/website/sot/intelligenz" className="sot-btn-primary">
              Armstrong Intelligence entdecken
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <SotCTA
        title="Bereit für eine Plattform statt 15 Tools?"
        subtitle="Starten Sie kostenlos — kein Abo, keine Grundgebühr, sofort einsatzbereit."
        variant="gradient"
      />
    </div>
  );
}

function AreaSection({ area, modules }: { area: typeof areaDefinitions[0]; modules: typeof SOT_WEBSITE_MODULES }) {
  const { ref, isVisible } = useSotScrollAnimation();
  const allModules = [
    ...modules.map(m => ({
      code: m.code,
      name: m.name,
      tagline: m.tagline,
      description: m.description,
      painPoints: m.painPoints,
      features: m.features,
      icon: m.icon,
    })),
    ...(area.extraModules || []).map(em => ({ ...em, code: '' })),
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="zone3-container">
        <div className={`sot-fade-in ${isVisible ? 'visible' : ''}`} ref={ref}>
          <div className="flex items-center gap-3 mb-2">
            <span 
              className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ backgroundColor: `${area.accentColor} / 0.1)`.replace(')', ''), color: area.accentColor }}
            >
              {area.label}
            </span>
          </div>
          <h2 className="sot-headline mb-3">{area.title}</h2>
          <p className="sot-subheadline mb-10 max-w-2xl">{area.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allModules.map((mod, idx) => {
            const ModIcon = getIcon(mod.icon);
            return (
              <div 
                key={mod.name} 
                className={`sot-module-card sot-fade-in ${isVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}
                  >
                    <ModIcon className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{mod.name}</h3>
                    <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{mod.tagline}</p>
                  </div>
                </div>
                <p className="text-sm mb-4" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                  {mod.description}
                </p>
                
                {/* Pain Points */}
                <div className="mb-4 space-y-1.5">
                  {mod.painPoints.map((pp) => (
                    <p key={pp} className="text-xs flex items-start gap-2" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                      <span className="text-red-400 mt-0.5">✗</span>
                      {pp}
                    </p>
                  ))}
                </div>

                {/* KI Badge */}
                {KI_MODULES[mod.code] && (
                  <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                    style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)', color: 'hsl(var(--z3-accent))' }}>
                    <Sparkles className="w-3 h-3" />
                    KI-powered — {KI_MODULES[mod.code]}
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {mod.features.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.08)', color: 'hsl(var(--z3-accent))' }}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
