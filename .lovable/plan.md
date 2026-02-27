

## KI-Power Maximierung — Vollständiges Upgrade aller Edge Functions

### Ist-Zustand: Modell-Verteilung

| Modell | Anzahl Funktionen | Power-Level |
|--------|-------------------|-------------|
| `gemini-2.5-flash` | **17 Funktionen** | Mittel |
| `gemini-3-flash-preview` | **10 Funktionen** | Mittel-Hoch |
| `gemini-2.5-pro` | **3 Funktionen** | Hoch |
| `gemini-2.5-flash-lite` | **1 Funktion** | Niedrig |

### Ziel-Zustand: Alles auf `google/gemini-2.5-pro`

Das stärkste Modell mit bestem Reasoning, größtem Context-Window und bester Multimodal-Fähigkeit. 3 Funktionen nutzen es bereits (Project Intake, Excel Import, Akquise Research) — dort funktioniert es nachweislich hervorragend.

### Upgrade-Plan

**Gruppe 1 — Dokument-Analyse & Extraktion (gemini-2.5-flash → gemini-2.5-pro + max_tokens erhöhen):**

| Funktion | Aktuell | Neu max_tokens |
|----------|---------|---------------|
| `sot-inbound-receive` | flash, 16000 | pro, 32000 |
| `sot-storage-extract` | flash, 8000 | pro, 16000 |
| `sot-storage-extractor` | flash, 4000 | pro, 16000 |
| `sot-document-parser` | flash, variabel | pro, 32000 |
| `sot-nk-beleg-parse` | flash, 4000 | pro, 16000 |
| `sot-extract-offer` | flash, — | pro, 8000 |
| `sot-acq-offer-extract` | flash, — | pro, 8000 |
| `_shared/tabular-parser` | flash, 32000 | pro, 32000 |
| `sot-public-project-intake` | flash, 2000/4000 | pro, 8000 |

**Gruppe 2 — KI-Assistenten & Chat (flash/3-flash → pro + Token erhöhen):**

| Funktion | Aktuell | Neu max_tokens |
|----------|---------|---------------|
| `sot-armstrong-advisor` | flash, 800-2000 | pro, 4000 |
| `sot-armstrong-website` | 3-flash, 800 | pro, 2000 |
| `sot-ki-browser` | flash, — | pro, 8000 |
| `sot-research-engine` | 3-flash, — | pro, 8000 |
| `sot-research-ai-assist` | 3-flash, — | pro, 4000 |

**Gruppe 3 — Content-Generierung (flash/3-flash → pro + Token erhöhen):**

| Funktion | Aktuell | Neu max_tokens |
|----------|---------|---------------|
| `sot-expose-description` | 3-flash, 600 | pro, 4000 |
| `sot-letter-generate` | 3-flash, 1000 | pro, 4000 |
| `sot-website-ai-generate` | flash, 2000 | pro, 8000 |
| `sot-website-update-section` | flash, — | pro, 4000 |
| `sot-generate-landing-page` | flash-lite, — | pro, 8000 |
| `sot-social-draft-rewrite` | —, 1000 | pro, 4000 |
| `sot-social-draft-generate` | 3-flash, — | pro, 4000 |
| `sot-social-generate-briefing` | 3-flash, — | pro, 4000 |
| `sot-social-analyze-performance` | 3-flash, 500 | pro, 4000 |
| `sot-social-extract-patterns` | —, — | pro, 4000 |
| `sot-project-description` | —, — | pro, 4000 |
| `sot-project-market-report` | 3-flash, — | pro, 8000 |

**Gruppe 4 — Akquise & Enrichment (flash/3-flash → pro):**

| Funktion | Aktuell | Neu max_tokens |
|----------|---------|---------------|
| `sot-acq-contact-enrich` | flash, — | pro, 4000 |
| `sot-acq-standalone-research` | flash, 2000 | pro, 8000 |
| `sot-acq-profile-extract` | 3-flash, — | pro, 4000 |
| `sot-acq-generate-response` | 3-flash, 500 | pro, 4000 |
| `sot-contact-enrichment` | 3-flash, — | pro, 4000 |

**Gruppe 5 — Spezial-Engines (flash → pro):**

| Funktion | Aktuell | Neu max_tokens |
|----------|---------|---------------|
| `sot-renovation-scope-ai` | flash (4 Calls) | pro, 8000 |
| `sot-meeting-summarize` | flash, — | pro, 8000 |
| `sot-geomap-snapshot` | flash, — | pro, 4000 |
| `sot-vv-prefill-check` | 3-flash, — | pro, 4000 |
| `sot-transaction-categorize` | —, — | pro, 4000 |
| `sot-rent-match` | —, — | pro, 4000 |

**Nicht verändert:**
- `sot-armstrong-voice` — nutzt OpenAI Realtime WebSocket (anderes System)
- `sot-project-intake` — bereits `gemini-2.5-pro`
- `sot-excel-ai-import` — bereits `gemini-2.5-pro`
- `sot-acq-ai-research` — bereits `gemini-2.5-pro`

### Implementierung

Reine Modell-String- und max_tokens-Änderungen in ca. 35 Edge Functions. Keine Logik-Änderungen, keine neuen Dateien. Deployment erfolgt automatisch.

### Kosten-Hinweis

`gemini-2.5-pro` ist ca. 10-15x teurer als `gemini-2.5-flash` pro Token. Bei vollem Betrieb steigen die KI-Kosten erheblich. Das ist gewollt ("Hier verdienen wir unser Geld") und kann später selektiv zurückgeschraubt werden.

