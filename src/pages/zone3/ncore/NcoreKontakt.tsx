import { Helmet } from 'react-helmet';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function NcoreKontakt() {
  return (
    <>
      <Helmet>
        <title>Kontakt — Ncore Business Consulting</title>
        <meta name="description" content="Kontaktieren Sie Ncore Business Consulting für ein unverbindliches Erstgespräch zu Digitalisierung, Stiftungen oder Geschäftsmodellen." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Kontakt — Ncore Business Consulting",
          "url": "https://ncore.online/kontakt",
        })}</script>
      </Helmet>

      <section className="py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            <span className="text-emerald-400">Kontakt</span> aufnehmen
          </h1>
          <p className="mb-12 text-lg text-white/60 max-w-2xl">
            Ob Projektanfrage oder Kooperationswunsch — wir freuen uns auf Ihre Nachricht.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium">E-Mail</p>
                  <p className="text-sm text-white/50">info@ncore.online</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium">Telefon</p>
                  <p className="text-sm text-white/50">Auf Anfrage</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium">Standort</p>
                  <p className="text-sm text-white/50">Deutschland</p>
                </div>
              </div>
            </div>

            {/* Placeholder for contact form — will integrate sot-lead-inbox */}
            <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-8">
              <p className="text-white/50 text-sm">
                Kontaktformular wird in Kürze integriert (Lead-Routing via sot-lead-inbox).
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
