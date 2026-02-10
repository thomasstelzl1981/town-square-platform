/**
 * Selfie Ads Zusammenfassung — Mandat (Zone 2)
 * Read-only Mandatsakte + CTA "Beauftragen & bezahlen"
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Image, CreditCard, ArrowLeft, CheckCircle2, MapPin, Calendar, Target, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SelfieAdsSummary() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-1 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/leads/selfie-ads-planen')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Mandat Zusammenfassung</h1>
          <p className="text-sm text-muted-foreground">Kaufy Selfie Ads — Prüfen & Beauftragen</p>
        </div>
      </div>

      {/* Mandatsdaten */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Mandatsdaten</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><span className="text-muted-foreground text-xs">Ziel</span><p className="font-medium">Kapitalanleger-Leads</p></div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><span className="text-muted-foreground text-xs">Budget</span><p className="font-medium">2.500 €</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><span className="text-muted-foreground text-xs">Laufzeit</span><p className="font-medium">01.03. – 31.03.2026</p></div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><span className="text-muted-foreground text-xs">Regionen</span><p className="font-medium">München</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><span className="text-muted-foreground text-xs">Zielgruppe</span><p className="font-medium">Kapitalanlage, Immobilien</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium flex items-center gap-2"><Image className="h-4 w-4" /> Template-Slots</h3>
          <div className="space-y-2">
            {['T1: Rendite-Highlight', 'T3: Objekt-Showcase', 'T5: Region-Focus'].map((t) => (
              <div key={t} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">{t}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">Generiert</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Kaufy veröffentlicht 3 Anzeigenvarianten über Kaufy Social-Media-Accounts</p>
        </CardContent>
      </Card>

      {/* Deliverables */}
      <Card className="glass-card">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-medium">Leistungsumfang</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✓ 3 Slideshow-Anzeigen (je 4 Slides + Caption + CTA)</li>
            <li>✓ Veröffentlichung über Kaufy Facebook + Instagram</li>
            <li>✓ Lead-Erfassung & automatische Zuordnung</li>
            <li>✓ Auto-Responder E-Mail an Leads</li>
            <li>✓ Performance-Dashboard & Lead-Inbox</li>
          </ul>
        </CardContent>
      </Card>

      <Separator />

      {/* CTA */}
      <Button size="lg" className="w-full gap-2 text-base">
        <CreditCard className="h-5 w-5" />
        Beauftragen & bezahlen — 2.500 €
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Prepayment. Nach Zahlung wird das Mandat an Kaufy übergeben.
      </p>
    </div>
  );
}
