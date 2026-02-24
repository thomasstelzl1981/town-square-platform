
# Kategorie-basierte Recherche-Strategie mit Strategy Ledger

## Executive Summary

Jede Kontaktkategorie hat fundamental unterschiedliche Datenquellen. Ein "one-size-fits-all"-Ansatz (Google Places + Firecrawl fuer alle) ist ineffizient und teuer. Stattdessen bekommt jede Kategorie eine eigene **Source Strategy** im Engine-Spec, die definiert, welche Provider in welcher Reihenfolge und mit welchen Parametern angesprochen werden. Zu jedem Kontakt wird ein **Strategy Ledger** gefuehrt, der dokumentiert, welche Schritte durchlaufen wurden, was gefunden wurde und was noch fehlt.

---

## A) Kategorie-Strategie-Matrix

Die folgende Tabelle zeigt die optimale Recherche-Strategie pro Kategorie:

```text
+----------------------------+------------------+------------------+-------------------+------------------+
| Kategorie                  | Primaerquelle    | Enrichment       | Verifizierung     | Schwierigkeit    |
+============================+==================+==================+===================+==================+
| FINANZ                     |                  |                  |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Filialbank / Privatbank    | BaFin-Register   | Google Places    | Website-Scrape    | LEICHT           |
|                            | (CSV-Download)   | (Telefon)        | (E-Mail, Kontakt) |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Family Office              | Curated Lists    | LinkedIn (API)   | Website-Scrape    | SCHWER           |
|                            | + Google Search  | + Google Places  | (Ansprechpartner) |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Versicherungsmakler (34d)  | IHK-Register     | Google Places    | Firecrawl         | MITTEL-SCHWER    |
| Finanzanlagenverm. (34f)   | (Vermittler-     | (Existenzcheck)  | (falls Website)   | (oft keine       |
| Honorar-Berater (34h)      |  register)       |                  |                   |  Website)        |
+----------------------------+------------------+------------------+-------------------+------------------+
| Immobiliardarl.verm. (34i) | IHK-Register     | Google Places    | Firecrawl         | MITTEL           |
| Kreditvermittler           |                  |                  |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Finanzberater allgemein    | Google Places    | Firecrawl        | --                | MITTEL           |
+----------------------------+------------------+------------------+-------------------+------------------+
| IMMOBILIEN                 |                  |                  |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Maklerbuero                | Apify Portal-    | Google Places    | Firecrawl         | LEICHT           |
|                            | Scraping         | (Verifizierung)  | (E-Mail)          |                  |
|                            | (ImmoScout24,    |                  |                   |                  |
|                            |  Immowelt)       |                  |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Hausverwaltung             | Google Places    | Firecrawl        | --                | LEICHT-MITTEL    |
|                            | + Branchenverz.  | (Website-Scrape) |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Immobilienunternehmen      | Apify Portal-    | Google Places    | Firecrawl         | LEICHT           |
|                            | Scraping +       | (Verifizierung)  | (Ansprechpartner) |                  |
|                            | Google Places    |                  |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Steuerberater (Immo)       | Google Places    | Firecrawl        | --                | LEICHT           |
+----------------------------+------------------+------------------+-------------------+------------------+
| PET                        |                  |                  |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
| Hundepension, Hundeschule, | Google Places    | Firecrawl        | --                | LEICHT           |
| Hundefriseur, Tierarzt,    |                  | (E-Mail)         |                   |                  |
| Zoofachhandel, Petsitter   |                  |                  |                   |                  |
+----------------------------+------------------+------------------+-------------------+------------------+
```

### Fazit zu Apify

Apify ist **unverzichtbar** fuer zwei Anwendungsfaelle:
1. **Portal-Scraping** (ImmoScout24, Immowelt): Aktive Makler und Immobilienunternehmen, die Inserate haben, findet man NUR auf den Portalen. Google Places zeigt diese oft nicht.
2. **Google Maps Deep Scraping**: Apify liefert E-Mails, die Google Places API NICHT liefert (Google gibt keine E-Mails zurueck). Das ist die aktuelle Hauptnutzung -- und hier liegt die Redundanz, denn man koennte auch nur Apify oder nur Google Places nutzen.

**Empfehlung**: Google Places fuer die Erstsuche (schnell, strukturiert), Apify fuer Portal-Scraping und als Fallback fuer E-Mail-Extraktion bei Google-Maps-Ergebnissen.

---

## B) Strategy Ledger -- Konzept

Pro Kontakt wird ein Ledger gefuehrt, der den Recherche-Fortschritt dokumentiert:

