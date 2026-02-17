/**
 * LennoxUeberUns — Simple about page
 */
import { PawPrint, Heart, Shield, Users } from 'lucide-react';

export default function LennoxUeberUns() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">
      <section className="text-center space-y-4">
        <PawPrint className="h-12 w-12 text-[hsl(25,85%,55%)] mx-auto" />
        <h1 className="text-3xl font-bold text-[hsl(25,30%,15%)]">Über Lennox & Friends</h1>
        <p className="text-[hsl(25,15%,45%)] max-w-lg mx-auto leading-relaxed">
          Wir vermitteln vertrauenswürdige Tierbetreuung in deiner Region. 
          Jeder Anbieter auf unserer Plattform wird geprüft und verifiziert.
        </p>
      </section>

      <div className="grid gap-8 sm:grid-cols-3">
        {[
          { icon: Heart, title: 'Mit Herz', text: 'Jeder Anbieter liebt Tiere – das ist die Grundvoraussetzung.' },
          { icon: Shield, title: 'Geprüft', text: 'Alle Betreuer werden verifiziert und regelmäßig überprüft.' },
          { icon: Users, title: 'Gemeinschaft', text: 'Ein wachsendes Netzwerk aus Tierfreunden und Profis.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(25,85%,55%,0.1)] flex items-center justify-center mx-auto">
              <Icon className="h-7 w-7 text-[hsl(25,85%,55%)]" />
            </div>
            <h3 className="font-semibold text-[hsl(25,30%,15%)]">{title}</h3>
            <p className="text-sm text-[hsl(25,15%,50%)]">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
