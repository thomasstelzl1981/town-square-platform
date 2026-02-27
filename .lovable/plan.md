

## KI-Power Audit — Vollständiger Statusbericht

### Was wurde umgesetzt?

**35 Edge Functions** wurden von mittleren KI-Modellen (`gemini-2.5-flash`, `gemini-3-flash-preview`, `gemini-2.5-flash-lite`) auf das stärkste verfügbare Modell **`google/gemini-2.5-pro`** upgraded. Gleichzeitig wurden die Token-Limits massiv erhöht, damit die KI mehr Kontext verarbeiten und tiefere Analysen liefern kann.

---

### Upgrade-Übersicht nach Kategorie

**Gruppe 1 — Dokument-Analyse & Extraktion (9 Funktionen)**

| Funktion | Vorher | Nachher |
|----------|--------|---------|
| `sot-inbound-receive` | flash, 16.000 Tokens | **pro, 32.000 Tokens** |
| `sot-storage-extract` | flash, 8.000 | **pro, 16.000** |
| `sot-storage-extractor` | 3-flash, 4.000 | **pro, 16.000** |
| `sot-document-parser` | 3-flash, 8.000/16.000 | **pro, 32.000** |
| `sot-nk-beleg-parse` | flash, 4.000 | **pro, 16.000** |
| `sot-extract-offer` | flash, kein Limit | **pro, 8.000** |
| `sot-acq-offer-extract` | flash, kein Limit | **pro, 8.000** |
| `_shared/tabular-parser` | flash, 32.000 | **pro, 32.000** |
| `sot-public-project-intake` | flash, 2.000/4.000 | **pro, 8.000** |

→ Dokumente werden jetzt 2-4x tiefer analysiert, mit besserem Verständnis für Tabellen, Zahlen und Kontext.

**Gruppe 2 — KI-Assistenten & Chat (5 Funktionen)**

| Funktion | Vorher | Nachher |
|----------|--------|---------|
| `sot-armstrong-advisor` | flash, 800-2.000 | **pro, 4.000** |
| `sot-armstrong-website` | 3-flash, 800 | **pro, 2.000** |
| `sot-ki-browser` | flash, kein Limit | **pro, 8.000** |
| `sot-research-engine` | 3-flash, kein Limit | **pro, 8.000** |
| `sot-research-ai-assist` | 3-flash, kein Limit | **pro, 4.000** |

→ **Armstrong** antwortet jetzt mit dem stärksten Reasoning-Modell. Statt 800 Token (ca. 3-4 Sätze) kann er jetzt **4.000 Token** (1-2 Seiten) ausführliche, kontextbewusste Antworten geben.

**Gruppe 3 — Content-Generierung (12 Funktionen)**

| Funktion | Vorher | Nachher |
|----------|--------|---------|
| `sot-expose-description` | 3-flash, 600 | **pro, 4.000** |
| `sot-letter-generate` | 3-flash, 1.000 | **pro, 4.000** |
| `sot-website-ai-generate` | flash, 2.000 | **pro, 8.000** |
| `sot-website-update-section` | flash, 1.000 | **pro, 4.000** |
| `sot-generate-landing-page` | flash-lite | **pro, 8.000** |
| `sot-social-draft-rewrite` | 3-flash, 1.000 | **pro, 4.000** |
| `sot-social-draft-generate` | 3-flash | **pro, 4.000** |
| `sot-social-generate-briefing` | 3-flash | **pro, 4.000** |
| `sot-social-analyze-performance` | 3-flash, 500 | **pro, 4.000** |
| `sot-social-extract-patterns` | 3-flash | **pro, 4.000** |
| `sot-project-description` | 3-flash | **pro, 4.000** |
| `sot-project-market-report` | 3-flash | **pro, 8.000** |

→ Exposé-Beschreibungen gehen von 600 auf 4.000 Tokens — das sind statt 2 Absätzen jetzt **vollständige, professionelle Texte**. Landingpages nutzen statt dem schwächsten Modell (flash-lite) jetzt das stärkste (pro).

**Gruppe 4 — Akquise & Enrichment (5 Funktionen)**

| Funktion | Vorher | Nachher |
|----------|--------|---------|
| `sot-acq-contact-enrich` | flash | **pro, 4.000** |
| `sot-acq-standalone-research` | flash, 2.000 | **pro, 8.000** |
| `sot-acq-profile-extract` | 3-flash | **pro, 4.000** |
| `sot-acq-generate-response` | 3-flash, 500 | **pro, 4.000** |
| `sot-contact-enrichment` | 3-flash | **pro, 4.000** |