```text
+------------------+------------------------------------------------------------+
| Feld             | Beschreibung                                               |
+==================+============================================================+
| contact_id       | FK auf contacts                                            |
| category_code    | Kategorie des Kontakts                                     |
| strategy_code    | Verweis auf die Kategorie-Strategie (z.B. "BANK_BAFIN")   |
| steps_completed  | JSONB-Array der durchgefuehrten Schritte mit Ergebnis      |
| steps_pending    | JSONB-Array der noch ausstehenden Schritte                 |
| data_gaps        | Welche Felder noch fehlen (email, phone, website...)       |
| total_cost_eur   | Kumulierte API-Kosten fuer diesen Kontakt                  |
| last_step_at     | Wann wurde der letzte Schritt durchgefuehrt                |
| quality_score    | Aktueller Quality Score nach letztem Schritt               |
| created_at       | Erstellung                                                 |
+------------------+------------------------------------------------------------+
```

Jeder Schritt im Ledger hat folgende Struktur:

```text
{
  "step": "google_places_search",
  "provider": "google_places",
  "executed_at": "2026-02-24T10:00:00Z",
  "cost_eur": 0.032,
  "fields_found": ["name", "phone", "address"],
  "fields_missing": ["email", "website"],
  "raw_confidence": 60,
  "notes": "Kein Website-Eintrag bei Google"
}
```

---

## C) Registerdatenquellen (BaFin, IHK)

### BaFin-Bankenregister
- **URL**: https://portal.mvp.bafin.de/database/InstInfo/
- **Format**: CSV-Download aller zugelassenen Institute
- **Inhalt**: Name, Rechtsform, Sitz, BaFin-ID
- **Fehlende Daten**: Telefon, E-Mail, Website, Ansprechpartner
- **Strategie**: CSV einmalig importieren, dann per Google Places / Firecrawl die Kontaktdaten ergaenzen

### IHK-Vermittlerregister
- **URL**: https://www.vermittlerregister.info/
- **Format**: Suchmaske, kein Bulk-Download
- **Inhalt**: Name, Registrierungsnummer, Erlaubnistyp (34d/f/h/i), PLZ/Ort
- **Fehlende Daten**: Telefon, E-Mail, Website
- **Strategie**: Apify-Scraper fuer das Vermittlerregister (paginierte Suche nach PLZ), dann Enrichment per Google Places + Firecrawl
- **Hinweis**: Dies ist die EINZIGE zuverlaessige Quelle fuer 34d/f/h-Vermittler

---

## D) Technische Umsetzung

### D.1 Engine-Erweiterung: `spec.ts`

Neuer Typ `CategorySourceStrategy` im Market Directory Engine Spec:

```typescript
export interface SourceStep {
  stepId: string;
  provider: 'google_places' | 'apify_maps' | 'apify_portal' | 'firecrawl' | 'bafin_csv' | 'ihk_register' | 'linkedin_api' | 'manual';
  purpose: 'discovery' | 'enrichment' | 'verification';
  priority: number;
  config: Record<string, unknown>;
  expectedFields: string[];
  estimatedCostEur: number;
  skipIf?: string[];  // z.B. ["has_email"] -> Skip wenn E-Mail schon vorhanden
}

export interface CategorySourceStrategy {
  categoryCode: string;
  strategyCode: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps: SourceStep[];
  notes: string;
}
```

Registry mit konkreten Strategien fuer jede Kategorie (ca. 15 Eintraege).

### D.2 Neue DB-Tabelle: `contact_strategy_ledger`

```sql
CREATE TABLE public.contact_strategy_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  strategy_code TEXT NOT NULL,
  steps_completed JSONB DEFAULT '[]'::jsonb,
  steps_pending JSONB DEFAULT '[]'::jsonb,
  data_gaps TEXT[] DEFAULT '{}',
  total_cost_eur NUMERIC(10,4) DEFAULT 0,
  quality_score NUMERIC(5,2) DEFAULT 0,
  last_step_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.contact_strategy_ledger ENABLE ROW LEVEL SECURITY;
-- Policy: tenant_id via contacts join
```

### D.3 Neue Edge Function: `sot-research-strategy-resolver`

Aufgabe: Anhand der Kategorie eines Kontakts die richtige Strategie aus dem Spec laden und den naechsten Schritt bestimmen.

- Input: `{ contact_id, category_code }`
- Output: `{ strategy_code, next_step, estimated_cost }`
- Logik: Prueft den Strategy Ledger, welche Schritte schon durchlaufen sind, und gibt den naechsten zurueck

### D.4 Anpassung `sot-research-engine`

Der bestehende Engine wird erweitert:
- Neuer Intent: `strategy_step` -- fuehrt genau einen Schritt der Kategorie-Strategie aus
- Neuer Intent: `bulk_registry_import` -- fuer BaFin-CSV und IHK-Bulk-Imports
- Die bestehenden Intents (`search_contacts`, `search_portals`) bleiben erhalten

### D.5 Neue Edge Function: `sot-registry-import`

Fuer den Import von Registerdaten (BaFin, IHK):
- Nimmt eine CSV/JSON-Datei entgegen
- Parsed die Eintraege
- Erstellt Kontakte mit `source: "bafin_register"` bzw. `"ihk_register"`
- Erstellt Strategy-Ledger-Eintraege mit dem Discovery-Schritt als abgeschlossen
- Setzt automatisch die Enrichment-Schritte als `pending`

