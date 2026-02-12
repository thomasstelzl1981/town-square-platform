/**
 * FutureRoomKarriere — Finanzierungsmanager Recruiting Page
 * 
 * Fokus: Rolle im System, fertiges Tooling, Orchestrierung
 * Keine klassische Vermittlung, sondern Systemarbeit
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, TrendingUp, Users, Building2, 
  Award, Clock, Wallet, Laptop, FolderCheck, 
  Workflow, ShieldCheck, ArrowRight, CheckCircle2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export default function FutureRoomKarriere() {
  const benefits = [
    {
      icon: <FolderCheck className="h-6 w-6" />,
      title: 'Fertige Finanzierungsordner',
      description: 'Übernehmen Sie Fälle mit vollständig aufbereiteten Unterlagen — Selbstauskunft, Dokumente, alles geprüft.',
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Direkter Bankzugang',
      description: 'Arbeiten Sie in unserem System mit direkten Schnittstellen zu über 400 Bankpartnern.',
    },
    {
      icon: <Laptop className="h-6 w-6" />,
      title: 'Modernes Tooling',
      description: 'Unser Portal unterstützt Sie bei Einreichung, Tracking und Kommunikation — alles an einem Ort.',
    },
    {
      icon: <Workflow className="h-6 w-6" />,
      title: 'Orchestrierte Prozesse',
      description: 'Keine Medienbrüche. Von der Anfrage bis zur Auszahlung — durchgängig digital.',
    },
  ];

  const roleDetails = [
    {
      title: 'Was Sie tun',
      items: [
        'Finanzierungsfälle aus dem FutureRoom-System übernehmen',
        'Bankfertige Unterlagen bei passenden Instituten einreichen',
        'Kunden während des Prozesses begleiten und beraten',
        'Status und Fortschritt im Portal dokumentieren',
      ],
    },
    {
      title: 'Was Sie bekommen',
      items: [
        'Fälle mit vollständig aufbereiteten Unterlagen',
        'KI-gestützte Unterstützung bei der Bankauswahl',
        'Transparentes Provisionsmodell',
        'Flexibles Arbeiten — Sie entscheiden, welche Fälle Sie übernehmen',
      ],
    },
  ];

  const requirements = [
    'IHK-Zulassung als Immobiliardarlehensvermittler (§34i GewO)',
    'Erfahrung in der Baufinanzierung oder Bereitschaft zur Einarbeitung',
    'Affinität zu digitalen Tools und Prozessen',
    'Kundenorientierte, eigenständige Arbeitsweise',
  ];

  // Application form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    has34i: '',
    experience: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.has34i) {
      toast.error('Bitte füllen Sie die Pflichtfelder aus.');
      return;
    }
    setIsSubmitting(true);
    // Simulate submission (no backend yet)
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Bewerbung erfolgreich gesendet! Wir melden uns innerhalb von 48 Stunden.');
    setFormData({ name: '', email: '', phone: '', has34i: '', experience: '', message: '' });
    setIsSubmitting(false);
  };

  const scrollToForm = () => {
    document.getElementById('bewerbungsformular')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero */}
      <section className="fr-hero">
        <div className="fr-hero-content">
          <div className="fr-hero-badge">
            <Users className="h-4 w-4" />
            Karriere bei FutureRoom
          </div>
          <h1 className="fr-hero-title">
            Werden Sie{' '}
            <span className="highlight">Finanzierungsmanager</span>
          </h1>
          <p className="fr-hero-subtitle">
            Übernehmen Sie vorbereitete Finanzierungsfälle aus unserem System. 
            Profitieren Sie von fertigen Unterlagen, direkten Bankzugängen und modernem Tooling.
          </p>
          <button onClick={scrollToForm} className="fr-btn fr-btn-primary text-lg">
            Jetzt bewerben
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="fr-section">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Ihre Vorteile</h2>
          <p className="fr-section-subtitle">
            Als Finanzierungsmanager bei FutureRoom arbeiten Sie nicht wie bei klassischen Vermittlern.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="fr-card">
              <div className="fr-card-icon">
                {benefit.icon}
              </div>
              <h3 className="fr-card-title">{benefit.title}</h3>
              <p className="fr-card-text">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Details */}
      <section className="fr-process">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Die Rolle im Detail</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {roleDetails.map((section, index) => (
            <div key={index} className="fr-card">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'hsl(165 70% 36%)' }}>
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(165 70% 36%)' }} />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* System Preview */}
      <section className="fr-section">
        <div className="fr-card" style={{ background: 'linear-gradient(135deg, hsl(210 35% 8%) 0%, hsl(210 30% 15%) 100%)', borderColor: 'transparent' }}>
          <div className="text-center py-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Arbeiten im FutureRoom-System
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Unser Portal bietet Ihnen alles, was Sie brauchen: Fallübersicht, Dokumenten-Viewer, 
              Bank-Schnittstellen, Kundenkommunikation und Status-Tracking — integriert und effizient.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                📋 Fallmanagement
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                📁 Dokumente
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                🏦 Bankzugang
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                💬 Kommunikation
              </div>
              <div className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                📊 Reporting
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="fr-process">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Anforderungen</h2>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="fr-card">
            <ul className="space-y-4">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(165 70% 36% / 0.1)' }}>
                    <ShieldCheck className="h-4 w-4" style={{ color: 'hsl(165 70% 36%)' }} />
                  </div>
                  <span className="text-gray-700 pt-1">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="bewerbungsformular" className="fr-section">
        <div className="fr-section-header">
          <h2 className="fr-section-title">Bewerbungsformular</h2>
          <p className="fr-section-subtitle">
            Füllen Sie das Formular aus — wir melden uns innerhalb von 48 Stunden.
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="fr-card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Max Mustermann"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(165,70%,36%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="max@beispiel.de"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(165,70%,36%)] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+49 123 456 789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(165,70%,36%)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    §34i GewO Zulassung <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="has34i"
                    value={formData.has34i}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(165,70%,36%)] focus:border-transparent"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="yes">Ja, vorhanden</option>
                    <option value="in_progress">In Beantragung</option>
                    <option value="no">Nein, nicht vorhanden</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Erfahrung in der Baufinanzierung
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(165,70%,36%)] focus:border-transparent"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="none">Keine / Quereinsteiger</option>
                  <option value="1-3">1–3 Jahre</option>
                  <option value="3-5">3–5 Jahre</option>
                  <option value="5+">Mehr als 5 Jahre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nachricht (optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Erzählen Sie uns kurz etwas über sich..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(165,70%,36%)] focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="fr-btn fr-btn-primary w-full justify-center"
              >
                {isSubmitting ? (
                  'Wird gesendet...'
                ) : (
                  <>
                    Bewerbung absenden
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fr-cta">
        <div className="fr-cta-content">
          <h2 className="fr-cta-title">Bereit für den nächsten Schritt?</h2>
          <p className="fr-cta-text">
            Bewerben Sie sich als Finanzierungsmanager und werden Sie Teil des FutureRoom-Netzwerks.
          </p>
          <button onClick={scrollToForm} className="fr-btn fr-btn-primary">
            Bewerbung starten
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
