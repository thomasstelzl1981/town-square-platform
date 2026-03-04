

# Vollstaendige KI-Analyse: Armstrong Workspace & alle KI-Integrationen

## 1. Armstrong Workspace ↔ Orb Integration: Status

Die Integration funktioniert sauber. Der Datenfluss:

```text
ArmstrongWorkspace.tsx
  ├── orbState = f(advisor.isLoading, advisor.isExecuting, voice.isSpeaking, docUpload.isParsing)
  │     → idle | thinking | working | speaking
  ├── ArmstrongOrb (rein visuell, CSS-Animationen: ping, orbit, pulse)
  ├── useArmstrongAdvisor → sot-armstrong-advisor (Edge Function, 4446 Zeilen)
  │     → Gemini 2.5 Pro, 4000 Token, nicht-streaming
  ├── useArmstrongVoice → sot-armstrong-voice (WebSocket Proxy)
  │     → OpenAI gpt-4o-realtime (NICHT Lovable AI Gateway!)
  ├── useArmstrongDocUpload → sot-document-parser (Edge Function)
  │     → Gemini 2.5 Pro, 32000 Token, Vision
  └── useArmstrongProjects → armstrong_projects (CRUD)
```

**Bewertung**: Orb-States korrekt verdrahtet. Chat-Isolation per Projekt funktioniert (Map-Cache). Data-Mode wird im Request gesendet. SlashCommandPicker greift auf armstrongManifest.

**Problem identifiziert**: `sot-armstrong-voice` nutzt **OpenAI gpt-4o-realtime** via direkten API-Key (`OPENAI_API_KEY`), NICHT Lovable AI Gateway. Das ist die einzige Funktion die einen externen API-Key direkt nutzt statt des Gateways.

---

## 2. VOLLSTAENDIGE KI-BESTANDSAUFNAHME (50 Edge Functions mit AI)

### A. DOKUMENTENANALYSE (Schwerpunkt)

| # | Funktion | Modell | Token | Multimodal | Dateitypen | Extrahierte Felder | Kosten |
|---|----------|--------|-------|------------|------------|-------------------|--------|
| 1 | `sot-document-parser` | gemini-2.5-pro | 32.000 | Vision (PDF/Bild) | PDF, JPG, PNG, WEBP, DOCX, XLSX, CSV, XLS | 10 Modi: immobilie (11 Felder), finanzierung (9), versicherung (10), fahrzeugschein (10), pv_anlage (10), vorsorge (10), person (10), haustier (8), kontakt (7), allgemein (auto-detect) | 1 Cr (AI) / 0 Cr (XLSX/CSV direkt) |
| 2 | `sot-invoice-parse` | gemini-2.5-pro | 32.000 | Vision | PDF, Bild | vendor_name, invoice_number, amounts, VAT, IBAN, NK-Kategorie, property_hints | 1 Cr |
| 3 | `sot-nk-beleg-parse` | gemini-2.5-pro | 16.000 | Vision | PDF, Bild | provider, amounts, meter readings, consumption, cost_category + Cross-Validation-Modus | 1 Cr |
| 4 | `sot-weg-abrechnung-parse` | gemini-2.5-pro | 32.000 | Vision | PDF | WEG-Positionen, Umlageschluessel, Einzelabrechnungen, Ruecklagen | 1 Cr |
| 5 | `sot-storage-extract` | gemini-2.5-pro | 32.000 | Vision | PDF, Bild | Freitext → document_chunks + Embedding | 1 Cr |
| 6 | `sot-storage-extractor` | gemini-2.5-pro | 32.000 | Vision | PDF, Bild | Variante von storage-extract (Bulk?) | 1 Cr |
| 7 | `sot-inbound-receive` | gemini-2.5-pro | 32.000 | Nein (Text) | E-Mail-Body | Absender, Betreff, Kategorisierung, Auto-Sortierung | 1 Cr |
| 8 | `sot-extract-email` | gemini-2.5-pro | 8.000 | Nein | E-Mail-Text | Strukturierte Daten aus E-Mail-Inhalten | 0 Cr |
| 9 | `sot-extract-offer` | gemini-2.5-pro | 8.000 | Nein | Text | Immobilienangebote → Preis, Fläche, Rendite, Lage | 1 Cr |
| 10 | `sot-project-intake` | gemini-2.5-pro | 8.000 | Vision | PDF (Exposé) | Projektdaten + Einheitenliste via Tool-Calling | 10 Cr |
| 11 | `sot-acq-offer-extract` | gemini-2.5-pro | 8.000 | Nein | Text | Akquise-Angebotsdaten | 1 Cr |
| 12 | `sot-acq-profile-extract` | gemini-2.5-pro | — | Nein | Text | Ankaufsprofil-Extraktion | 1 Cr |
| 13 | `sot-excel-ai-import` | gemini-2.5-pro | — | Nein | XLSX/CSV | Generischer Excel-Import mit AI-Mapping | 1 Cr |
| 14 | `sot-embedding-pipeline` | gemini-2.5-pro | — | Nein | Text | 768d Vektoren fuer Hybrid-Suche | — |

