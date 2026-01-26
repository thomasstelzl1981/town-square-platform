import { FileText, MessageCircle, Calculator, Ticket, ClipboardList, Bell } from 'lucide-react';

export default function MietyLeistungen() {
  const services = [
    {
      icon: FileText,
      title: 'Dokumentenmanagement',
      description: 'Alle wichtigen Unterlagen digital und sicher an einem Ort.',
    },
    {
      icon: MessageCircle,
      title: 'Mieterkommunikation',
      description: 'Nachrichten, Anfragen und Updates in einer zentralen Inbox.',
    },
    {
      icon: Calculator,
      title: 'Nebenkostenabrechnungen',
      description: 'Transparente Abrechnungen zum Download.',
    },
    {
      icon: Ticket,
      title: 'Service-Tickets',
      description: 'Reparaturen und Anliegen einfach melden und nachverfolgen.',
    },
    {
      icon: ClipboardList,
      title: 'Vertragsübersicht',
      description: 'Mietverträge und Konditionen jederzeit einsehen.',
    },
    {
      icon: Bell,
      title: 'Benachrichtigungen',
      description: 'Wichtige Updates per E-Mail oder Push-Nachricht.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Was Miety für Sie leistet
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Modulare Services für moderne Immobilienverwaltung.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="zone3-grid-3">
            {services.map((service) => (
              <div key={service.title} className="zone3-card p-8">
                <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                  <service.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="zone3-heading-3 mb-4">{service.title}</h3>
                <p className="zone3-text-small">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
