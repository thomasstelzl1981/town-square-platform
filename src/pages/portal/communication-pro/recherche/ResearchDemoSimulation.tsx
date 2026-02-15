/**
 * ResearchDemoSimulation — 5-Phase interactive demo flow
 * Phase 1 (0-3s): Input mask with typing animation
 * Phase 2 (3-4.5s): Consent & credits confirmation
 * Phase 3 (4.5-14s): Live search with progress
 * Phase 4+5 (14s+): Results table + CTA banner
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { ResearchLiveProgress, type ProviderStatus, type LiveContact } from './ResearchLiveProgress';
import { ResearchDemoResultsTable } from './ResearchDemoResultsTable';
import { Search, MapPin, Building2, CreditCard, CheckCircle, Users, Download, Upload, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Timing constants
const TYPING_SPEED = 80; // ms per char
const TYPING_TEXT = 'Immobilienmakler';
const REGION_TEXT = 'München';
const BRANCHE_TEXT = 'Immobilien';
const TYPING_DURATION = TYPING_TEXT.length * TYPING_SPEED; // ~1280ms
const PHASE2_START = 3000;
const CONSENT1_AT = 3500;
const CONSENT2_AT = 4000;
const SEARCH_START = 4500;
const SEARCH_END = 14000;
const SEARCH_DURATION = SEARCH_END - SEARCH_START;

const DEMO_CONTACTS: LiveContact[] = [
  { id: '1', firma: 'Hausverwaltung Meier GmbH', kontakt: 'Thomas Meier', rolle: 'Geschäftsführer', email: 't.meier@hv-meier.de', stadt: 'Düsseldorf', score: 92 },
  { id: '2', firma: 'Rheinische Immobilien Service AG', kontakt: 'Sabine Krause', rolle: 'Vorstand', email: 's.krause@ris-ag.de', stadt: 'Köln', score: 88 },
  { id: '3', firma: 'WEG-Profis Verwaltung GmbH', kontakt: 'Michael Braun', rolle: 'Geschäftsführer', email: 'm.braun@weg-profis.de', stadt: 'Essen', score: 85 },
  { id: '4', firma: 'Westfalen Hausverwaltung', kontakt: 'Petra Schmidt', rolle: 'Prokuristin', email: 'p.schmidt@whv-ms.de', stadt: 'Münster', score: 82 },
  { id: '5', firma: 'ProHaus Management GmbH', kontakt: 'Jörg Hansen', rolle: 'Geschäftsführer', email: 'j.hansen@prohaus.de', stadt: 'Dortmund', score: 79 },
  { id: '6', firma: 'Niederrhein Verwaltung GmbH', kontakt: 'Anna Weber', rolle: 'Geschäftsführerin', email: 'a.weber@nrv-gmbh.de', stadt: 'Duisburg', score: 76 },
  { id: '7', firma: 'Bergisch Immo GmbH & Co. KG', kontakt: 'Klaus Richter', rolle: 'Geschäftsführer', email: 'k.richter@bergisch-immo.de', stadt: 'Wuppertal', score: 73 },
  { id: '8', firma: 'Capital Wohnen Verwaltung AG', kontakt: 'Sandra Lange', rolle: 'Vorstand', email: 's.lange@capital-wohnen.de', stadt: 'Bonn', score: 70 },
];

const MAX_CONTACTS = 25;

type DemoPhase = 'typing' | 'consent' | 'searching' | 'results';

export function ResearchDemoSimulation() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [visibleContacts, setVisibleContacts] = useState<LiveContact[]>([]);
  const startRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const ms = Date.now() - startRef.current;
      setElapsedMs(ms);

      // Add contacts progressively during search phase
      if (ms >= SEARCH_START && ms <= SEARCH_END) {
        const fraction = (ms - SEARCH_START) / SEARCH_DURATION;
        const count = Math.min(Math.floor(fraction * DEMO_CONTACTS.length) + 1, DEMO_CONTACTS.length);
        setVisibleContacts(DEMO_CONTACTS.slice(0, count));
      } else if (ms > SEARCH_END) {
        setVisibleContacts(DEMO_CONTACTS);
      }

      if (ms >= SEARCH_END + 2000) {
        clearInterval(intervalRef.current);
      }
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, []);

  const phase: DemoPhase = useMemo(() => {
    if (elapsedMs < PHASE2_START) return 'typing';
    if (elapsedMs < SEARCH_START) return 'consent';
    if (elapsedMs < SEARCH_END) return 'searching';
    return 'results';
  }, [elapsedMs]);

  // Typing animation state
  const typedChars = Math.min(Math.floor(elapsedMs / TYPING_SPEED), TYPING_TEXT.length);
  const typedText = TYPING_TEXT.slice(0, typedChars);
  const showCursor = phase === 'typing';
  const regionVisible = elapsedMs > TYPING_DURATION + 200;
  const brancheVisible = elapsedMs > TYPING_DURATION + 600;

  // Consent animation
  const consent1Checked = elapsedMs >= CONSENT1_AT;
  const consent2Checked = elapsedMs >= CONSENT2_AT;
  const buttonPulse = elapsedMs >= CONSENT2_AT + 200 && elapsedMs < SEARCH_START;

  // Search progress
  const searchProgress = phase === 'searching'
    ? ((elapsedMs - SEARCH_START) / SEARCH_DURATION) * 100
    : phase === 'results' ? 100 : 0;
  const searchElapsedSec = phase === 'searching' || phase === 'results'
    ? Math.floor((Math.min(elapsedMs, SEARCH_END) - SEARCH_START) / 1000)
    : 0;
  const simulatedCount = phase === 'results' ? MAX_CONTACTS : Math.floor((searchProgress / 100) * MAX_CONTACTS);
  const isComplete = phase === 'results';

  const providers: ProviderStatus[] = [
    {
      id: 'web', label: 'Web-Analyse', icon: 'globe',
      status: phase === 'results' ? '24 Seiten analysiert' : elapsedMs > SEARCH_START + 2000 ? `${Math.min(Math.floor((elapsedMs - SEARCH_START) / 400), 24)} Seiten…` : 'Analyse…',
      isActive: phase === 'searching', isDone: isComplete,
    },
    {
      id: 'enrichment', label: 'Datenanreicherung', icon: 'database',
      status: phase === 'results' ? '25 angereichert' : elapsedMs > SEARCH_START + 3000 ? 'Anreichern…' : 'Warte…',
      isActive: phase === 'searching' && elapsedMs > SEARCH_START + 3000, isDone: isComplete,
    },
    {
      id: 'scoring', label: 'Qualitätsbewertung', icon: 'search',
      status: phase === 'results' ? '25 bewertet' : elapsedMs > SEARCH_START + 5000 ? 'Bewertung…' : 'Warte…',
      isActive: phase === 'searching' && elapsedMs > SEARCH_START + 5000, isDone: isComplete,
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Phase 1: Input Mask with Typing Animation ── */}
      {(phase === 'typing' || phase === 'consent') && (
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <h3 className="text-sm font-semibold">Auftrag definieren</h3>
          </div>

          {/* Suchintent Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> Suchintent
            </label>
            <div className="relative">
              <div className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[38px] flex items-center">
                <span>{typedText}</span>
                {showCursor && (
                  <span className="inline-block w-[2px] h-4 bg-primary animate-pulse ml-0.5" />
                )}
              </div>
            </div>
          </div>

          {/* Region Field */}
          <div className={cn('space-y-1.5 transition-all duration-500', regionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')}>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Region
            </label>
            <div className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[38px] flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{REGION_TEXT}</span>
              <Badge variant="outline" className="text-[10px] ml-auto">Standort erkannt</Badge>
            </div>
          </div>

          {/* Branche Field */}
          <div className={cn('space-y-1.5 transition-all duration-500', brancheVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')}>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Branche
            </label>
            <div className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[38px] flex items-center">
              {BRANCHE_TEXT}
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 2: Consent & Credits ── */}
      {phase === 'consent' && (
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <h3 className="text-sm font-semibold">Credits & Bestätigung</h3>
          </div>

          {/* Credit Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <CreditCard className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">25 Kontakte × 0,50 € = 12,50 €</p>
              <p className="text-[10px] text-muted-foreground">Credits werden erst bei Übernahme abgebucht</p>
            </div>
            <Badge className="text-xs">25 Credits</Badge>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3">
            <label className={cn('flex items-start gap-2.5 text-xs transition-all duration-300', consent1Checked ? 'opacity-100' : 'opacity-50')}>
              <Checkbox checked={consent1Checked} disabled className="mt-0.5" />
              <span>Ich bestätige die Abbuchung der Credits für diese Recherche.</span>
            </label>
            <label className={cn('flex items-start gap-2.5 text-xs transition-all duration-300', consent2Checked ? 'opacity-100' : 'opacity-50')}>
              <Checkbox checked={consent2Checked} disabled className="mt-0.5" />
              <span>Die Ergebnisse dürfen mit meinem Kontaktbuch abgeglichen werden.</span>
            </label>
          </div>

          {/* Start Button */}
          <Button
            disabled
            className={cn(
              'w-full transition-all duration-300',
              buttonPulse && 'animate-pulse ring-2 ring-primary/50'
            )}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Recherche starten
          </Button>
        </div>
      )}

      {/* ── Phase 3: Live Search Progress ── */}
      {(phase === 'searching' || phase === 'results') && (
        <ResearchLiveProgress
          progress={searchProgress}
          contactsFound={simulatedCount}
          maxContacts={MAX_CONTACTS}
          elapsedSeconds={searchElapsedSec}
          providers={providers}
          contacts={visibleContacts}
          isComplete={isComplete}
          phase={phase === 'searching' ? 'running' : 'done'}
        />
      )}

      {/* ── Phase 4+5: Results Table + CTA ── */}
      {isComplete && (
        <>
          <ResearchDemoResultsTable />

          {/* CTA Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Kontakte ins Kontaktbuch übernehmen</h3>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-600 font-medium">6 neue Kontakte</span> zur Übernahme · <span className="text-amber-600 font-medium">2 bereits vorhanden</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button disabled className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Ausgewählte ins Kontaktbuch übernehmen
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Excel-Export
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
