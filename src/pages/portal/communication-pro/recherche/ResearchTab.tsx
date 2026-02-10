/**
 * ResearchTab — 3-Kachel Container für Recherche-Feature
 * MOD-14 Communication Pro > Recherche
 * 
 * Glassmorphism-Design mit 3 Kacheln:
 * 1. Allgemeine Recherche (Free)
 * 2. Profi-Kontaktrecherche (Pro)
 * 3. Gefundene Kontakte (Übernahme)
 */

import { Card } from '@/components/ui/card';
import { ResearchFreeCard } from './ResearchFreeCard';
import { ResearchProCard } from './ResearchProCard';
import { ResearchCandidatesTray } from './ResearchCandidatesTray';

export function ResearchTab() {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ResearchFreeCard />
          <ResearchProCard />
          <ResearchCandidatesTray />
        </div>
      </div>
    </Card>
  );
}