---

## E) Kostenmodell (aktualisiert mit Strategy Ledger)

Kosten pro Kontakt nach Kategorie:

```text
+----------------------------+---------------+--------------------------------------+
| Kategorie                  | Kosten/Kontakt| Aufschluesselung                     |
+============================+===============+======================================+
| Bank (BaFin)               | ~0.01 EUR     | CSV gratis, Google Places 0.003,     |
|                            |               | Firecrawl 0.005                      |
+----------------------------+---------------+--------------------------------------+
| Makler (Portal-Scraping)   | ~0.03 EUR     | Apify Portal 0.02, Google 0.003,     |
|                            |               | Firecrawl 0.005                      |
+----------------------------+---------------+--------------------------------------+
| Hausverwaltung             | ~0.02 EUR     | Google Places 0.003, Firecrawl 0.005,|
|                            |               | AI-Merge 0.01                        |
+----------------------------+---------------+--------------------------------------+
| Versicherungsmakler (34d)  | ~0.04 EUR     | IHK-Scraping 0.02, Google 0.003,     |
|                            |               | Firecrawl 0.005, AI 0.01             |
+----------------------------+---------------+--------------------------------------+
| Family Office              | ~0.08 EUR     | Google Search 0.003, LinkedIn* 0.05, |
|                            |               | Firecrawl 0.01, AI 0.02              |
+----------------------------+---------------+--------------------------------------+
| Pet-Kategorien             | ~0.02 EUR     | Google Places 0.003, Firecrawl 0.005,|
|                            |               | AI-Merge 0.01                        |
+----------------------------+---------------+--------------------------------------+
```

*LinkedIn ist aktuell nicht integriert -- Kosten sind geschaetzt fuer spaeter.

### Hochrechnung fuer 500 Kontakte (gemischter Kategorie-Mix)

Annahme: 30% Immobilien-Makler, 25% Finanzdienstleister, 20% Banken, 15% Pet, 10% Sonstige

```text
150 Makler       x 0.03 = 4.50 EUR
125 Finanz       x 0.04 = 5.00 EUR
100 Banken       x 0.01 = 1.00 EUR
 75 Pet          x 0.02 = 1.50 EUR
 50 Sonstige     x 0.02 = 1.00 EUR
─────────────────────────────────
TOTAL:                   13.00 EUR
+ Lovable AI (Merge):    ~2.00 EUR (geschaetzt, da ueber Gateway)
─────────────────────────────────
GESAMT:                  ~15.00 EUR fuer 500 Kontakte
```

---

## F) Umsetzungsschritte

### Schritt 1: Engine Spec erweitern
- `CategorySourceStrategy` und `SourceStep` Interfaces in `src/engines/marketDirectory/spec.ts`
- Konkrete Strategy-Registry fuer alle 15+ Kategorien
- CATEGORY_REGISTRY um `sourceStrategy` Referenz erweitern

### Schritt 2: DB-Tabelle `contact_strategy_ledger`
- Migration mit RLS (tenant-scoped via contacts-Join)
- Index auf `contact_id` und `strategy_code`

### Schritt 3: Edge Function `sot-research-strategy-resolver`
- Strategie-Aufloesung und Naechster-Schritt-Logik
- Integration mit bestehendem `sot-research-engine`

### Schritt 4: `sot-research-engine` erweitern
- Neuer Intent `strategy_step` fuer Einzelschritt-Ausfuehrung
- Bestehende Logik bleibt erhalten (backward compatible)

### Schritt 5: `sot-registry-import` Edge Function
- BaFin-CSV-Parser
- IHK-Register-Scraper (via Apify)
- Automatische Ledger-Erstellung

### Schritt 6: Discovery Scheduler anpassen
- Kategorie-aware Batch-Planung
- Kosten-Tracking pro Kategorie im Run-Log

---

## G) Zusammenfassung der Architektur-Entscheidungen

1. **Apify bleibt**: Unverzichtbar fuer Portal-Scraping (ImmoScout, Immowelt) und IHK-Register
2. **Google Places bleibt**: Beste strukturierte Erstquelle, aber KEINE E-Mails
3. **Firecrawl bleibt**: Website-Scraping fuer E-Mail-Extraktion (guenstiger als Apify fuer Einzelseiten)
4. **Lovable AI bleibt**: Merge, Dedupe, Scoring ueber den Gateway
5. **NEU: Registerdaten**: BaFin-CSV und IHK als kostenguenstige Bulk-Quellen
6. **NEU: Strategy Ledger**: Transparente Nachverfolgung pro Kontakt, was recherchiert wurde und was fehlt
7. **SPAETER: LinkedIn**: Fuer Family Offices und Unternehmenskontakte (erfordert separate API-Integration)
