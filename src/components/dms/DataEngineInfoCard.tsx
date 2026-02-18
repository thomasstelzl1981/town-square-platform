/**
 * DataEngineInfoCard — Document Intelligence Engine Overview
 * Shows Phase 1 (current) and Phase 2 (planned) capabilities
 */
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Database, Brain, CloudCog, Plug, ArrowRight, Lock,
  CheckCircle, Clock, FileSearch, Sparkles, Cpu, Zap,
} from 'lucide-react';

interface EngineFeature {
  icon: typeof CheckCircle;
  label: string;
  status: 'live' | 'planned';
  detail: string;
}

const PHASE_1: EngineFeature[] = [
  { icon: FileSearch, label: 'Posteingangs-Extraktion', status: 'live', detail: 'Automatische OCR & KI-Auslesung eingehender PDFs (1 Credit/PDF)' },
  { icon: Brain, label: 'Armstrong Dokumenten-Zugriff', status: 'live', detail: 'Armstrong kann Dokumente aus dem Storage per Vision-API lesen' },
  { icon: Database, label: 'Volltextsuche (document_chunks)', status: 'live', detail: 'Deutsche TSVector-Suche über extrahierte Dokumententexte' },
  { icon: Sparkles, label: 'Auto-Sortierung', status: 'live', detail: 'Keyword-basierte Zuordnung zu Akten via Sortierregeln' },
  { icon: Cpu, label: 'Datentyp-Erkennung', status: 'live', detail: 'KI erkennt Dokumententyp (Rechnung, Vertrag, Bescheid, etc.)' },
  { icon: Lock, label: 'Credit-Preflight System', status: 'live', detail: 'Saldo-Prüfung vor kostenpflichtigen Aktionen (100 Gratis-Credits bei Start)' },
  { icon: Zap, label: 'Auto-Trigger Pipeline', status: 'live', detail: 'PDF-Upload → Credit-Check → Gemini-Extraktion → document_chunks (vollautomatisch)' },
];

const PHASE_2: EngineFeature[] = [
  { icon: CloudCog, label: 'Storage-Extraktion (eigene Dateien)', status: 'live', detail: 'Button "Dokument auslesen" im DMS → Gemini Vision → document_chunks (1 Credit/Dok)' },
  { icon: Plug, label: 'Google Drive / Dropbox Sync', status: 'planned', detail: 'OAuth-Anbindung externer Cloud-Speicher mit Index-Aufbau' },
  { icon: Zap, label: 'End-to-End NK-Abrechnung', status: 'planned', detail: 'Automatische Zuordnung von NK-Belegen zu Positionen' },
  { icon: Database, label: 'FinAPI Konto-Matching', status: 'planned', detail: 'Transaktionen ↔ Verträge automatisch abgleichen' },
  { icon: Lock, label: 'Embedding-Index (RAG)', status: 'planned', detail: 'Vektor-Suche für Armstrong-Kontext über alle Dokumente' },
];

export function DataEngineInfoCard() {
  return (
    <Card className="glass-card flex flex-col overflow-hidden md:col-span-2 lg:col-span-4">
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Document Intelligence Engine</h3>
            <p className="text-xs text-muted-foreground">Datenverarbeitungs-Pipeline — Status & Roadmap</p>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phase 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">
                Phase 1 — Live
              </Badge>
              <span className="text-xs text-muted-foreground">Aktueller Stand</span>
            </div>
            <div className="space-y-3">
              {PHASE_1.map((f) => (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5">
                  <f.icon className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{f.label}</p>
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="p-3 rounded-xl border border-primary/10 bg-primary/5 mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Kostenmodell Phase 1</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Posteingang PDF-Extraktion: <span className="font-mono font-medium text-foreground">1 Credit (0,25 €)</span> pro PDF</p>
                <p>• Armstrong-Dokumentenzugriff: <span className="font-mono font-medium text-foreground">Inkl. in Action-Credits</span></p>
                <p>• Volltextsuche: <span className="font-mono font-medium text-foreground">Kostenlos</span></p>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20" variant="outline">
                Phase 2 — Roadmap
              </Badge>
              <span className="text-xs text-muted-foreground">Geplante Erweiterungen</span>
            </div>
            <div className="space-y-3">
              {PHASE_2.map((f) => (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/30">
                  <f.icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{f.label}</p>
                      <Clock className="h-3 w-3 text-amber-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Note */}
            <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground mt-4">
              <p className="font-medium text-foreground text-sm mb-1">Technische Voraussetzungen</p>
              <p>• Storage-Extraktion: ✅ Live (sot-storage-extract Edge Function)</p>
              <p>• Cloud-Sync: OAuth2 Flow + Token-Management (GDPR)</p>
              <p>• FinAPI: Externe API-Anbindung (§34f lizenzpflichtig)</p>
              <p>• RAG-Index: pgvector Extension + Embedding-Pipeline</p>
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="mt-6 p-4 rounded-xl border border-border/50 bg-muted/20">
          <p className="text-sm font-medium text-foreground mb-2">Pipeline-Architektur</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">Quelle</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2 py-1 rounded-md bg-muted font-medium">Posteingang · Storage · Cloud</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">Parser</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2 py-1 rounded-md bg-muted font-medium">Gemini Vision · OCR</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">Index</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2 py-1 rounded-md bg-muted font-medium">document_chunks · TSVector</span>
            <ArrowRight className="h-3 w-3" />
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">Armstrong</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
