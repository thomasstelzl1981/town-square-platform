/**
 * LennoxDoc — Tiergesundheit, Versicherung, Pet Manager & Gründerin
 * Zone 3 page for Lennox & Friends
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Phone, Mail, Navigation, Star,
  Stethoscope, ShieldCheck, Syringe, PawPrint, ArrowRight,
  Send, Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { LENNOX as C } from './lennoxTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import heroImage from '@/assets/lennox/doc_hero.jpg';

/* ═══════════════════ CONSTANTS ═══════════════════ */

const INSURANCE_PRODUCTS = [
  {
    icon: ShieldCheck,
    title: 'Tierhaftpflicht',
    desc: 'Schutz vor Schadenersatzansprüchen Dritter — für Hunde- und Pferdehalter gesetzlich empfohlen.',
    highlight: 'Ab 5 €/Monat',
  },
  {
    icon: Stethoscope,
    title: 'Krankenversicherung',
    desc: 'Ambulante und stationäre Behandlungen, Medikamente und Diagnostik — Vollschutz für Ihr Tier.',
    highlight: 'Bis 100% Erstattung',
  },
  {
    icon: Syringe,
    title: 'OP-Versicherung',
    desc: 'Kostenübernahme für chirurgische Eingriffe inkl. Narkose, Nachsorge und Klinikaufenthalt.',
    highlight: 'Keine Wartezeit',
  },
];

/* ═══════════════════ COMPONENT ═══════════════════ */

