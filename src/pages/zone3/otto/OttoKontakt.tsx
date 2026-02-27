import { Mail, Phone, MapPin } from 'lucide-react';

export default function OttoKontakt() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold md:text-5xl"><span className="text-blue-400">Kontakt</span></h1>
        <p className="mb-12 text-lg text-white/60 max-w-2xl">Wir freuen uns auf Ihre Nachricht.</p>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 h-5 w-5 text-blue-400" />
              <div><p className="font-medium">E-Mail</p><p className="text-sm text-white/50">info@otto2advisory.com</p></div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 text-blue-400" />
              <div><p className="font-medium">Telefon</p><p className="text-sm text-white/50">Auf Anfrage</p></div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 text-blue-400" />
              <div><p className="font-medium">Komplett ZL Finanzdienstleistungen GmbH</p><p className="text-sm text-white/50">Deutschland</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-900/30 bg-blue-950/20 p-8">
            <p className="text-white/50 text-sm">Kontaktformular wird in Kürze integriert (Lead-Routing via sot-lead-inbox).</p>
          </div>
        </div>
      </div>
    </section>
  );
}
