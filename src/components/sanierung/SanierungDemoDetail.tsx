/**
 * SanierungDemoDetail — Demo inline detail for Sanierung tab
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HardHat, ClipboardList, Search, BarChart3, X, Star, Phone, Mail, Paperclip, MapPin, CheckCircle2, Clock, Send } from 'lucide-react';
import { SectionCard } from '@/components/shared/SectionCard';
import { SanierungStepper } from '@/components/sanierung/SanierungStepper';
import { DESIGN } from '@/config/designManifest';
import {
  DEMO_SANIERUNG_SCOPE_ITEMS as DEMO_SCOPE_ITEMS,
  DEMO_SANIERUNG_TOTAL as DEMO_TOTAL,
  DEMO_SANIERUNG_PROVIDERS as DEMO_PROVIDERS,
} from '@/engines/demoData/data';

const fmt = (v: number) => v.toLocaleString('de-DE') + ' €';

interface Props { onClose: () => void; }

export function SanierungDemoDetail({ onClose }: Props) {
  return (
    <div className="pt-6">
      <div className={DESIGN.SPACING.SECTION}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight">Kernsanierung WE-B01 — Schadowstr., Berlin</h2>
              <Badge className="bg-primary/10 text-primary border-0">Demo</Badge>
              <Badge variant="secondary">offers_received</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">SAN-DEMO-001</Badge>
              <span>•</span>
              <Badge variant="secondary" className="text-xs"><HardHat className="h-3 w-3 mr-1" />Kernsanierung</Badge>
              <span>•</span><span>Schadowstr., 10117 Berlin</span><span>•</span><span>ETW, 85 m²</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <SanierungStepper currentStatus="offers_received" />

        {/* Section 1: Leistungsumfang */}
        <SectionCard title="Leistungsumfang" description="KI-generierte Beschreibung, Kostenschätzung und Leistungsverzeichnis" icon={ClipboardList}>
          <div className={DESIGN.FORM_GRID.FULL}>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">KI-generierte Beschreibung</p>
              <Textarea readOnly className="min-h-[160px] text-sm bg-muted/20 border-border/30 cursor-default"
                value={`Kernsanierung der 85 m² Eigentumswohnung WE-B01 in der Schadowstraße, 10117 Berlin-Mitte.\n\nUmfang:\n• Neue Bodenbeläge in allen Wohnräumen (Eiche Landhausdiele, ca. 65 m²)\n• Feinsteinzeug-Fliesen in Nassräumen (ca. 20 m²)\n• Komplette Badsanierung inkl. bodengleicher Dusche, Hänge-WC, Doppelwaschtisch und Armaturen (Hansgrohe/Grohe)\n• Gäste-WC: WC, Handwaschbecken, Spiegelschrank\n• Malerarbeiten sämtlicher Wände und Decken (Q3-Qualität)\n\nAusführungsstandard: Mittlerer Standard (keine Luxusausstattung).\nGeschätzte Bauzeit: 6–8 Wochen.`}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">KI-Kostenschätzung</p>
              <div className="rounded-lg border border-border/30 bg-muted/10 p-4 space-y-4">
                <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"><span className="text-sm text-muted-foreground">Minimum</span><span className="font-semibold tabular-nums text-sm">{fmt(18500)}</span></div>
                <div className="flex items-center justify-between py-3 px-3 rounded-md bg-primary/10 border border-primary/20"><span className="text-sm font-medium">Mittelwert</span><span className="font-bold tabular-nums text-primary">{fmt(22500)}</span></div>
                <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"><span className="text-sm text-muted-foreground">Maximum</span><span className="font-semibold tabular-nums text-sm">{fmt(27000)}</span></div>
                <p className="text-[11px] text-muted-foreground text-center pt-1">Basierend auf 85 m² · mittlerer Standard · Berlin-Mitte · Q1 2026</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Leistungsverzeichnis — 5 Positionen</p>
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/30 border-b border-border/30"><th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-10">Pos.</th><th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Leistung</th><th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground w-28">Kosten</th></tr></thead>
                <tbody>
                  {DEMO_SCOPE_ITEMS.map(item => (<tr key={item.pos} className="border-b border-border/20"><td className="py-2 px-3 text-muted-foreground">{item.pos}</td><td className="py-2 px-3">{item.title}</td><td className="py-2 px-3 text-right tabular-nums font-medium">{fmt(item.cost)}</td></tr>))}
                  <tr className="font-bold bg-muted/20"><td className="py-2 px-3" /><td className="py-2 px-3">Gesamt</td><td className="py-2 px-3 text-right tabular-nums">{fmt(DEMO_TOTAL)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ausschreibungsbeschreibung</p>
            <Textarea readOnly className="min-h-[100px] text-sm bg-muted/20 border-border/30 cursor-default"
              value="Kernsanierung einer 85 m² ETW (WE-B01) in der Schadowstraße, 10117 Berlin. Umfang: Neue Bodenbeläge (Eiche Landhausdiele + Feinsteinzeug), komplette Badsanierung mit bodengleicher Dusche, Gäste-WC-Sanierung und Malerarbeiten (Q3). Mittlerer Ausstattungsstandard. Bitte Angebot bis 28.02.2026 einreichen. Besichtigung nach Vereinbarung."
            />
          </div>
        </SectionCard>

        {/* Section 2: Dienstleister & Ausschreibung */}
        <SectionCard title="Dienstleister & Ausschreibung" description="Handwerker suchen, auswählen und Ausschreibung versenden" icon={Search}>
          <div className={DESIGN.FORM_GRID.FULL}>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Handwerker-Suche</p>
                <div className="flex gap-2">
                  <Input readOnly value="Handwerker Kernsanierung" className="bg-muted/20 cursor-default" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 shrink-0"><MapPin className="h-3 w-3" /> Berlin</div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Suchergebnisse (3)</p>
                {[
                  { name: 'Berliner Badsanierung GmbH', rating: 4.8, reviews: 127, phone: '030 1234567', email: 'info@berliner-bad.de', speciality: 'Bad & Sanitär' },
                  { name: 'Boden- und Fliesenwerk Mitte', rating: 4.5, reviews: 89, phone: '030 9876543', email: 'angebot@bfw-mitte.de', speciality: 'Böden & Fliesen' },
                  { name: 'Sanierung Plus Berlin', rating: 4.3, reviews: 64, phone: '030 5551234', email: 'kontakt@sanierung-plus.de', speciality: 'Komplettsanierung' },
                ].map((p, i) => (
                  <div key={i} className="rounded-lg border border-border/30 bg-muted/10 p-3 space-y-1.5">
                    <div className="flex items-center justify-between"><p className="font-medium text-sm">{p.name}</p><div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 text-amber-500 fill-amber-500" /><span className="font-medium">{p.rating}</span><span className="text-muted-foreground">({p.reviews})</span></div></div>
                    <p className="text-xs text-muted-foreground">{p.speciality}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span><span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span></div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ausgewählt (3)</p>
                {DEMO_PROVIDERS.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-primary/5 border border-primary/10 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="flex-1 font-medium">{p.name}</span>
                    {p.status === 'Angebot erhalten' ? <Badge variant="secondary" className="text-[10px]">Angebot da</Badge> : <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ausschreibungs-E-Mail</p>
              <div className="rounded-lg border border-border/30 bg-muted/10 p-4 space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground w-14">Betreff:</span><span className="font-medium">Angebotsanfrage Kernsanierung ETW — Schadowstr., Berlin</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground w-14">An:</span><span className="text-muted-foreground">3 Empfänger</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground w-14">Ref:</span><span className="font-mono text-xs text-primary">SAN-DEMO-001</span></div>
                </div>
                <div className="border-t border-border/20 pt-3 text-sm text-muted-foreground leading-relaxed space-y-2">
                  <p>Sehr geehrte Damen und Herren,</p>
                  <p>wir bitten um ein verbindliches Angebot für die Kernsanierung einer 85 m² Eigentumswohnung (WE-B01) in der Schadowstraße, 10117 Berlin-Mitte.</p>
                  <p><strong>Leistungsumfang:</strong><br />• Bodenbelag Wohnräume: Eiche Landhausdiele, ca. 65 m²<br />• Bodenbelag Nassräume: Feinsteinzeug 60×60, ca. 20 m²<br />• Badsanierung komplett inkl. bodengleicher Dusche<br />• Gäste-WC Sanierung<br />• Malerarbeiten Wände und Decken</p>
                  <p>Ausführungsstandard: Mittel. Geschätzte Bauzeit: 6–8 Wochen. Besichtigungstermin nach Vereinbarung.</p>
                  <p>Bitte beziehen Sie sich bei Rückantwort auf die Kennung <span className="font-mono text-primary font-medium">SAN-DEMO-001</span>.</p>
                  <p>Angebotsabgabe bis: <strong>28.02.2026</strong></p>
                  <p>Mit freundlichen Grüßen</p>
                </div>
                <div className="border-t border-border/20 pt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]"><Paperclip className="h-3 w-3 mr-1" /> Leistungsverzeichnis.pdf</Badge>
                  <Badge variant="outline" className="text-[10px]"><Paperclip className="h-3 w-3 mr-1" /> Grundriss_WE-B01.pdf</Badge>
                  <Badge variant="outline" className="text-[10px]"><Paperclip className="h-3 w-3 mr-1" /> Fotos_Bestand.zip</Badge>
                </div>
                <div className="border-t border-border/20 pt-3 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Versendet am 10.02.2026 an 3 Empfänger</p>
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]"><Send className="h-3 w-3 mr-1" /> Versendet</Badge>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Angebote & Vergabe */}
        <SectionCard title="Angebote & Vergabe" description="Eingehende Angebote vergleichen und Auftrag vergeben" icon={BarChart3}>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/40"><th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Position</th><th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Budget</th><th className="text-right py-2 px-3 text-xs font-medium text-primary">Berliner Badsanierung</th><th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Boden- & Fliesenwerk</th></tr></thead>
                <tbody>
                  {[
                    { title: 'Böden Wohnräume', budget: 5850, a: 5600, b: 6200 },
                    { title: 'Böden Nassräume', budget: 2400, a: 2300, b: 2500 },
                    { title: 'Badsanierung', budget: 8500, a: 8200, b: 9100 },
                    { title: 'Gäste-WC', budget: 3200, a: 3100, b: 3400 },
                    { title: 'Malerarbeiten', budget: 2550, a: 2600, b: 2700 },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/20">
                      <td className="py-2 px-3">{row.title}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{fmt(row.budget)}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-medium text-primary">{fmt(row.a)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{fmt(row.b)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold"><td className="py-2 px-3">Gesamt</td><td className="py-2 px-3 text-right tabular-nums">{fmt(DEMO_TOTAL)}</td><td className="py-2 px-3 text-right tabular-nums text-primary">{fmt(21800)}</td><td className="py-2 px-3 text-right tabular-nums">{fmt(23900)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <div><p className="text-sm font-semibold">Empfehlung: Berliner Badsanierung GmbH</p><p className="text-xs text-muted-foreground">Günstigstes Angebot — 3 % unter Budget ({fmt(21800)})</p></div>
              <Badge className="bg-primary text-primary-foreground">Bestes Angebot</Badge>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