**Sprache**: Alle Dokumente werden auf Deutsch verarbeitet. Prompts sind Deutsch. Gemischte Dokumente (EN/DE) werden unterstuetzt aber DE priorisiert.

**Bildanalyse/OCR**: Alle Vision-fähigen Parser nutzen Gemini Vision (base64-encoded images/PDFs). Kein separates OCR — Gemini handhabt gescannte Dokumente nativ.

**Dual-Path Architektur** (sot-document-parser):
- **Path A (Deterministisch)**: XLSX/CSV → SheetJS direkt → Fuzzy Column Mapping → 0 Credits
- **Path B (AI Vision)**: PDF/Bild → Gemini 2.5 Pro Vision → JSON-Extraktion → 1 Credit
- **Path B+CSV**: PDF mit Tabellen → Gemini Flash → CSV → SheetJS → Enhanced Prompt → 1 Credit

### B. CHAT & BERATUNG

| # | Funktion | Modell | Token | Streaming | Zweck |
|---|----------|--------|-------|-----------|-------|
| 1 | `sot-armstrong-advisor` | gemini-2.5-pro | 4.000 | Nur fuer Social-Audit | Haupt-Chat, Intent-Klassifikation, 200+ Actions, E-Mail-Compose, Dokument-Analyse |
| 2 | `sot-armstrong-website` | gemini-2.5-pro | 2.000 | SSE Streaming | Zone 3 Website-Chat (Kaufy, FutureRoom, etc.) |
| 3 | `sot-armstrong-voice` | **OpenAI gpt-4o-realtime** | ~300 | WebSocket | Voice-Konversation via OpenAI Realtime API |

### C. CONTENT & MARKETING

| # | Funktion | Modell | Token | Zweck |
|---|----------|--------|-------|-------|
| 1 | `sot-content-engine` | gemini-2.5-pro | 8.000 | Blog/SEO-Content fuer 7 Brands |
| 2 | `sot-social-draft-generate` | gemini-2.5-pro | 8.000 | Social-Media-Posts (Tool-Calling) |
| 3 | `sot-social-draft-rewrite` | gemini-2.5-pro | — | Post-Rewrite/Optimierung |
| 4 | `sot-social-generate-briefing` | gemini-2.5-pro | — | Content-Briefings |
| 5 | `sot-social-analyze-performance` | gemini-2.5-pro | 4.000 | KPI-Analyse |
| 6 | `sot-social-extract-patterns` | gemini-2.5-pro | — | Muster-Erkennung |
| 7 | `sot-expose-description` | gemini-2.5-pro | 4.000 | Exposé-Texte |
| 8 | `sot-generate-landing-page` | gemini-2.5-pro | 8.000 | Lagebeschreibungen fuer Projekte |
| 9 | `sot-project-description` | gemini-2.5-pro | — | Projektbeschreibungen |
| 10 | `sot-website-ai-generate` | gemini-2.5-pro | 8.000 | Website-Sektionen |
| 11 | `sot-website-update-section` | gemini-2.5-pro | — | Website-Sektions-Updates |

### D. E-MAIL & KOMMUNIKATION

| # | Funktion | Modell | Token | Zweck |
|---|----------|--------|-------|-------|
| 1 | `sot-mail-ai-assist` | **gemini-2.5-flash** | 4.000 | Ausformulieren, Qualitätscheck, Kuerzen, Verbessern |
| 2 | `sot-letter-generate` | gemini-2.5-pro | 8.000 | Briefgenerierung |
| 3 | `sot-nk-letter-generate` | **gemini-2.5-flash** | — | NK-Abrechnungsbriefe |

### E. FINANZIERUNG & ANALYSE

| # | Funktion | Modell | Token | Zweck |
|---|----------|--------|-------|-------|
| 1 | `sot-finance-prepare` | gemini-2.5-pro | 16.000 | Bankenpakete erstellen |
| 2 | `sot-finance-bank-match` | **gemini-2.5-flash** | 12.000 | Bank-Matching via Tool-Calling |
| 3 | `sot-transaction-categorize` | gemini-2.5-pro | — | Kontobewegungen kategorisieren |
| 4 | `sot-investment-engine` | gemini-2.5-pro | — | Investment-Berechnungen |

### F. AKQUISE & RECHERCHE

