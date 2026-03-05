

# Kostenoptimierung Dokumentenverarbeitung — Neue Denkrichtung

## Das eigentliche Problem

Aktuell wird **jedes Dokument** mit dem teuersten Modell verarbeitet: **Gemini 2.5 Pro** ($1.25/M Input, $5.00/M Output). Das ist so, als wuerde man fuer jeden Brief den teuersten Anwalt engagieren — egal ob es eine Werbebroschure oder ein Kaufvertrag ist.

DeepSeek faellt wegen DSGVO aus. Aber es gibt **zwei Hebel**, die zusammen fast die gleiche Ersparnis bringen — und DSGVO-konform bleiben:

---

## Hebel 1: Modell-Tiering (sofort umsetzbar, -85% bis -95%)

Das Lovable AI Gateway bietet **drei Gemini-Stufen**, alle EU-konform:

| Modell | Input/M | Output/M | Faktor vs. Pro | Geeignet fuer |
|--------|---------|----------|---------------|---------------|
| **Gemini 2.5 Pro** | $1.25 | $5.00 | 1x (teuer) | Komplexe WEG-Abrechnungen, 50-Seiten-Vertraege |
| **Gemini 2.5 Flash** | $0.15 | $0.60 | ~8x guenstiger | Standard-Dokumente (Rechnungen, Policen, Mietvertraege) |
| **Gemini 2.5 Flash Lite** | $0.04 | $0.15 | ~30x guenstiger | Einfache Briefe, E-Mails, Kontoauszuege |

### Kostenvergleich fuer 70.000 PDFs

| Strategie | Kosten | Ersparnis vs. aktuell |
|-----------|--------|-----------------------|
| **Aktuell**: Alles mit Pro | ~$2.000 | — |
| **Tiered**: 10% Pro, 60% Flash, 30% Flash Lite | ~$280 | **-86%** |
| **DeepSeek** (hypothetisch) | ~$186 | -91% |

**Das Tiering bringt fast die gleiche Ersparnis wie DeepSeek — ohne DSGVO-Risiko.**

### Wie funktioniert das Routing?

Der Extractor prueft vor dem AI-Call:
- **Dateigröße < 100KB** oder **MIME = text/plain** → Flash Lite
- **Dateiname enthaelt** "WEG", "Abrechnung", "Teilungserklaerung", ">20 Seiten" → Pro
- **Alles andere** (Rechnungen, Policen, Standard-Vertraege) → Flash

Das ist eine reine Konfigurations-Aenderung in `sot-storage-extractor` und `sot-document-parser` — keine neue Architektur noetig.

---

## Hebel 2: Lazy Extraction (On-Demand statt Bulk)

Aktuell: Alle 70.000 PDFs werden sofort komplett ausgelesen. Aber ein Kunde arbeitet typischerweise nur mit 10-20% seiner Dokumente aktiv.

### Neues Konzept: Dreistufige Indexierung

```text
Stufe 1: METADATA-SCAN (kostenlos, sofort)
─────────────────────────────────────────
Dateiname, Dateityp, Groesse, Ordnerstruktur
→ Reicht fuer Sortierung und Uebersicht
→ Armstrong weiss: "Im Ordner Immobilien/Berlin liegen 47 PDFs"

Stufe 2: LIGHT-EXTRACT (Flash Lite, ~$0.001/Dok)
─────────────────────────────────────────
Nur erste Seite lesen → Dokumenttyp + 3-5 Schluesselfelder
→ Armstrong weiss: "Das ist ein Mietvertrag, Mieter Mueller, 850€ kalt"
→ Kostet fuer 70.000 Docs: ~$70 statt ~$2.000

Stufe 3: DEEP-EXTRACT (Flash/Pro, on-demand)
─────────────────────────────────────────
Komplette Extraktion — nur wenn User/Armstrong es braucht
→ Trigger: User oeffnet Dokument, Armstrong braucht Details
→ Kostet pro Dok: $0.003-$0.029 je nach Komplexitaet
```

### Warum das funktioniert

Wenn ein Kunde 70.000 PDFs hat, wird er in den ersten Monaten vielleicht 5.000-10.000 davon aktiv nutzen. Die restlichen 60.000 brauchen nur Stufe 1+2 (Metadaten + Typ-Erkennung).

