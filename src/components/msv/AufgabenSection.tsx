/**
 * AufgabenSection — Kachel 2: Säumig + Mahnen + Mieterhöhung
 * 
 * Nutzt useMSVData für echte DB-Anbindung + Demo-Fallback.
 * Mahnstufen-Buttons erzeugen letter_drafts aus msv_templates.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Calendar, Mail, FileText, Settings } from 'lucide-react';
import { PremiumLockBanner } from './PremiumLockBanner';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';
import { useMSVData } from '@/hooks/useMSVData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAHNSTUFEN_LABELS = [
  'Beobachtung',
  'Zahlungserinnerung',
  'Mahnung',
  'Letzte Mahnung',
];

const TEMPLATE_CODES: Record<number, string> = {
  1: 'ZAHLUNGSERINNERUNG',
  2: 'MAHNUNG',
  3: 'LETZTE_MAHNUNG',
};

interface AufgabenSectionProps {
  propertyId?: string | null;
}

export function AufgabenSection({ propertyId }: AufgabenSectionProps) {
  const [faelligkeitstag, setFaelligkeitstag] = useState(5);
  const [gracePeriod, setGracePeriod] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState<string | null>(null);
  const { getOverdueCases, getRentIncreaseCases, refetch } = useMSVData();
  const { activeTenantId, profile } = useAuth();

  const overdueCases = getOverdueCases(propertyId ?? null);
  const rentIncreaseCases = getRentIncreaseCases(propertyId ?? null);

  const createDraft = async (stufe: number, caseData: typeof overdueCases[0]) => {
    if (caseData.id.startsWith('__demo_')) {
      toast.success(`Demo: ${MAHNSTUFEN_LABELS[stufe]} an ${caseData.mieter}`, {
        description: 'Im Demo-Modus werden keine echten Entwürfe erstellt.',
      });
      return;
    }

    const templateCode = TEMPLATE_CODES[stufe];
    if (!templateCode || !activeTenantId) return;

    setCreatingDraft(caseData.id);
    try {
      // Load template
      const { data: template } = await supabase
        .from('msv_templates')
        .select('*')
        .eq('template_code', templateCode)
        .eq('is_active', true)
        .single();

      if (!template) {
        toast.error('Vorlage nicht gefunden');
        return;
      }

      // Replace placeholders
      let content = template.content || '';
      const now = new Date();
      const frist = new Date();
      frist.setDate(frist.getDate() + 7);

      const replacements: Record<string, string> = {
        '{ANREDE}': '', // from contact
        '{NACHNAME}': caseData.mieter.split(' ').pop() || '',
        '{MONAT_JAHR}': `${now.toLocaleString('de-DE', { month: 'long' })} ${now.getFullYear()}`,
        '{UNIT_ID}': caseData.unitId,
        '{ADRESSE_KURZ}': caseData.adresse,
        '{OFFENER_BETRAG}': `${caseData.offenerBetrag.toLocaleString('de-DE')} €`,
        '{FRISTDATUM}': frist.toLocaleDateString('de-DE'),
        '{FAELLIGKEITSDATUM}': caseData.ueberfaelligSeit,
        '{ABSENDER_NAME}': profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || '',
        '{ABSENDER_FUNKTION}': 'Hausverwaltung',
        '{ABSENDER_KONTAKT}': '',
        '{VERWENDUNGSZWECK}': `Miete ${now.toLocaleString('de-DE', { month: 'long' })} ${now.getFullYear()} ${caseData.unitId}`,
      };

      for (const [key, value] of Object.entries(replacements)) {
        content = content.split(key).join(value);
      }

      // Create letter_draft
      const { error } = await supabase.from('letter_drafts').insert({
        tenant_id: activeTenantId,
        template_code: templateCode,
        subject: `${MAHNSTUFEN_LABELS[stufe]} — ${caseData.unitId}`,
        body: content,
        status: 'draft',
        recipient_name: caseData.mieter,
        metadata: {
          source: 'msv',
          stufe,
          unit_id: caseData.unitId,
          property_id: caseData.propertyId,
        },
      });

      if (error) throw error;

      // Update dunning stage on payment if applicable
      if (caseData.leaseId) {
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        await supabase
          .from('msv_rent_payments')
          .update({
            dunning_stage: stufe,
            dunning_last_sent_at: now.toISOString(),
          })
          .eq('unit_id', caseData.id)
          .eq('period_month', currentMonth)
          .eq('period_year', currentYear);
      }

      toast.success(`${MAHNSTUFEN_LABELS[stufe]} erstellt`, {
        description: 'Entwurf in KI-Office (MOD-02) angelegt.',
      });
      refetch();
    } catch (err: any) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setCreatingDraft(null);
    }
  };

  const createRentIncreaseDraft = async (caseData: typeof rentIncreaseCases[0]) => {
    if (caseData.id.startsWith('__demo_')) {
      toast.success('Demo: Mieterhöhungsschreiben erstellt');
      return;
    }

    if (!activeTenantId) return;

    try {
      const { data: template } = await supabase
        .from('msv_templates')
        .select('*')
        .eq('template_code', 'MIETERHOEHUNG')
        .eq('is_active', true)
        .single();

      if (!template) {
        toast.error('Vorlage MIETERHOEHUNG nicht gefunden');
        return;
      }

      let content = template.content || '';
      content = content.split('{NACHNAME}').join(caseData.mieter.split(' ').pop() || '');
      content = content.split('{UNIT_ID}').join(caseData.unitId);
      content = content.split('{DATUM_LETZTE_MIETERHOEHUNG}').join(caseData.letzteErhoehung || 'unbekannt');
      content = content.split('{ABSENDER_NAME}').join(profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || '');

      const { error } = await supabase.from('letter_drafts').insert({
        tenant_id: activeTenantId,
        template_code: 'MIETERHOEHUNG',
        subject: `Mieterhöhung — ${caseData.unitId}`,
        body: content,
        status: 'draft',
        recipient_name: caseData.mieter,
        metadata: { source: 'msv', unit_id: caseData.unitId },
      });

      if (error) throw error;
      toast.success('Mieterhöhungsschreiben erstellt');
    } catch (err: any) {
      toast.error(`Fehler: ${err.message}`);
    }
  };

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
              <p className="text-sm text-muted-foreground">
                {propertyId ? 'Keine säumigen Mietverhältnisse' : 'Bitte ein Objekt oben auswählen.'}
              </p>
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
                      <p className="text-sm">{c.ueberfaelligSeit || '–'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Letzte Zahlung</span>
                      <p className="text-sm">{c.letzteZahlung.datum || '–'} — {c.letzteZahlung.betrag > 0 ? `${c.letzteZahlung.betrag} €` : '–'}</p>
                    </div>
                  </div>

                  <Textarea placeholder="Notiz…" className="text-xs h-16" defaultValue={c.notiz} />

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={creatingDraft === c.id} onClick={() => createDraft(1, c)}>
                      <Mail className="h-3 w-3 mr-1" /> Erinnerung (Stufe 1)
                    </Button>
                    <Button size="sm" variant="outline" disabled={creatingDraft === c.id} onClick={() => createDraft(2, c)}>
                      <FileText className="h-3 w-3 mr-1" /> Mahnung (Stufe 2)
                    </Button>
                    <Button size="sm" variant="destructive" disabled={creatingDraft === c.id} onClick={() => createDraft(3, c)}>
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
              <p className="text-sm text-muted-foreground">
                {propertyId ? 'Keine Mieterhöhungen fällig' : 'Bitte ein Objekt oben auswählen.'}
              </p>
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
                  <Button size="sm" variant="outline" onClick={() => createRentIncreaseDraft(c)}>
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