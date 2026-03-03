/**
 * LennoxLennox — Founders Page
 * Zone 3 page for Lennox & Friends
 */
import { Link } from 'react-router-dom';
import {
  Heart, PawPrint, Star, MapPin, Clock, CheckCircle, ArrowRight, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { LENNOX as C } from './lennoxTheme';
import { supabase } from '@/integrations/supabase/client';

import gruenderinSee from '@/assets/lennox/gruenderin_see.jpeg';
import gruenderinLennox from '@/assets/lennox/gruenderin_lennox.jpeg';
import gruenderinPferd from '@/assets/lennox/gruenderin_pferd.jpeg';
import lennoxPortrait from '@/assets/lennox/lennox_portrait.jpeg';

const AVATAR_BUCKET = 'tenant-documents';
const ROBYN_AVATAR_PATH = 'eac1778a-23bc-4d03-b3f9-b26be27c9505/MOD_01/99d271be-4ebb-4495-970d-ad91e943e4f0/avatars/avatar_1772488912468_9F77D730-1781-4AB0-B111-8D22260A0714_4_5005_c.jpeg';

function getAvatarUrl() {
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(ROBYN_AVATAR_PATH);
  return data.publicUrl;
}

export default function LennoxLennox() {
  return (
    <div style={{ background: C.cream }}>
      <SEOHead
        brand="lennox"
        page={{
          title: 'Lennox — Founders',
          description: 'Die Geschichte hinter Lennox & Friends — Gründerin Robyn Gebhard und Namensgeber Lennox.',
          path: '/lennox',
        }}
      />

      {/* ═══════════════════ HERO — See-Bild ═══════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '50vh' }}>
        <div className="absolute inset-0">
          <img src={gruenderinSee} alt="Robyn am Bergsee mit Lennox" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/60" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center" style={{ minHeight: '50vh' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 bg-white/15 border border-white/25 text-white backdrop-blur-sm">
            <PawPrint className="h-3.5 w-3.5" /> Founders
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-4"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            Lennox
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light tracking-wide max-w-2xl"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
            Die Geschichte hinter Lennox & Friends
          </p>
        </div>
      </section>

      {/* ═══════════════════ FOUNDERS ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.warmWhite }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: C.coral }}>
              Founders
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: C.bark }}>
              Robyn & Lennox
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: C.barkMuted }}>
              Gründerin und Namensgeber — die beiden Herzen hinter Lennox & Friends.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Robyn — Founder */}
            <Card className="bg-white border shadow-sm overflow-hidden" style={{ borderColor: C.sandLight }}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-64 h-64 md:h-auto flex-shrink-0">
                    <img
                      src={getAvatarUrl()}
                      alt="Robyn Gebhard — Founder"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = gruenderinLennox; }}
                    />
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: C.bark }}>Robyn Gebhard</h3>
                        <p className="text-xs" style={{ color: C.barkMuted }}>Founder & CEO</p>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: `${C.gold}20` }}>
                        <Star className="h-3.5 w-3.5 fill-current" style={{ color: C.gold }} />
                        <span className="text-xs font-bold" style={{ color: C.bark }}>4.9</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Gründerin', 'Pension', 'Daycare', 'Training', 'Ernährungsberatung'].map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] font-medium"
                          style={{ background: `${C.forest}10`, color: C.forest }}>
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.barkMuted }}>
                      Robyn ist seit über 10 Jahren leidenschaftliche Hundebetreuerin und hat Lennox & Friends 
                      aus der Überzeugung gegründet, dass jeder Hund die beste Betreuung verdient. 
                      Ihr Spezialgebiet: Mehrhundehaltung, artgerechte Ernährung und Verhaltensarbeit.
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: C.barkMuted }}>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Ottobrunn, Bayern</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 10+ Jahre Erfahrung</span>
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" style={{ color: C.forest }} /> Verifiziert</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lennox — Co-Founder */}
            <Card className="bg-white border shadow-sm overflow-hidden" style={{ borderColor: C.sandLight }}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-64 h-64 md:h-auto flex-shrink-0">
                    <img
                      src={lennoxPortrait}
                      alt="Lennox — Co-Founder & Namensgeber"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: C.bark }}>Lennox</h3>
                        <p className="text-xs" style={{ color: C.barkMuted }}>Co-Founder & Namensgeber</p>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: `${C.coral}15` }}>
                        <PawPrint className="h-3.5 w-3.5" style={{ color: C.coral }} />
                        <span className="text-xs font-bold" style={{ color: C.bark }}>Chief Dog</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Beagle-Mix', 'Qualitätstester', 'Charakter-Hund', 'Großes Herz'].map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] font-medium"
                          style={{ background: `${C.coral}10`, color: C.coral }}>
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.barkMuted }}>
                      Lennox — ein charakterstarker Beagle-Mix mit großem Herzen — begleitet Robyn seit dem 
                      ersten Tag. Er ist nicht nur der beste Qualitätstester für jeden neuen Partner, sondern 
                      auch der Beweis: Wer seinen eigenen Hund so liebt, sorgt dafür, dass jeder Vierbeiner 
                      in den besten Händen ist.
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: C.barkMuted }}>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" style={{ color: C.coral }} /> Namensgeber</span>
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" style={{ color: C.forest }} /> Seit Tag 1 dabei</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOTO-GALERIE ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.cream }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: C.coral }}>
              Einblicke
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: C.bark }}>
              Impressionen
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4]">
              <img src={gruenderinLennox} alt="Robyn mit Lennox" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4]">
              <img src={gruenderinPferd} alt="Robyn mit Pferd" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md aspect-[3/4]">
              <img src={lennoxPortrait} alt="Lennox Portrait" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STORY ═══════════════════ */}
      <section className="py-16 px-6" style={{ background: C.warmWhite }}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border shadow-sm" style={{ borderColor: C.sandLight }}>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: C.barkMuted }}>
              <p>
                <strong style={{ color: C.bark }}>Robyn Gebhard</strong> hat ihre Leidenschaft für Tiere 
                zum Beruf gemacht. Was als kleine Hundebetreuung in Bayern begann, ist heute ein wachsendes 
                Netzwerk aus geprüften Hundeprofis im gesamten DACH-Raum.
              </p>
              <p>
                Der Namensgeber <strong style={{ color: C.bark }}>Lennox</strong> — ein charakterstarker 
                Beagle-Mix mit großem Herzen — begleitet Robyn seit dem ersten Tag. Er ist nicht nur der 
                beste Qualitätstester für jeden neuen Partner, sondern auch der Beweis: 
                Wer seinen eigenen Hund so liebt, sorgt dafür, dass jeder Vierbeiner in den besten Händen ist.
              </p>
              <p>
                Neben Hunden gehört auch <strong style={{ color: C.bark }}>die Arbeit mit Pferden</strong> zu 
                Robyns großer Leidenschaft — ein Verständnis für Tiere, das über Rassen und Arten hinausgeht 
                und in jeder Facette von Lennox & Friends spürbar ist.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              {['Gründerin & CEO', '10+ Jahre Tierpflege', 'Mehrhundehaltung', 'Pferdemenschen'].map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: C.sandLight, color: C.forest }}>
                  <Heart className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

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
