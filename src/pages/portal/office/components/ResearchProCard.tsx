/**
 * ResearchProCard — Kachel 2: Profi-Kontaktrecherche (Pro)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Users, Sparkles, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResearchProCardProps {
  onCandidatesFound?: (count: number) => void;
}

export function ResearchProCard({ onCandidatesFound }: ResearchProCardProps) {
  const [company, setCompany] = useState('');
  const [domain, setDomain] = useState('');
  const [role, setRole] = useState('');
  const [region, setRegion] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);

  // Simulate Apollo key check
  const hasApolloKey = true; // Demo: always active

  const handleSearch = async () => {
    if (!company.trim() && !domain.trim()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    const count = 10;
    setCandidateCount(count);
    onCandidatesFound?.(count);
    setIsLoading(false);
  };

  const handleSuggestFilters = () => {
    setRole('Geschäftsführer');
    setRegion('München');
    setKeywords('Hausverwaltung, Immobilien');
  };

  if (!hasApolloKey) {
    return (
      <Card className="glass-card border-amber-500/20 flex flex-col h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            Profi-Kontaktrecherche
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <AlertTriangle className="h-8 w-8 text-amber-500/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Pro-Integration nicht aktiv</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Apollo API-Key in Zone 1 → Integrationen hinterlegen
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Profi-Kontaktrecherche
          </CardTitle>
          <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
            Pro
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2.5">
        <div className="space-y-2">
          <div>
            <Label className="text-[10px]">Firma / Domain</Label>
            <Input
              placeholder="z.B. Hausverwaltung Müller GmbH"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px]">Branche</Label>
            <Input
              placeholder="z.B. Immobilienverwaltung"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Rolle</Label>
              <Input
                placeholder="z.B. GF"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px]">Region</Label>
              <Input
                placeholder="z.B. München"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Keywords</Label>
            <Input
              placeholder="z.B. WEG, Mietverwaltung"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSuggestFilters}
          className="w-full gap-2 text-xs h-7"
        >
          <Sparkles className="h-3 w-3" />
          Schlage Filter vor
        </Button>

        <Button
          onClick={handleSearch}
          disabled={(!company.trim() && !domain.trim()) || isLoading}
          className="w-full gap-2"
          size="sm"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {isLoading ? 'Suche läuft...' : 'Kontakte suchen (Pro)'}
        </Button>

        <p className="text-[10px] text-muted-foreground/60 text-center">
          Max. 25 Kandidaten pro Suche · 1 Credit pro Übernahme
        </p>

        {candidateCount !== null && (
          <div className="border-t border-border/50 pt-3 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <span>{candidateCount} Kandidaten gefunden</span>
              <ArrowRight className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Kachel 3</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
