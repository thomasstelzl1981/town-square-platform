/**
 * ZL WOHNBAU HOME — Zone 3
 * Wohnraum für Mitarbeiter in Bayern
 */
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import {
  ArrowRight, Building2, Users, Shield, Home,
  Handshake, Leaf, MapPin, CheckCircle2
} from 'lucide-react';
import heroImg from '@/assets/zlwohnbau/hero-houses.jpg';
import townImg from '@/assets/zlwohnbau/bavarian-town.jpg';
import energyImg from '@/assets/zlwohnbau/energy-house.jpg';
import ottoStelzlImg from '@/assets/zlwohnbau/otto-stelzl.jpg';

const BRAND = '#2D6A4F';

const usps = [
  { icon: Handshake, title: 'Langfristige Mietabsicherung', desc: 'Unternehmen sichern die Mietverhältnisse langfristig ab — ein Ansprechpartner, keine Einzelvermietung.' },
  { icon: Leaf, title: 'Energieeffiziente Bauweise', desc: 'Wärmepumpen, Fußbodenheizung, moderne Dämmung — alle Objekte erfüllen höchste energetische Standards.' },
  { icon: Users, title: 'Win-Win für alle Seiten', desc: 'Unternehmen binden Fachkräfte, Mitarbeiter wohnen attraktiv, wir haben langfristige Sicherheit.' },
];

const stats = [
  { value: '8', label: 'Wohneinheiten' },
  { value: '1.425', label: 'm² Wohnfläche' },
  { value: '183 T€', label: 'Mieteinnahmen p.a.' },
  { value: 'Bayern', label: 'Fokusregion' },
];

