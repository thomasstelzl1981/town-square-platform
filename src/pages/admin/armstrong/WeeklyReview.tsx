/**
 * WeeklyReview — Zone 1 Armstrong Weekly Review Checklist
 * Interactive checklist with localStorage persistence
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Database, Layers, Bot, Gauge, Palette, Code2, Lightbulb, RotateCcw, CalendarCheck } from 'lucide-react';

interface ReviewItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
  notes: string;
}

const STORAGE_KEY = 'sot-weekly-review';

const DEFAULT_ITEMS: Omit<ReviewItem, 'checked' | 'notes'>[] = [
  { id: 'security', label: 'Security Scan', description: 'Offene Findings prüfen und beheben', icon: Shield },
  { id: 'demo-data', label: 'Demo-Daten', description: 'Seed + Cleanup funktional?', icon: Database },
  { id: 'modules', label: 'Module Status', description: 'Alle Tiles erreichbar und funktional?', icon: Layers },
  { id: 'armstrong', label: 'Armstrong', description: 'Knowledge Base aktuell? Logs geprüft?', icon: Bot },
  { id: 'performance', label: 'Performance', description: 'Langsame Queries? Bundle-Größe?', icon: Gauge },
  { id: 'ui-ux', label: 'UI/UX Konsistenz', description: 'Design-System eingehalten? Desk-Homogenität?', icon: Palette },
  { id: 'code-hygiene', label: 'Code-Hygiene', description: 'any-Types, leere Catches, TODO-Kommentare?', icon: Code2 },
  { id: 'features', label: 'Neue Features', description: 'Backlog priorisieren, nächste Schritte planen', icon: Lightbulb },
];

export default function WeeklyReview() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [lastReset, setLastReset] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setLastReset(parsed.lastReset || null);
        return;
      } catch { /* fallthrough */ }
    }
    resetChecklist();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, lastReset }));
    }
  }, [items, lastReset]);

  function resetChecklist() {
    const fresh = DEFAULT_ITEMS.map(item => ({ ...item, checked: false, notes: '' }));
    setItems(fresh);
    setLastReset(new Date().toISOString());
  }

  function toggleItem(id: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  }

  function updateNotes(id: string, notes: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  }

  const completed = items.filter(i => i.checked).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const weekNumber = getWeekNumber(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wöchentliches Review</h1>
          <p className="text-muted-foreground text-sm">KW {weekNumber} — Plattform-Prüfung und Planung</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-bold">{completed}/{total}</div>
            <div className="text-xs text-muted-foreground">{progress}% erledigt</div>
          </div>
          <Button onClick={resetChecklist} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {lastReset && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5" />
          Letzte Zurücksetzung: {new Date(lastReset).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid gap-3">
        {items.map(item => (
          <Card key={item.id} className={item.checked ? 'border-emerald-500/30 bg-emerald-500/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.checked ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                      {item.label}
                    </span>
                    {item.checked && <Badge variant="outline" className="text-xs text-emerald-500">✓</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <Textarea
                    placeholder="Notizen..."
                    value={item.notes}
                    onChange={e => updateNotes(item.id, e.target.value)}
                    className="min-h-[60px] text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000);
  return Math.ceil((days + oneJan.getDay() + 1) / 7);
}
