/**
 * ResearchFreeCard — Kachel 1: Allgemeine Recherche (Free)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Globe, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo result data
const DEMO_RESULT = {
  title: 'Marktanalyse Eigentumswohnungen Leipzig 2026',
  summary_md: `**Zusammenfassung:** Der Leipziger Wohnungsmarkt zeigt 2026 eine moderate Preissteigerung von 3,2 % gegenüber dem Vorjahr. Besonders gefragt sind Eigentumswohnungen in den Stadtteilen Connewitz, Plagwitz und Schleußig.\n\n**Kernaussagen:**\n- Durchschnittspreis: 2.850 €/m² (Bestand), 4.200 €/m² (Neubau)\n- Leerstandsquote gesunken auf 2,1 %\n- Mietrendite Bestand: 4,8 % brutto\n- Stärkste Nachfrage: 2–3 Zimmer, 55–80 m²\n- Demografischer Treiber: Zuzug junger Fachkräfte (+12.000/Jahr)`,
  sources: [
    { title: 'Immobilienmarktbericht Leipzig 2026', url: 'https://example.com/report1' },
    { title: 'Gutachterausschuss Sachsen', url: 'https://example.com/report2' },
    { title: 'IVD Marktdaten Mitteldeutschland', url: 'https://example.com/report3' },
    { title: 'Leipziger Volkszeitung – Immobilien', url: 'https://example.com/report4' },
    { title: 'Statistisches Landesamt Sachsen', url: 'https://example.com/report5' },
  ],
};

const RESEARCH_TARGETS = [
  { value: 'markt', label: 'Markt' },
  { value: 'firma', label: 'Firma' },
  { value: 'person', label: 'Person' },
  { value: 'objekt', label: 'Objekt' },
  { value: 'news', label: 'News' },
  { value: 'tech', label: 'Tech' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const EXAMPLE_QUERIES = [
  'Marktanalyse Eigentumswohnungen Leipzig 2026',
  'Hausverwaltungen mit digitalem Fokus in Bayern',
  'Aktuelle Zinsentwicklung Immobilienfinanzierung',
];

export function ResearchFreeCard() {
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<typeof DEMO_RESULT | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    // Simulate API call with demo data
    await new Promise(r => setTimeout(r, 1500));
    setResult(DEMO_RESULT);
    setIsLoading(false);
  };

  return (
    <Card className="glass-card border-primary/20 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Allgemeine Recherche
          </CardTitle>
          <Badge variant="outline" className="text-[9px] bg-status-success/10 text-status-success border-status-success/20">
            Free
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Input Area */}
        <Textarea
          placeholder="Was möchtest du recherchieren?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[100px] resize-none text-sm"
        />

        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Recherche-Ziel (optional)" />
          </SelectTrigger>
          <SelectContent>
            {RESEARCH_TARGETS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="w-full gap-2"
          size="sm"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {isLoading ? 'Recherchiere...' : 'Suchen (Free)'}
        </Button>

        {/* Results or Empty State */}
        {result ? (
          <div className="flex-1 overflow-auto space-y-3 border-t border-border/50 pt-3">
            <h4 className="font-semibold text-xs text-primary">{result.title}</h4>
            <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {result.summary_md}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quellen</p>
              {result.sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-primary/80 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        ) : !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground mb-2">
              KI-gestützte Webrecherche mit strukturierter Zusammenfassung
            </p>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground/70">Beispiele:</p>
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q)}
                  className="block text-[10px] text-primary/70 hover:text-primary cursor-pointer transition-colors"
                >
                  „{q}"
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