export default function ZLWohnbauHome() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'ZL Wohnbau GmbH',
    description: 'Wohnraum für Mitarbeiter — Ankauf und Neubau von Wohnimmobilien für Unternehmen in Bayern.',
    url: 'https://zl-wohnbau.de',
    telephone: '+498966667788',
    email: 'info@zl-wohnbau.de',
    address: { '@type': 'PostalAddress', streetAddress: 'Tisinstraße 19', addressLocality: 'Oberhaching', postalCode: '82041', addressCountry: 'DE' },
    areaServed: { '@type': 'State', name: 'Bayern' },
  };

  return (
    <>
      <SEOHead
        brand="zlwohnbau"
        page={{
          title: 'Wohnraum für Mitarbeiter — Langfristig. Nachhaltig. Partnerschaftlich.',
          description: 'ZL Wohnbau GmbH investiert in Wohnimmobilien für Unternehmen in Bayern. Langfristige Mietabsicherung durch Firmenmietverträge. Energieeffizient und attraktiv.',
          path: '/',
        }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center overflow-hidden">
        <img src={heroImg} alt="Moderne Doppelhaushälften in Bayern" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/90" />
        <div className="relative z-10 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium shadow-sm"
            style={{ borderColor: `${BRAND}33`, backgroundColor: 'rgba(255,255,255,0.8)', color: BRAND }}>
            <Building2 className="h-3.5 w-3.5" /> Wohnraum für Unternehmen
          </div>
          <h1 className="mb-4 text-5xl font-bold leading-tight md:text-7xl text-slate-800">
            ZL <span style={{ color: BRAND }}>Wohnbau</span>
          </h1>
          <p className="mx-auto mb-3 max-w-xl text-xl font-medium text-slate-700 md:text-2xl">
            Langfristig. Nachhaltig. Partnerschaftlich.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base text-slate-500">
            Wir investieren in den Ankauf und Neubau von Wohnimmobilien für Unternehmen in Bayern.
            Firmen sichern die Mietverhältnisse ab — wir liefern attraktiven Wohnraum für Mitarbeiter.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/website/zl-wohnbau/kontakt"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all"
              style={{ backgroundColor: BRAND, boxShadow: `0 10px 25px -5px ${BRAND}40` }}
            >
              Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/website/zl-wohnbau/portfolio"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/80 px-8 py-3.5 text-sm text-slate-600 hover:border-slate-400 transition-all"
            >
              Unser Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="py-20 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {usps.map(item => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${BRAND}15` }}>
                  <item.icon className="h-7 w-7" style={{ color: BRAND }} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Lösung */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-slate-800">Fachkräftemangel trifft Wohnungsmangel</h2>
            <p className="text-slate-500 mb-4 leading-relaxed">
              In der heutigen Zeit wird es für mittelständische Betriebe immer schwieriger, Mitarbeiter in der Nähe des Produktionsstandortes unterzubringen. Gleichzeitig fehlt es an bezahlbarem Wohnraum.
            </p>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Wir investieren gezielt in den Ankauf und Neubau von Einfamilien- und Zweifamilienhäusern in der Nähe von Produktionsstätten.
              Der Konzern oder mittelständische Betrieb sichert langfristig die Mietverhältnisse ab und kümmert sich selbstständig um die Belegung.
            </p>
            <ul className="space-y-3">
              {[
                'Unternehmen binden Fachkräfte durch attraktiven Wohnraum',
                'Mitarbeiter wohnen bezahlbar nahe am Arbeitsplatz',
                'Nur ein Ansprechpartner für die gesamte Vermietung',
                'Energetisch saniert — nachhaltig und zukunftssicher',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: BRAND }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img src={townImg} alt="Bayerische Gemeinde mit Wohnhäusern" className="w-full h-80 object-cover" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-t border-slate-100" style={{ backgroundColor: `${BRAND}08` }}>
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold" style={{ color: BRAND }}>{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Energetische Sanierung */}
      <section className="relative py-20 px-4 overflow-hidden">
        <img src={energyImg} alt="Energieeffizientes Haus mit Wärmepumpe" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: `${BRAND}CC` }} />
        <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
          <Leaf className="mx-auto mb-6 h-12 w-12 text-white/90" />
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Energieeffizient bauen und sanieren</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
            Alle unsere Objekte werden energiegerecht und attraktiv gebaut oder saniert. Wärmepumpen, Fußbodenheizung und moderne Dämmung sorgen für ein angenehmes Leben für die Bewohner.
          </p>
          <div className="grid gap-6 text-left md:grid-cols-3 my-10">
            {[
              { icon: Home, title: 'Neubau & Sanierung', desc: 'Doppelhaushälften und Mehrfamilienhäuser nach aktuellen Standards.' },
              { icon: Shield, title: 'Qualität & Ausstattung', desc: 'Hochwertige Materialien, attraktive Gestaltung für zufriedene Bewohner.' },
              { icon: MapPin, title: 'Standortnähe', desc: 'Immer in der Nähe der Produktionsstätten unserer Partner.' },
            ].map(item => (
              <div key={item.title} className="rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20">
                <item.icon className="mb-3 h-8 w-8 text-white/90" />
                <h3 className="mb-2 font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-white/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Geschäftsführer */}
      <section className="py-16 px-4 border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: BRAND }}>Geschäftsführung</p>
          <img
            src={ottoStelzlImg}
            alt="Otto Stelzl — Geschäftsführer ZL Wohnbau GmbH"
            className="mx-auto mb-6 h-44 w-44 rounded-full object-cover shadow-lg"
          />
          <h2 className="mb-1 text-2xl font-bold text-slate-800">Otto Stelzl</h2>
          <p className="mb-6 text-sm text-slate-500">Geschäftsführer</p>
          <p className="mx-auto max-w-xl text-slate-600 italic leading-relaxed mb-8">
            „Die Idee zu ZL Wohnbau ist aus vielen Gesprächen mit unseren Unternehmer-Kunden entstanden. Fachkräfte zu finden ist schwer — sie in der Nähe des Betriebs unterzubringen oft noch schwerer. Mit langjähriger Erfahrung im Immobilien- und Finanzsegment haben wir ein Konzept entwickelt, das Unternehmen echten Mehrwert bietet: attraktiven Wohnraum für ihre Mitarbeiter, langfristig und partnerschaftlich."
          </p>
          <Link
            to="/website/zl-wohnbau/kontakt"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: BRAND }}
          >
            Persönliches Gespräch vereinbaren <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-slate-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-800">Sie benötigen Wohnraum für Ihre Mitarbeiter?</h2>
          <p className="mb-8 text-slate-500">
            Sprechen Sie uns an — wir entwickeln gemeinsam eine langfristige Lösung für Ihr Unternehmen.
          </p>
          <Link
            to="/website/zl-wohnbau/kontakt"
            className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all"
            style={{ backgroundColor: BRAND, boxShadow: `0 10px 25px -5px ${BRAND}40` }}
          >
            Kontakt aufnehmen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