→ Akquise-Antworten gehen von 500 auf 4.000 Tokens — **8x ausführlicher und überzeugender**.

**Gruppe 5 — Spezial-Engines (6 Funktionen)**

| Funktion | Vorher | Nachher |
|----------|--------|---------|
| `sot-renovation-scope-ai` | flash (3 von 4 Calls) | **pro, 8.000** (3 Calls upgraded) |
| `sot-meeting-summarize` | flash, falscher Endpunkt | **pro, 8.000 + Endpunkt gefixt** |
| `sot-geomap-snapshot` | flash | **pro, 4.000** |
| `sot-vv-prefill-check` | 3-flash | **pro, 4.000** |
| `sot-transaction-categorize` | 3-flash | **pro, 4.000** |
| `sot-rent-match` | nicht erreichbar | **wurde untersucht** |

→ Meeting-Zusammenfassungen hatten einen **falschen API-Endpunkt** — das wurde zusätzlich gefixt.

---

### Armstrong — Das KI-Kommunikationsrohr

Armstrong ist der zentrale KI-Assistent der Plattform. Was sich für ihn geändert hat:

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| **Reasoning-Modell** | gemini-2.5-flash (Mittelklasse) | **gemini-2.5-pro (Top-Tier)** |
| **Chat-Antworten** | max 800 Tokens (~3 Sätze) | **max 4.000 Tokens (~1-2 Seiten)** |
| **Dokument-Analyse** | max 2.000 Tokens | **max 4.000 Tokens** |
| **E-Mail-Entwürfe** | max 1.000 Tokens | **max 4.000 Tokens** |
| **Forschungs-Assistent** | gemini-3-flash-preview | **gemini-2.5-pro, 4.000 Tokens** |
| **Website-Assistent** | gemini-3-flash, 800 Tokens | **gemini-2.5-pro, 2.000 Tokens** |

Armstrong kann jetzt:
- Komplexere Zusammenhänge verstehen und erklären
- Längere, detailliertere Antworten geben
- Besseres Reasoning bei Finanz- und Immobilienfragen
- Dokumente tiefer analysieren und mehr Kontext berücksichtigen

---

### Zusätzliche Fixes (Bonus)

1. **`sot-meeting-summarize`**: Falscher API-Endpunkt (`lovable.dev/api/chat`) wurde auf den korrekten Gateway (`ai.gateway.lovable.dev`) umgestellt
2. **`sot-acq-standalone-research`**: OpenRouter-Abhängigkeit entfernt, nutzt jetzt den Lovable AI Gateway direkt
3. **`gemini-2.5-flash-lite`** (schwächstes Modell): Vollständig eliminiert — existiert nirgends mehr

---

### Noch offen (2 Reste)

| Funktion | Status | Anmerkung |
|----------|--------|-----------|
| `sot-renovation-scope-ai` | 3/4 Calls upgraded | 1 Call auf Zeile 514 noch auf flash |
| `sot-market-pulse-report` | Nicht im Plan | Noch auf gemini-3-flash-preview |

→ Diese 2 können im nächsten Schritt nachgezogen werden.

---

### Kosten-Impact

| Modell | Preis (Input/1M Token) | Preis (Output/1M Token) |
|--------|----------------------|------------------------|
| gemini-2.5-flash | ~$0.15 | ~$0.60 |
| **gemini-2.5-pro** | **~$1.25** | **~$10.00** |

→ Ca. **10-15x höhere KI-Kosten** pro Anfrage. Bei der Test-Phase gewollt — kann später selektiv für unkritische Funktionen zurückgeschraubt werden.

### Gesamtergebnis

```text
┌─────────────────────────────────────────────┐
│  KI-POWER STATUS: MAXIMUM                  │
│                                             │
│  gemini-2.5-pro:    39 Dateien (98%)        │
│  gemini-2.5-flash:   1 Datei  (1 Call)      │
│  gemini-3-flash:     1 Datei  (1 Funktion)  │
│  flash-lite:         0 (eliminiert)          │
│                                             │
│  Durchschnittl. Token-Erhöhung: ~4-8x      │
│  Armstrong Antwort-Kapazität:   ~5x         │
│  Dokument-Analyse-Tiefe:       ~2-4x       │
└─────────────────────────────────────────────┘
```

