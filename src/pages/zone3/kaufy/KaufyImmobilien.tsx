import { Link } from 'react-router-dom';
import { Search, MapPin, Euro, Building2, Heart, ArrowRight } from 'lucide-react';
import { useState } from 'react';

// Placeholder listings - in production this would come from the database
const placeholderListings = [
  { id: 1, title: 'Mehrfamilienhaus Leipzig-Süd', city: 'Leipzig', price: 890000, yield: 5.2, units: 8, sqm: 620 },
  { id: 2, title: 'Wohnanlage Dresden-Neustadt', city: 'Dresden', price: 1250000, yield: 4.8, units: 12, sqm: 890 },
  { id: 3, title: 'Altbau-Paket Chemnitz', city: 'Chemnitz', price: 450000, yield: 6.1, units: 6, sqm: 480 },
  { id: 4, title: 'Neubau-ETW Berlin-Mitte', city: 'Berlin', price: 320000, yield: 3.9, units: 1, sqm: 75 },
  { id: 5, title: 'Zinshaus Halle', city: 'Halle', price: 680000, yield: 5.5, units: 10, sqm: 720 },
  { id: 6, title: 'Gewerbe-Wohn-Mix Erfurt', city: 'Erfurt', price: 920000, yield: 5.8, units: 14, sqm: 1100 },
];

export default function KaufyImmobilien() {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const filteredListings = placeholderListings.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Kapitalanlage-Immobilien</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Entdecken Sie aktuelle Angebote von geprüften Anbietern.
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
              <input
                type="text"
                placeholder="Stadt oder Objektart suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-black/10 focus:border-black/30 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="flex items-center justify-between mb-8">
            <p className="zone3-text-small">{filteredListings.length} Objekte gefunden</p>
            {favorites.length > 0 && (
              <p className="zone3-text-small flex items-center gap-2">
                <Heart className="w-4 h-4 fill-current" />
                {favorites.length} gemerkt
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="zone3-card overflow-hidden">
                {/* Image placeholder */}
                <div className="h-48 bg-black/5 flex items-center justify-center relative">
                  <Building2 className="w-16 h-16 text-black/20" />
                  <button
                    onClick={() => toggleFavorite(listing.id)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Heart 
                      className={`w-5 h-5 ${favorites.includes(listing.id) ? 'fill-red-500 text-red-500' : 'text-black/40'}`} 
                    />
                  </button>
                </div>
                
                <div className="p-5">
                  <h3 className="zone3-heading-3 mb-2">{listing.title}</h3>
                  <p className="zone3-text-small flex items-center gap-1 mb-4">
                    <MapPin className="w-4 h-4" />
                    {listing.city}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-black/50">Preis</span>
                      <p className="font-semibold">{listing.price.toLocaleString('de-DE')} €</p>
                    </div>
                    <div>
                      <span className="text-black/50">Rendite</span>
                      <p className="font-semibold text-green-600">{listing.yield} %</p>
                    </div>
                    <div>
                      <span className="text-black/50">Einheiten</span>
                      <p className="font-semibold">{listing.units}</p>
                    </div>
                    <div>
                      <span className="text-black/50">Fläche</span>
                      <p className="font-semibold">{listing.sqm} m²</p>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/auth?source=kaufy&listing=${listing.id}`}
                    className="zone3-btn-primary w-full text-center block text-sm"
                  >
                    Details ansehen
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Load more hint */}
          <div className="text-center mt-12">
            <p className="zone3-text-small mb-4">
              Registrieren Sie sich für Zugang zu allen Objekten und Detailinformationen.
            </p>
            <Link to="/auth?source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
              Kostenlos registrieren
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
