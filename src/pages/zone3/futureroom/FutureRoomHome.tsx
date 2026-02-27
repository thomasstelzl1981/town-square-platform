/**
 * FutureRoomHome — Landing Page für Finanzierungsorchestrierung
 * 
 * Fokus: Digitale Orchestrierung, nicht Vermittlung
 * KI-gestützte Aufbereitung, Online-Antragstellung, fertige Finanzierungsordner
 */
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ChevronRight, Shield, Clock, CheckCircle2, 
  TrendingUp, Building2, Users, Sparkles, FileText,
  Bot, FolderSync, Workflow, ArrowRight, Landmark
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Brand } from '@/components/ui/brand';

export default function FutureRoomHome() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);
  const features = [
    {
      icon: <Workflow className="h-6 w-6" />,
      title: 'Digitale Orchestrierung',
      description: 'Wir steuern den gesamten Prozess — von der Anfrage bis zur Auszahlung. Kein Vermittler, sondern Ihr Partner.',
    },
    {
      icon: <FolderSync className="h-6 w-6" />,
      title: 'Fertiger Finanzierungsordner',
      description: 'Immer aktuelle, bankfertige Unterlagen aus unserem System. Selbstauskunft, Dokumente, alles digital.',
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: 'KI-gestützte Aufbereitung',
      description: 'Automatische Dokumentenprüfung und -aufbereitung. Wir finden den richtigen Weg für Ihre Situation.',
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Online-Antragstellung',
      description: 'Komplett digitaler Prozess. Keine Papierberge, keine Wartezeiten. Einreichen per Klick.',
    },
  ];

  const stats = [
    { value: '100%', label: 'Digital' },
    { value: '400+', label: 'Bankpartner' },
    { value: '48h', label: 'Ersteinschätzung' },
    { value: '24/7', label: 'Status-Tracking' },
  ];

  const processSteps = [
    { 
      step: '1', 
      title: 'Anfrage stellen', 
      description: 'Füllen Sie Ihre Selbstauskunft digital aus — direkt auf unserer Website oder aus einem Immobilienexposé heraus.' 
    },
    { 
      step: '2', 
      title: 'Vorprüfung erhalten', 
      description: 'Sofortige Kapitaldienstfähigkeits-Einschätzung — Sie sehen live, ob Ihre Finanzierung tragfähig ist.' 
    },
    { 
      step: '3', 
      title: 'Unterlagen einreichen', 
      description: 'Nach Ihrer Anfrage erhalten Sie per E-Mail einen Link zu Ihrem persönlichen Datenraum. Dort laden Sie Ihre Unterlagen sicher hoch — alternativ auch per E-Mail.' 
    },
    { 
      step: '4', 
      title: 'Finanzierung erhalten', 
      description: 'Ihr Finanzierungsmanager bereitet alles bankfertig auf und orchestriert die Einreichung bei den passenden Banken.' 
    },
  ];

  const usp = [
    {
      title: 'Keine Vermittlungsplattform',
      description: 'Wir sind nicht ProHyp oder Interhyp. Wir orchestrieren — mit eigenem System, eigenen Finanzierungsmanagern und direkten Bankbeziehungen.',
    },
    {
      title: 'Früher ansetzen',
      description: 'Schon bei der Selbstauskunft helfen wir. Korrekte Daten, vollständige Unterlagen, optimale Aufbereitung — bevor es zur Bank geht.',
    },
    {
      title: 'Volle Transparenz',
      description: 'Verfolgen Sie jeden Schritt online. Sehen Sie den Status Ihrer Anfrage in Echtzeit. Keine Blackbox.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="fr-hero">
        <div className="fr-hero-content">
          <div className="fr-hero-badge">
            <Sparkles className="h-4 w-4" />
            Digitale Finanzierungsorchestrierung
          </div>
          <h1 className="fr-hero-title">
            Immobilienfinanzierung.{' '}
            <span className="highlight">Neu gedacht.</span>
          </h1>
          <p className="fr-hero-subtitle">
            Wir orchestrieren Ihre Finanzierung von Anfang an — KI-gestützte Aufbereitung, 
            vollständige Finanzierungsordner, direkte Bankeinreichung. Alles digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isLoggedIn ? "/website/futureroom/akte" : "/website/futureroom/bonitat"}>
              <button className="fr-btn fr-btn-primary text-lg px-8">
                {isLoggedIn ? 'Meine Akte öffnen' : 'Finanzierung starten'}
                <ChevronRight className="h-5 w-5" />
              </button>
            </Link>
            <Link to="/website/futureroom/karriere">
              <button className="fr-btn fr-btn-outline text-lg px-8">
                Finanzierungsmanager werden
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="fr-stats-bar">
        <div className="fr-stats-grid">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="fr-stat-value">{stat.value}</div>
              <div className="fr-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="fr-section">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Warum <Brand>FutureRoom</Brand>?</h2>
          <p className="fr-section-subtitle">
            Wir sind keine klassische Vermittlungsplattform. Wir orchestrieren den gesamten 
            Finanzierungsprozess mit modernster Technologie.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="fr-card">
              <div className="fr-card-icon">
                {feature.icon}
              </div>
              <h3 className="fr-card-title">{feature.title}</h3>
              <p className="fr-card-text">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USP Section */}
      <section className="fr-process">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Was uns unterscheidet</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {usp.map((item, index) => (
            <div key={index} className="fr-card text-center">
              <h3 className="fr-card-title mb-3">{item.title}</h3>
              <p className="fr-card-text">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="fr-section">
        <div className="fr-section-header">
          <h2 className="fr-section-title">So einfach funktioniert's</h2>
          <p className="fr-section-subtitle">
            Vier Schritte zu Ihrer Finanzierung — wir begleiten Sie bei jedem.
          </p>
        </div>
        <div className="fr-process-steps">
          {processSteps.map((item, index) => (
            <div key={index} className="fr-process-step">
              <div className="fr-process-number">{item.step}</div>
              <h3 className="fr-process-title">{item.title}</h3>
              <p className="fr-process-text">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Finanzierungsmanager Teaser */}
      <section className="fr-section">
        <div className="fr-card" style={{ background: 'linear-gradient(135deg, hsl(165 70% 36% / 0.08) 0%, hsl(158 64% 52% / 0.05) 100%)', borderColor: 'hsl(165 70% 36% / 0.2)' }}>
          <div className="flex flex-col md:flex-row items-center gap-8 p-4">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(165 70% 36%) 0%, hsl(158 64% 52%) 100%)' }}>
                <Users className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2" style={{ color: 'hsl(210 30% 15%)' }}>
                Werden Sie Finanzierungsmanager
              </h3>
              <p className="text-gray-600 mb-4">
                Sie haben eine §34i-Zulassung und wollen mit modernem Tooling arbeiten? 
                Übernehmen Sie Finanzierungsfälle aus unserem System und profitieren Sie von 
                fertigen Unterlagen und direkten Bankzugängen.
              </p>
              <Link to="/website/futureroom/karriere">
                <button className="fr-btn fr-btn-outline-light">
                  Mehr erfahren
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KI-Power Section */}
      <section className="fr-section">
        <div className="fr-section-header">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ background: 'hsl(165 70% 36% / 0.1)', color: 'hsl(165 70% 36%)' }}>
            <Sparkles className="h-3.5 w-3.5" /> Powered by Gemini 2.5 Pro & GPT-5
          </div>
          <h2 className="fr-section-title">KI-Power hinter FutureRoom</h2>
          <p className="fr-section-subtitle">
            Unsere KI automatisiert, was früher Wochen dauerte — damit Ihre Finanzierung schneller steht.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Bot className="h-6 w-6" />, title: 'Selbstauskunft in 2 Min.', desc: 'KI befüllt Ihre Selbstauskunft automatisch aus hochgeladenen Dokumenten.' },
            { icon: <FileText className="h-6 w-6" />, title: 'Dokument-Erkennung', desc: 'Gemini 2.5 Pro erkennt und klassifiziert Gehaltsabrechnungen, Kontoauszüge & mehr.' },
            { icon: <TrendingUp className="h-6 w-6" />, title: 'Kapitaldienstprüfung', desc: 'Sofortige Tragfähigkeitsanalyse mit 35+ Berechnungs-Engines.' },
            { icon: <Landmark className="h-6 w-6" />, title: '400+ Bankpartner', desc: 'KI-gestützte Vorauswahl der passenden Banken für Ihr Profil.' },
          ].map((item, i) => (
            <div key={i} className="fr-card">
              <div className="fr-card-icon">{item.icon}</div>
              <h3 className="fr-card-title">{item.title}</h3>
              <p className="fr-card-text">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="fr-cta">
        <div className="fr-cta-content">
          <h2 className="fr-cta-title">Bereit für Ihre Finanzierung?</h2>
          <p className="fr-cta-text">
            Starten Sie jetzt Ihre digitale Finanzierungsanfrage. 
            Kostenlos, unverbindlich und vollständig online.
          </p>
          <Link to={isLoggedIn ? "/website/futureroom/akte" : "/website/futureroom/bonitat"}>
            <button className="fr-btn fr-btn-primary">
              Jetzt starten
              <ChevronRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