| # | Funktion | Modell | Token | Zweck |
|---|----------|--------|-------|-------|
| 1 | `sot-acq-ai-research` | gemini-2.5-pro | 8.000 | KI-Research fuer Akquise |
| 2 | `sot-acq-generate-response` | gemini-2.5-pro | 8.000 | Antwort-Generierung |
| 3 | `sot-acq-contact-enrich` | gemini-2.5-pro | 4.000 | Kontakt-Anreicherung |
| 4 | `sot-acq-standalone-research` | gemini-2.5-pro | — | Standalone Research |
| 5 | `sot-research-ai-assist` | gemini-2.5-pro | 8.000 | Filter-Suggestion, Scoring |
| 6 | `sot-research-engine` | gemini-2.5-pro | 8.000 | Lead-Research |
| 7 | `sot-dossier-auto-research` | gemini-2.5-pro | — | Auto-Dossier |
| 8 | `sot-research-strategy-resolver` | gemini-2.5-pro | — | Strategy Resolution |

### G. LIFECYCLE & AUTOMATION (Cron)

| # | Funktion | Modell | Token | Zweck |
|---|----------|--------|-------|-------|
| 1 | `sot-tenancy-lifecycle` | **gemini-2.5-flash** | 600-800 | TLC: Zahlungserinnerungen, Zusammenfassungen |
| 2 | `sot-slc-lifecycle` | **gemini-2.5-flash** | 800 | SLC: Sales-Lifecycle |
| 3 | `sot-flc-lifecycle` | gemini-2.5-pro | — | FLC: Finance-Lifecycle |
| 4 | `sot-pslc-lifecycle-patrol` | gemini-2.5-pro | — | PSLC: Pet Service Lifecycle |

### H. TELEFON & VOICE

| # | Funktion | Modell | Token | Zweck |
|---|----------|--------|-------|-------|
| 1 | `sot-phone-converse` | **gemini-2.5-flash** | 300 | Live-Gesprächssteuerung |
| 2 | `sot-phone-postcall` | **gemini-2.5-flash** | 2.000 | Nachbearbeitung: Zusammenfassung, Sentiment |
| 3 | `sot-phone-agent-sync` | gemini-2.5-flash | 300 | Agent-Sync |
| 4 | `sot-armstrong-voice` | **OpenAI gpt-4o-realtime** | — | WebSocket Voice (NICHT Gateway!) |

### I. SONSTIGE

| # | Funktion | Modell | Token | Zweck |
|---|----------|--------|-------|-------|
| 1 | `sot-meeting-summarize` | gemini-2.5-pro | 8.000 | Meeting-Zusammenfassungen |
| 2 | `sot-renovation-scope-ai` | **gemini-2.5-flash** + pro | 8.000 | Renovierungs-Scoping (3 AI-Calls) |
| 3 | `sot-market-pulse-report` | gemini-2.5-pro | — | Marktberichte (Streaming) |
| 4 | `sot-project-market-report` | gemini-2.5-pro | — | Projekt-Marktberichte (Streaming) |
| 5 | `sot-solar-insights` | gemini-2.5-pro | — | PV-Analyse |
| 6 | `sot-vv-prefill-check` | gemini-2.5-pro | — | Vorsorge Prefill |

---

## 3. TECHNISCHE ANALYSE

### Streaming-Funktionen (SSE)
Nur 4 von ~50 Funktionen nutzen Streaming:
- `sot-armstrong-website` (Zone 3 Chat)
- `sot-armstrong-advisor` (nur Social-Audit-Teil)
- `sot-market-pulse-report`
- `sot-project-market-report`

**Problem**: Der Haupt-Chat (`sot-armstrong-advisor`) streamt NICHT. Antworten werden komplett generiert und dann gesendet. Bei 4000 Token = 3-8 Sekunden Wartezeit ohne sichtbare Fortschritte.

### Function Calling / Tool Use
- `sot-social-draft-generate` — Tool: `draft_result`
- `sot-finance-bank-match` — Tool: `bank_matching_result`
- `sot-nk-beleg-parse` — Tool: `cross_validation_result`
- `sot-project-intake` — Tool: `extract_project_data`
- `sot-armstrong-advisor` — 200+ Action-Definitionen (nicht als AI Tools, sondern als Intent-Mapping)

### Multimodal (Vision)
`sot-document-parser`, `sot-invoice-parse`, `sot-nk-beleg-parse`, `sot-weg-abrechnung-parse`, `sot-storage-extract`, `sot-storage-extractor`, `sot-project-intake`

### Echtzeit vs. Batch
- **Echtzeit**: Chat (Advisor, Website), Voice (Phone, Armstrong), Mail-Assist
- **Batch/Cron**: Lifecycle (TLC/SLC/FLC), Content-Engine, Market Reports

---

## 4. KOSTENANALYSE

### Modell-Verteilung (nach Memory: Maximum Power Standard)

| Modell | Anzahl Funktionen | Typischer Token-Bereich |
|--------|-------------------|------------------------|
| google/gemini-2.5-pro | ~40 | 2.000–32.000 |
| google/gemini-2.5-flash | ~8 | 300–2.000 |
| OpenAI gpt-4o-realtime | 1 | WebSocket (extern) |

