/**
 * ResearchDemoSimulation — Animated 3-phase demo using ResearchLiveProgress
 * Phase 1 (0-2s): Init
 * Phase 2 (2-10s): Running with contacts appearing one by one
 * Phase 3 (10s+): Done with full results table
 */
import { useState, useEffect, useRef } from 'react';
import { ResearchLiveProgress, type ProviderStatus, type LiveContact } from './ResearchLiveProgress';
import { ResearchDemoResultsTable } from './ResearchDemoResultsTable';

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

      // Add contacts progressively during phase 2 (2s-10s)
      if (ms >= 2000 && ms <= 10000) {
        const fraction = (ms - 2000) / 8000;
        const count = Math.min(Math.floor(fraction * DEMO_CONTACTS.length) + 1, DEMO_CONTACTS.length);
        setVisibleContacts(DEMO_CONTACTS.slice(0, count));
      } else if (ms > 10000) {
        setVisibleContacts(DEMO_CONTACTS);
      }

      if (ms >= 12000) {
        clearInterval(intervalRef.current);
      }
    }, 200);

    return () => clearInterval(intervalRef.current);
  }, []);

  const elapsedSec = Math.floor(elapsedMs / 1000);
  const phase: 'init' | 'running' | 'done' = elapsedMs < 2000 ? 'init' : elapsedMs < 10000 ? 'running' : 'done';
  const isComplete = phase === 'done';

  // Progress: 0% during init, 0-100% during running, 100% when done
  const progress = phase === 'init' ? 0 : phase === 'done' ? 100 : ((elapsedMs - 2000) / 8000) * 100;

  // Simulated contact count (scales to 37)
  const simulatedCount = phase === 'init' ? 0 : phase === 'done' ? MAX_CONTACTS : Math.floor((progress / 100) * MAX_CONTACTS);

  const providers: ProviderStatus[] = [
    {
      id: 'web',
      label: 'Web-Analyse',
      icon: 'globe',
      status: phase === 'init' ? 'Warte…' : phase === 'done' ? '24 Seiten analysiert' : elapsedMs > 4000 ? `${Math.min(Math.floor((elapsedMs - 2000) / 400), 24)} Seiten…` : 'Analyse…',
      isActive: phase === 'running',
      isDone: isComplete,
    },
    {
      id: 'enrichment',
      label: 'Datenanreicherung',
      icon: 'database',
      status: phase === 'init' ? 'Warte…' : phase === 'done' ? '25 angereichert' : elapsedMs > 5000 ? 'Anreichern…' : 'Warte…',
      isActive: phase === 'running' && elapsedMs > 5000,
      isDone: isComplete,
    },
    {
      id: 'scoring',
      label: 'Qualitätsbewertung',
      icon: 'search',
      status: phase === 'init' ? 'Warte…' : phase === 'done' ? '25 bewertet' : elapsedMs > 7000 ? 'Bewertung…' : 'Warte…',
      isActive: phase === 'running' && elapsedMs > 7000,
      isDone: isComplete,
    },
  ];

  return (
    <div className="space-y-4">
      <ResearchLiveProgress
        progress={progress}
        contactsFound={simulatedCount}
        maxContacts={MAX_CONTACTS}
        elapsedSeconds={elapsedSec}
        providers={providers}
        contacts={visibleContacts}
        isComplete={isComplete}
        phase={phase}
      />

      {/* Show full results table after completion */}
      {isComplete && <ResearchDemoResultsTable />}
    </div>
  );
}