**Kosten-Szenario mit Lazy Extraction:**

| Phase | Dokumente | Methode | Kosten |
|-------|-----------|---------|--------|
| Sofort: Alle 70.000 scannen | 70.000 | Stufe 1 (Metadaten) | $0 |
| Sofort: Alle 70.000 light-extracten | 70.000 | Stufe 2 (Flash Lite, 1 Seite) | ~$70 |
| Laufend: Aktiv genutzte Docs | ~10.000 | Stufe 3 (Flash/Pro) | ~$40-100 |
| **Gesamt im ersten Monat** | | | **~$110-170** |

Verglichen mit aktuell ~$2.000 fuer sofortige Komplett-Extraktion.

---

## Technische Umsetzung — Was sich aendert

### 1. Model-Router in `sot-storage-extractor` und `sot-document-parser`

Statt hardcoded `model: "google/gemini-2.5-pro"` eine Funktion:

```text
selectModel(file) → {
  if textOnly oder < 100KB         → "google/gemini-2.5-flash-lite"
  if complex (WEG, >20 Seiten)     → "google/gemini-2.5-pro"
  else                              → "google/gemini-2.5-flash"
}
```

Aenderung in: `sot-storage-extractor/index.ts` (Zeile 380: model-Parameter), `sot-document-parser/index.ts`

### 2. Light-Extract-Modus fuer Stufe 2

Neuer Parameter `extractionDepth: "light" | "full"`:
- **light**: Nur erste Seite senden, verkuerzter Prompt ("Nenne Dokumenttyp und 5 Schluesselfelder"), Flash Lite
- **full**: Wie bisher, komplettes Dokument

Aenderung in: `sot-storage-extractor/index.ts` (process-batch Action)

### 3. On-Demand Deep-Extract Trigger

Wenn Armstrong ein Dokument braucht und nur Stufe-2-Daten vorliegen → automatischer Deep-Extract:

```text
Armstrong fragt: "Was steht im Mietvertrag Mueller?"
→ searchDocumentChunks() findet Light-Extract
→ Wenn nur Stufe 2: automatisch Stufe 3 triggern
→ Ergebnis in document_chunks speichern
→ Naechste Anfrage: Daten sofort da (kein erneuter AI-Call)
```

Aenderung in: `sot-armstrong-advisor/index.ts` (DMS-Search-Logik)

### 4. extraction_depth Feld in document_chunks

Neues Feld `extraction_depth: 'metadata' | 'light' | 'full'` um zu tracken, welche Stufe ein Dokument hat.

Aenderung: DB-Migration (neues Feld)

---

## Zusammenfassung: Beides kombiniert

| Massnahme | Einsparung | DSGVO | Aufwand |
|-----------|-----------|-------|---------|
| **Modell-Tiering** (Flash/Flash Lite statt Pro) | -85% bis -95% | Konform (Lovable Gateway) | 1 Tag |
| **Lazy Extraction** (Light + On-Demand) | -90% bis -95% | Konform | 2-3 Tage |
| **Beides kombiniert** | **-95% bis -98%** | Konform | 3-4 Tage |

**70.000 PDFs: Von ~$2.000 auf ~$70-170 — ohne DeepSeek, ohne DSGVO-Risiko.**

Armstrong wird trotzdem alles verstehen: Stufe 2 gibt ihm genuegend Kontext fuer die meisten Fragen, und Stufe 3 wird automatisch nachgeladen wenn er tiefere Details braucht.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sot-storage-extractor/index.ts` | Model-Router + Light-Extract-Modus |
| `supabase/functions/sot-document-parser/index.ts` | Model-Router (Flash/Pro/Lite Auswahl) |
| `supabase/functions/sot-armstrong-advisor/index.ts` | On-Demand Deep-Extract bei fehlender Tiefe |
| DB-Migration | `extraction_depth` Feld in `document_chunks` |
| `supabase/functions/sot-invoice-parse/index.ts` | Model → Flash statt Pro |
| `supabase/functions/sot-nk-beleg-parse/index.ts` | Model → Flash statt Pro |