### Geschaetzte Kosten pro Dokumenttyp

| Dokumenttyp | Input-Tokens (geschaetzt) | Output-Tokens | Gesamtkosten/Dok |
|-------------|--------------------------|---------------|-----------------|
| PDF Exposé (10 Seiten) | ~15.000 | ~2.000 | ~$0.06 |
| PDF Rechnung (1-2 Seiten) | ~3.000 | ~500 | ~$0.01 |
| XLSX/CSV (direkt) | 0 (kein AI) | 0 | $0.00 |
| WEG-Abrechnung (20+ Seiten) | ~25.000 | ~5.000 | ~$0.10 |
| NK-Beleg + Cross-Validation | ~5.000 + ~8.000 | ~1.000 + ~3.000 | ~$0.06 |

### Prognose bei Skalierung

| Szenario | Dokumente/Monat | AI-Calls gesamt | Geschaetzte Kosten |
|----------|----------------|----------------|-------------------|
| Aktuell (Test) | ~100 | ~200 | ~$10-20 |
| 10 Tenants aktiv | ~1.000 | ~2.000 | ~$100-200 |
| 50 Tenants | ~5.000 | ~10.000 | ~$500-1.000 |
| 100 Tenants | ~10.000 | ~20.000 | ~$1.000-2.000 |

**Kosten-Treiber #1**: `sot-armstrong-advisor` (haeufigste Aufrufe, 4000 Token pro Antwort)
**Kosten-Treiber #2**: `sot-document-parser` (32.000 Token, Vision)
**Kosten-Treiber #3**: `sot-finance-prepare` (16.000 Token, komplexe Bankenpakete)

---

## 5. IDENTIFIZIERTE PROBLEME & EMPFEHLUNGEN

### Kritisch
1. **sot-armstrong-voice nutzt OpenAI direkt** — Einzige Funktion die nicht ueber Lovable AI Gateway geht. Erfordert separaten `OPENAI_API_KEY`. Sollte auf Lovable AI migriert werden oder bewusst als Ausnahme dokumentiert werden.
2. **Kein Streaming im Haupt-Chat** — `sot-armstrong-advisor` buffert die komplette Antwort (bis 4000 Token), was 3-8s Wartezeit ohne Feedback verursacht.
3. **Duplikat: sot-storage-extract vs sot-storage-extractor** — Zwei sehr aehnliche Funktionen fuer Datei-Extraktion. Konsolidierungspotential.

### Optimierungspotential
4. **Modell-Downgrade fuer einfache Tasks** — Folgende Funktionen koennten von gemini-2.5-pro auf gemini-2.5-flash wechseln ohne Qualitaetsverlust:
   - `sot-expose-description` (Textgenerierung)
   - `sot-social-analyze-performance` (KPI-Analyse)
   - `sot-acq-contact-enrich` (simple Anreicherung)
   - `sot-content-engine` (Blog-Posts)
   - `sot-extract-email` (einfache Extraktion)

5. **Token-Limits ueberdimensioniert** — Mehrere Funktionen haben 32.000 Token Limit, generieren aber typisch <2.000 Token Output. Reduktion auf 8.000-16.000 wuerde Latenz senken.

6. **Armstrong Advisor hat 4.446 Zeilen** — Monolithisch. Enthaelt Intent-Klassifikation, Action-Execution, E-Mail-Compose, Dokument-Analyse, Social-Audit, Web-Research in einer Datei. Splitting wuerde Wartbarkeit verbessern.

### Fehlende Integration
7. **data_mode wird gesendet aber nicht verarbeitet** — `useArmstrongAdvisor` sendet `data_mode: 'tenant' | 'general'` im Request, aber `sot-armstrong-advisor` ignoriert dieses Feld im RequestBody-Interface. Die Edge Function hat kein `data_mode` im Interface.
8. **project_id wird gesendet aber nicht persistiert** — Aehnlich: Client sendet `project_id`, Edge Function speichert es nicht in der Session.

---

## 6. NAECHSTE SCHRITTE (Empfehlung)

| Prioritaet | Massnahme | Aufwand |
|------------|-----------|--------|
| P0 | `data_mode` + `project_id` in sot-armstrong-advisor verarbeiten | 2h |
| P0 | Streaming fuer Haupt-Chat aktivieren | 4h |
| P1 | sot-storage-extract/extractor konsolidieren | 2h |
| P1 | Modell-Downgrade fuer 5 einfache Funktionen (→ Flash) | 1h |
| P2 | sot-armstrong-voice auf Lovable AI migrieren oder dokumentieren | 4h |
| P2 | sot-armstrong-advisor in Sub-Module aufteilen | 8h |