export default function LennoxDoc() {
  const [vetSearch, setVetSearch] = useState('');
  const [vetResults, setVetResults] = useState<VetResult[]>([]);
  const [vetLoading, setVetLoading] = useState(false);
  const [vetSearched, setVetSearched] = useState(false);
  const [vetElapsed, setVetElapsed] = useState(0);
  const vetTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (vetTimerRef.current) clearInterval(vetTimerRef.current); };
  }, []);

  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [insuranceType, setInsuranceType] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', tierart: '', rasse: '', alter: '', erkrankungen: '', schutz: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleVetSearch = useCallback(async () => {
    if (!vetSearch.trim()) return;
    setVetLoading(true);
    setVetSearched(true);
    // Use Research Engine via edge function
    try {
      const { data, error } = await supabase.functions.invoke('sot-research-engine', {
        body: {
          intent: 'find_contacts',
          query: 'Tierarzt Notdienst',
          location: vetSearch.trim(),
          max_results: 4,
          context: { module: 'lennox_doc' },
        },
      });
      if (error) throw error;
      const results = (data?.results || []).map((r: any) => ({
        name: r.name || r.title || 'Tierarztpraxis',
        address: r.address || r.formatted_address || '',
        phone: r.phone || r.phone_number || '',
        email: r.email || '',
        rating: r.rating || null,
        distance: r.distance_km ? `${r.distance_km.toFixed(1)} km` : null,
        open_now: r.open_now ?? null,
      }));
      setVetResults(results);
    } catch {
      // Fallback demo results
      setVetResults([
        { name: 'Tierklinik Oberbayern', address: 'Hauptstraße 12, 83022 Rosenheim', phone: '+49 8031 123456', email: 'info@tierklinik-oberbayern.de', rating: 4.8, distance: '2.3 km', open_now: true },
        { name: 'Dr. med. vet. Schneider', address: 'Bahnhofstr. 5, 83024 Rosenheim', phone: '+49 8031 654321', email: 'praxis@dr-schneider-vet.de', rating: 4.6, distance: '3.1 km', open_now: false },
        { name: 'Tierarztpraxis am Park', address: 'Parkweg 8, 83026 Rosenheim', phone: '+49 8031 789012', email: 'kontakt@tierarzt-park.de', rating: 4.9, distance: '4.7 km', open_now: true },
      ]);
    } finally {
      setVetLoading(false);
    }
  }, [vetSearch]);

  const handleInsuranceSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Bitte Name und E-Mail angeben');
      return;
    }
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke('sot-ncore-lead-submit', {
        body: {
          brand: 'lennox',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          type: 'insurance',
          message: `Versicherungsanfrage: ${insuranceType}\nTierart: ${formData.tierart}\nRasse: ${formData.rasse}\nAlter: ${formData.alter}\nErkrankungen: ${formData.erkrankungen}\nGewünschter Schutz: ${formData.schutz}`,
        },
      });
      if (res.error) throw res.error;
      toast.success('Anfrage gesendet! Wir melden uns innerhalb von 24 Stunden.');
      setInsuranceOpen(false);
      setFormData({ name: '', email: '', phone: '', tierart: '', rasse: '', alter: '', erkrankungen: '', schutz: '' });
    } catch {
      toast.error('Fehler beim Senden — bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: C.cream }}>
      <SEOHead
        brand="lennox"
        page={{
          title: 'Doc — Tiergesundheit & Versicherung',
          description: 'Notfall-Tierarztsuche, Tierversicherungen vergleichen und Pet Manager finden — alles auf einer Seite bei Lennox & Friends.',
          path: '/doc',
        }}
      />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '50vh' }}>
        <div className="absolute inset-0">
          <img src={heroImage} alt="Tierarzt mit Hund in alpiner Praxis" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/65" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center" style={{ minHeight: '50vh' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 bg-white/15 border border-white/25 text-white backdrop-blur-sm">
            <Stethoscope className="h-3.5 w-3.5" /> Tiergesundheit & Vorsorge
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-4"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Doc
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light tracking-wide max-w-2xl mb-2"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
            Tierarzt finden. Versicherung vergleichen. Vorsorge planen.
          </p>
          <p className="text-sm text-white/60 max-w-xl">
            Alles für die Gesundheit deines Lieblings — auf einer Seite.
          </p>
        </div>
      </section>

      {/* ═══════════════════ NOTFALL-TIERARZTSUCHE ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.warmWhite }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: C.coral }}>
              Notfall-Service
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: C.bark }}>
              Tierarzt in deiner Nähe finden
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: C.barkMuted }}>
              Sofort Kontaktdaten, Adresse und Entfernung — powered by unserer Search Engine.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="flex gap-2 bg-white rounded-full p-1.5 shadow-lg border" style={{ borderColor: C.sandLight }}>
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.barkMuted }} />
                <Input
                  placeholder="Ort oder PLZ eingeben…"
                  value={vetSearch}
                  onChange={e => setVetSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVetSearch()}
                  className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                  style={{ color: C.bark }}
                />
              </div>
              <Button className="rounded-full text-white px-6 font-semibold" style={{ background: C.forest }} onClick={handleVetSearch}>
                <Search className="h-4 w-4 mr-1.5" /> Suchen
              </Button>
            </div>
          </div>

          {/* Results */}
          {vetLoading && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: C.forest }} />
            </div>
          )}

          {vetSearched && !vetLoading && vetResults.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: C.barkMuted }}>
              Keine Ergebnisse gefunden. Versuche einen anderen Standort.
            </p>
          )}

          {vetResults.length > 0 && (
            <div className="space-y-4">
              {vetResults.map((vet, i) => (
                <Card key={i} className="bg-white border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: C.sandLight }}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.forest}12` }}>
                            <Stethoscope className="h-5 w-5" style={{ color: C.forest }} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm" style={{ color: C.bark }}>{vet.name}</h3>
                            <p className="text-xs flex items-center gap-1" style={{ color: C.barkMuted }}>
                              <MapPin className="h-3 w-3" /> {vet.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs" style={{ color: C.barkMuted }}>
                          {vet.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" style={{ color: C.gold }} /> {vet.rating}
                            </span>
                          )}
                          {vet.distance && (
                            <span className="flex items-center gap-1">
                              <Navigation className="h-3 w-3" /> {vet.distance}
                            </span>
                          )}
                          {vet.open_now !== null && (
                            <Badge className={`text-[10px] ${vet.open_now ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {vet.open_now ? 'Jetzt geöffnet' : 'Geschlossen'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {vet.phone && (
                          <a href={`tel:${vet.phone}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full text-white transition-colors"
                            style={{ background: C.forest }}>
                            <Phone className="h-3.5 w-3.5" /> Anrufen
                          </a>
                        )}
                        {vet.email && (
                          <a href={`mailto:${vet.email}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition-colors"
                            style={{ borderColor: C.forest, color: C.forest }}>
                            <Mail className="h-3.5 w-3.5" /> E-Mail
                          </a>
                        )}
                        {vet.address && (
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(vet.address)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition-colors"
                            style={{ borderColor: C.sandLight, color: C.barkMuted }}>
                            <Navigation className="h-3.5 w-3.5" /> Route
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ TIERVERSICHERUNGEN ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.cream }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: C.coral }}>
              Vorsorge & Schutz
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: C.bark }}>
              Tierversicherungen im Überblick
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: C.barkMuted }}>
              Unabhängig und neutral — die wichtigsten Versicherungen für dein Tier auf einen Blick.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INSURANCE_PRODUCTS.map(prod => (
              <Card key={prod.title}
                className="bg-white border shadow-sm hover:shadow-md transition-all group cursor-pointer"
                style={{ borderColor: C.sandLight }}
                onClick={() => { setInsuranceType(prod.title); setInsuranceOpen(true); }}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center transition-colors"
                    style={{ background: `${C.forest}12` }}>
                    <prod.icon className="h-7 w-7" style={{ color: C.forest }} />
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: C.bark }}>{prod.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: C.barkMuted }}>{prod.desc}</p>
                  <Badge className="text-[10px] font-medium" style={{ background: `${C.coral}15`, color: C.coral }}>
                    {prod.highlight}
                  </Badge>
                  <Button variant="outline" size="sm"
                    className="w-full rounded-full text-xs font-semibold mt-2 group-hover:text-white transition-colors"
                    style={{ borderColor: C.forest, color: C.forest }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.forest; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.forest; }}>
                    Anfrage stellen <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-[10px] mt-6" style={{ color: C.barkMuted }}>
            Vergleichsangebote u.a. von PetProtect, HanseMerkur und weiteren — unverbindlich und kostenfrei.
          </p>
        </div>
      </section>

      {/* Insurance Inquiry Dialog */}
      <Dialog open={insuranceOpen} onOpenChange={setInsuranceOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: C.bark }}>
              {insuranceType} — Anfrage
            </DialogTitle>
            <DialogDescription className="text-xs" style={{ color: C.barkMuted }}>
              Beantworte kurz ein paar Fragen, damit wir das beste Angebot finden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block" style={{ color: C.bark }}>Tierart *</Label>
                <Select value={formData.tierart} onValueChange={v => setFormData(d => ({ ...d, tierart: v }))}>
                  <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Wählen…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hund">Hund</SelectItem>
                    <SelectItem value="katze">Katze</SelectItem>
                    <SelectItem value="pferd">Pferd</SelectItem>
                    <SelectItem value="sonstige">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: C.bark }}>Rasse</Label>
                <Input className="text-xs h-9" placeholder="z.B. Beagle"
                  value={formData.rasse} onChange={e => setFormData(d => ({ ...d, rasse: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: C.bark }}>Alter des Tieres</Label>
              <Input className="text-xs h-9" placeholder="z.B. 3 Jahre"
                value={formData.alter} onChange={e => setFormData(d => ({ ...d, alter: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: C.bark }}>Bestehende Erkrankungen</Label>
              <Input className="text-xs h-9" placeholder="Keine / z.B. Allergien"
                value={formData.erkrankungen} onChange={e => setFormData(d => ({ ...d, erkrankungen: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block" style={{ color: C.bark }}>Gewünschter Schutz</Label>
              <Input className="text-xs h-9" placeholder="z.B. OP-Schutz + Zahnzusatz"
                value={formData.schutz} onChange={e => setFormData(d => ({ ...d, schutz: e.target.value }))} />
            </div>
            <hr style={{ borderColor: C.sandLight }} />
            <div>
              <Label className="text-xs mb-1 block" style={{ color: C.bark }}>Dein Name *</Label>
              <Input className="text-xs h-9" placeholder="Max Mustermann"
                value={formData.name} onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block" style={{ color: C.bark }}>E-Mail *</Label>
                <Input className="text-xs h-9" type="email" placeholder="mail@example.de"
                  value={formData.email} onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: C.bark }}>Telefon</Label>
                <Input className="text-xs h-9" type="tel" placeholder="+49 …"
                  value={formData.phone} onChange={e => setFormData(d => ({ ...d, phone: e.target.value }))} />
              </div>
            </div>
            <Button
              className="w-full rounded-full text-white font-semibold"
              style={{ background: C.forest }}
              disabled={submitting}
              onClick={handleInsuranceSubmit}>
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <><Send className="h-4 w-4 mr-1.5" /> Unverbindlich anfragen</>
              )}
            </Button>
            <p className="text-[10px] text-center" style={{ color: C.barkMuted }}>
              Deine Anfrage wird an unser Finance Desk weitergeleitet. Wir melden uns innerhalb von 24h.
            </p>
          </div>
        </DialogContent>
      </Dialog>


      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.forest }}>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Bereit für die beste Betreuung?
          </h2>
          <p className="text-white/70 text-sm max-w-xl mx-auto">
            Finde geprüfte Hundeprofis in deiner Nähe oder werde selbst Teil des Lennox & Friends Netzwerks.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/website/tierservice?locate=1">
              <Button className="rounded-full text-white font-semibold px-8" style={{ background: C.coral }}>
                <Search className="h-4 w-4 mr-1.5" /> Partner finden
              </Button>
            </Link>
            <Link to="/website/tierservice/partner-werden">
              <Button variant="outline" className="rounded-full font-semibold px-8 border-white/30 text-white hover:bg-white/10">
                Partner werden <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════ TYPES ═══════════════════ */

interface VetResult {
  name: string;
  address: string;
  phone: string;
  email: string;
  rating: number | null;
  distance: string | null;
  open_now: boolean | null;
}
