/**
 * ZL WOHNBAU KONTAKT — Zone 3
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';

const BRAND = '#2D6A4F';

export default function ZLWohnbauKontakt() {
  return (
    <>
      <SEOHead
        brand="zlwohnbau"
        page={{
          title: 'Kontakt — ZL Wohnbau GmbH',
          description: 'Kontaktieren Sie die ZL Wohnbau GmbH für Wohnraum-Anfragen, Objektangebote oder allgemeine Fragen.',
          path: '/kontakt',
        }}
      />

      <section className="py-20 px-4 bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-800">Kontakt</h1>
          <p className="text-lg text-slate-500">Wir freuen uns auf Ihre Nachricht.</p>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">ZL Wohnbau GmbH</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: BRAND }} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Adresse</p>
                      <p className="text-sm text-slate-500">Tisinstraße 19<br />82041 Oberhaching</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: BRAND }} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Telefon</p>
                      <a href="tel:+498966667788" className="text-sm text-slate-500 hover:text-slate-700">089 66667788</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: BRAND }} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">E-Mail</p>
                      <a href="mailto:info@zl-wohnbau.de" className="text-sm text-slate-500 hover:text-slate-700">info@zl-wohnbau.de</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: BRAND }} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Geschäftsführer</p>
                      <p className="text-sm text-slate-500">Otto Stelzl</p>
                      <a href="mailto:otto.stelzl@zl-wohnbau.de" className="text-sm text-slate-500 hover:text-slate-700">otto.stelzl@zl-wohnbau.de</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-lg text-slate-800 mb-3">Für Unternehmen</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Sie sind ein mittelständisches Unternehmen und suchen Wohnraum für Ihre Mitarbeiter?
                  Wir entwickeln gemeinsam eine langfristige Lösung — vom Ankauf bis zur schlüsselfertigen Übergabe.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-lg text-slate-800 mb-3">Objekt anbieten</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Sie haben ein Mehrfamilienhaus oder Grundstück in Bayern zu verkaufen?
                  Wir sind ständig auf der Suche nach attraktiven Objekten für unsere Mandanten.
                </p>
              </div>
              <div className="rounded-xl p-6" style={{ backgroundColor: `${BRAND}08`, border: `1px solid ${BRAND}20` }}>
                <p className="text-sm font-medium" style={{ color: BRAND }}>Ein Unternehmen der ZL Gruppe</p>
                <p className="text-xs text-slate-500 mt-1">
                  Gemeinsam mit der ZL Finanzdienstleistungen GmbH (Otto² Advisory) bilden wir die ZL Gruppe — Ihr Partner für Immobilien und Finanzen in Bayern.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
