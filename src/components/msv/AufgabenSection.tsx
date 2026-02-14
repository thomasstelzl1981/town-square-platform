/**
 * AufgabenSection — Kachel 2: Säumig + Mahnen + Mieterhöhung
 * 
 * IMMER sichtbar — auch ohne säumige Fälle (Empty State Cards).
 * Mahnstufen 0-3, konfigurierbare Fälligkeit/Grace, Draft-Erzeugung.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Calendar, Mail, FileText, Settings, Bell } from 'lucide-react';
import { PremiumLockBanner } from './PremiumLockBanner';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';

// Demo säumige Fälle
const DEMO_OVERDUE = [
  {
    id: '__demo_overdue_1__',
    unitId: 'WE-002',
    adresse: 'Königsallee 42, Düsseldorf',
    mieter: 'Anna Schmidt',
    offenerBetrag: 480,
    ueberfaelligSeit: '2026-02-07',
    letzteZahlung: { datum: '2026-02-05', betrag: 500 },
    mahnstufe: 0,
    notiz: '',
  },
];

// Demo Mieterhöhung
const DEMO_RENT_INCREASE = [
  {
    id: '__demo_ri_1__',
    unitId: 'WE-001',
    mieter: 'Thomas Müller',
    letzteErhoehung: '2023-01-01',
    pruefbarSeit: '2026-01-01',
  },
  {
    id: '__demo_ri_2__',
    unitId: 'WE-004',
    mieter: 'Datum fehlt',
    letzteErhoehung: null,
    pruefbarSeit: null,
  },
];

const MAHNSTUFEN_LABELS = [
  'Beobachtung',
  'Zahlungserinnerung',
  'Mahnung',
  'Letzte Mahnung',
];

function createDraft(stufe: number, mieter: string) {
  toast.success(`Draft erstellt: ${MAHNSTUFEN_LABELS[stufe]} an ${mieter}`, {
    description: 'Der Entwurf wurde in der Kommunikation (MOD-02) angelegt.',
  });
}

interface AufgabenSectionProps {
  propertyId?: string | null;
}

export function AufgabenSection({ propertyId }: AufgabenSectionProps) {
  const [faelligkeitstag, setFaelligkeitstag] = useState(5);
  const [gracePeriod, setGracePeriod] = useState(2);
  const [showSettings, setShowSettings] = useState(false);

  const overdueCases = DEMO_OVERDUE;
  const rentIncreaseCases = DEMO_RENT_INCREASE;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Kachel 2: Aufgaben</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="h-4 w-4 mr-1" /> Einstellungen
        </Button>
      </div>

      {/* Konfiguration */}
      {showSettings && (
        <Card className={DESIGN.CARD.SECTION}>
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Fälligkeitstag (Kalendertag)</label>
              <Input type="number" value={faelligkeitstag} onChange={e => setFaelligkeitstag(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Grace Period (Tage)</label>
              <Input type="number" value={gracePeriod} onChange={e => setGracePeriod(Number(e.target.value))} className="mt-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abschnitt A: Säumige Mietverhältnisse */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" /> Säumige Mietverhältnisse
        </h3>

        {overdueCases.length === 0 ? (
          <Card className={DESIGN.CARD.SECTION}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Keine säumigen Mietverhältnisse</p>
              <Button variant="link" size="sm" className="mt-1">Filter ansehen</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overdueCases.map(c => (
              <Card key={c.id} className="glass-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.unitId}</span>
                    <span className="text-xs text-muted-foreground">{c.adresse}</span>
                  </div>
                  <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0 text-xs">
                    Stufe {c.mahnstufe}: {MAHNSTUFEN_LABELS[c.mahnstufe]}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Mieter</span>
                      <p className="font-medium">{c.mieter}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Offener Betrag</span>
                      <p className="font-semibold text-destructive">{c.offenerBetrag.toLocaleString('de-DE')} €</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Überfällig seit</span>
                      <p className="text-sm">{c.ueberfaelligSeit}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Letzte Zahlung</span>
                      <p className="text-sm">{c.letzteZahlung.datum} — {c.letzteZahlung.betrag} €</p>
                    </div>
                  </div>

                  <Textarea placeholder="Notiz…" className="text-xs h-16" defaultValue={c.notiz} />

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => createDraft(1, c.mieter)}>
                      <Mail className="h-3 w-3 mr-1" /> Erinnerung (Stufe 1)
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => createDraft(2, c.mieter)}>
                      <FileText className="h-3 w-3 mr-1" /> Mahnung (Stufe 2)
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => createDraft(3, c.mieter)}>
                      <AlertTriangle className="h-3 w-3 mr-1" /> Letzte Mahnung (Stufe 3)
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Vor Versand prüfen. Keine Rechtsberatung.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Abschnitt B: Mieterhöhung prüfbar */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> Mieterhöhung prüfbar (36 Monate)
        </h3>

        {rentIncreaseCases.length === 0 ? (
          <Card className={DESIGN.CARD.SECTION}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Keine Mieterhöhungen fällig</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rentIncreaseCases.map(c => (
              <Card key={c.id} className="glass-card overflow-hidden">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{c.unitId} · {c.mieter}</span>
                    <Badge variant={c.letzteErhoehung ? 'secondary' : 'destructive'} className="text-xs">
                      {c.letzteErhoehung ? 'Prüfbar' : 'Datum fehlt'}
                    </Badge>
                  </div>
                  {c.letzteErhoehung ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Letzte Erhöhung: <span className="font-medium text-foreground">{c.letzteErhoehung}</span></p>
                      <p>Prüfbar seit: <span className="font-medium text-foreground">{c.pruefbarSeit}</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Bitte Datum der letzten Mieterhöhung erfassen.</p>
                  )}
                  <Button size="sm" variant="outline" onClick={() => toast.success('Mieterhöhungsschreiben erstellt')}>
                    <FileText className="h-3 w-3 mr-1" /> {c.letzteErhoehung ? 'Schreiben erzeugen' : 'Datum setzen'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Premium Lock */}
      <PremiumLockBanner
        title="Auto-Mahnstufen-Reminder"
        description="Premium: Automatische Erinnerungen und Eskalation bei überfälligen Zahlungen."
      />
    </div>
  );
}
