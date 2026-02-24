

# Automatisierte Kontaktanreicherung — Erweitert um Dedupe + Kosten-Controlling

## 1. Duplikat-Vermeidung (3 Schichten)

Die Engine hat bereits alle Dedupe-Funktionen gebaut (`findDedupeMatches`, `buildDedupeKey`). Sie werden jetzt in den Scheduler eingebaut.

### Schicht 1: Intra-Batch Dedupe (innerhalb eines Suchlaufs)
- Bevor Ergebnisse aus einem API-Call gespeichert werden, wird `buildDedupeKey` auf jeden Kontakt angewendet
- Kontakte mit identischem Key innerhalb desselben Batch werden per `mergeContacts` zusammengefuehrt
- Verhindert: Gleicher Friseur erscheint 3x im selben Google-Places-Ergebnis

### Schicht 2: Cross-Order Dedupe (gegen bestehende soat_search_results)
- Vor dem INSERT in `soat_search_results` wird geprueft ob ein Kontakt mit gleicher E-Mail, Domain, Telefon oder Name+PLZ bereits existiert
- Lookup via SQL: `SELECT id, email, phone, company_name, postal_code FROM soat_search_results WHERE email = $1 OR phone = $2 OR (company_name ILIKE $3 AND postal_code = $4)`
- Bei Match: Eintrag wird NICHT erneut gespeichert, stattdessen wird `source_refs_json` des bestehenden Eintrags erweitert (neue Quelle anhaengen)
- Zaehler: `counters_json.duplicates_skipped` wird hochgezaehlt

### Schicht 3: Kontaktbuch Dedupe (gegen contacts-Tabelle)
- Bereits implementiert in `useResearchImport.ts` via `findDedupeMatches`
- Beim Auto-Import (confidence >= 85%) im Scheduler wird dieselbe Logik angewendet
- Match-Typen nach Prioritaet: E-Mail > Domain > Telefon > Name+Adresse > Firmenname

### Neue DB-Spalte fuer Tracking
- `soat_search_results.dedupe_hash` (TEXT) — gespeicherter `buildDedupeKey`-Wert
- Unique Index auf `(dedupe_hash)` um DB-seitige Duplikate zu verhindern (INSERT ON CONFLICT DO NOTHING)

## 2. Kosten-Controlling (Credit-basiert)

Das Credit-System (`sot-credit-preflight`) existiert bereits mit `preflight`, `deduct` und `balance` Aktionen. Es wird in den Scheduler integriert.

### Credit-Berechnung pro Suchlauf

| Aktion | Credits | Erklaerung |
|--------|---------|------------|
| Google Places Call (1 Batch a 20 Ergebnisse) | 1 Cr | 0.25 EUR pro API-Call |
| Apify Crawler (1 Batch a 25 Ergebnisse) | 2 Cr | Rechenzeit + Proxy |
| Firecrawl E-Mail-Scrape (pro 10 Websites) | 1 Cr | API-Kosten |
| KI Merge + Scoring (1 Batch a 25 Kontakte) | 2 Cr | Gemini-Call |
| **Gesamt pro Batch (25 Kontakte)** | **~6 Cr** | **1.50 EUR** |
| **Tageslimit (32 Batches = 800 raw)** | **~192 Cr** | **48.00 EUR** |

### Credit-Controlling im Scheduler

```text
Vor jedem Batch:
1. sot-credit-preflight aufrufen (action: "preflight", credits: 6)
2. Falls Guthaben nicht reicht → Scheduler stoppt sofort
3. Falls OK → Batch ausfuehren
4. Nach Batch: sot-credit-preflight (action: "deduct", credits: tatsaechlich verbraucht)
```

### Tages-Budget-Limit

Neue Konstante in `spec.ts`:

```text
DISCOVERY_COST_LIMITS = {
  maxCreditsPerDay: 200,       // Hartes Tageslimit
  maxCreditsPerBatch: 8,       // Safety-Cap pro Batch
  warningThreshold: 150,       // Ab hier Warnung im Dashboard
  costPerGoogleCall: 1,
  costPerApifyCall: 2,
  costPerFirecrawlBatch: 1,
  costPerAiMerge: 2,
}
```

### Kosten-Tracking Tabelle

Neue Tabelle `discovery_run_log`:

| Spalte | Typ | Zweck |
|--------|-----|-------|
| id | uuid | PK |
| run_date | date | Tagesdatum |
| tenant_id | uuid | Mandant |
| region_name | text | Welche Region gescannt |
| category_code | text | Welche Kategorie |
| raw_found | int | Gefundene Kontakte (vor Dedupe) |
| duplicates_skipped | int | Duplikate uebersprungen |
| approved_count | int | Auto-approved (>= 85%) |
| credits_used | int | Verbrauchte Credits |
| cost_eur | numeric | Credits x 0.25 EUR |
| provider_calls_json | jsonb | Aufschluesselung (Google: 1, Apify: 1, ...) |
| created_at | timestamptz | Zeitstempel |

### Dashboard-Anzeige (Zone 1)

Im bestehenden Admin-Dashboard wird ein kleines Kosten-Widget ergaenzt:
- Heute: X Credits verbraucht / 200 Budget
- Diese Woche: Y Credits / Z EUR
- Kontakte/Credit-Effizienz: "8.3 Kontakte pro Credit"

## 3. Region-Queue mit Cooldown

Neue Tabelle `discovery_region_queue` (wie im vorherigen Plan):

| Spalte | Typ | Zweck |
|--------|-----|-------|
| id | uuid | PK |
| tenant_id | uuid | Mandant |
| region_name | text | z.B. "Berlin" |
| postal_code_prefix | text | z.B. "1" |
| population | int | 3.645.000 |
| last_scanned_at | timestamptz | Letzter Scan |
| cooldown_until | timestamptz | Naechster Scan fruehestens |
| total_contacts | int | Bisher gefunden |
| approved_contacts | int | Davon freigegebene |
| last_category_index | int | Rotation: welche Kategorie als naechstes |
| priority_score | numeric | Berechnet via `scoreRegion()` |

**Cooldown-Logik**: Nach einem Scan bekommt die Region+Kategorie-Kombination 3 Tage Pause. Das verhindert dass Berlin jeden Tag die gleichen Finanzberater sucht.

## 4. Scheduler Edge Function

**Datei:** `supabase/functions/sot-discovery-scheduler/index.ts`

Ablauf:

```text
1. Auth: Service-Role-Key ODER Cron-Secret pruefen
2. Tenant laden (Platform-Tenant fuer automatische Laeufe)
3. Credit-Preflight: Tagesbudget pruefen (200 Cr verfuegbar?)
4. Region-Queue laden, Prioritaeten via scoreRegion() berechnen
5. Budget planen via planDailyBudget()
6. Fuer jede Region+Kategorie (solange Budget > 0):
   a. Credit-Preflight fuer diesen Batch (6 Cr)
   b. Falls nicht genug → STOP
   c. soat_search_order erstellen (automatisch, source: "scheduler")
   d. sot-research-engine aufrufen
   e. Intra-Batch Dedupe (buildDedupeKey)
   f. Cross-Order Dedupe (gegen soat_search_results)
   g. Kontaktbuch Dedupe (gegen contacts)
   h. Ergebnisse speichern (mit dedupe_hash)
   i. Auto-Import (confidence >= 85%)
   j. Credits abbuchen (sot-credit-preflight action: "deduct")
   k. discovery_run_log schreiben
   l. Region-Queue aktualisieren (counters, cooldown, category_index++)
   m. 3 Sekunden Pause
7. Zusammenfassung loggen
```

## 5. Cron-Job

SQL fuer `pg_cron` (06:00 UTC taeglich):

```text
Zeitplan: 0 6 * * *
Ziel: POST an sot-discovery-scheduler
Auth: Service-Role-Key
```

## 6. Engine-Erweiterungen

**Datei:** `src/engines/marketDirectory/spec.ts` — Neue Typen + Konstanten:

- `DiscoveryCostLimits` Interface + `DISCOVERY_COST_LIMITS` Konstante
- `DiscoveryRunLogEntry` Interface

**Datei:** `src/engines/marketDirectory/engine.ts` — Neue Pure Functions:

- `calcBatchCost(providers: string[]): number` — Berechnet Credits pro Batch
- `checkDailyBudget(usedToday: number, limit: number): { canProceed: boolean; remaining: number }`
- `buildDedupeQuery(contact): { email, phone, companyName, postalCode }` — SQL-Parameter fuer Cross-Order Dedupe

## Dateien und Aenderungen (Uebersicht)

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `supabase/functions/sot-discovery-scheduler/index.ts` | NEU | Scheduler mit 3-Schicht-Dedupe + Credit-Preflight |
| `src/engines/marketDirectory/spec.ts` | ERWEITERN | `DiscoveryCostLimits`, `DiscoveryRunLogEntry` |
| `src/engines/marketDirectory/engine.ts` | ERWEITERN | `calcBatchCost()`, `checkDailyBudget()` |
| DB Migration | NEU | `discovery_region_queue` + `discovery_run_log` Tabellen mit RLS |
| DB Migration | NEU | `dedupe_hash`-Spalte + Unique Index auf `soat_search_results` |
| DB Migration | NEU | Initialdaten: 50 Regionen aus `TOP_REGIONS_DE` |
| pg_cron SQL | NEU | Cronjob 06:00 UTC |

## Was NICHT angefasst wird

- `sot-research-engine` — funktioniert bereits
- `useSoatSearchEngine.ts` — gerade erst repariert
- `useResearchImport.ts` — gerade erst repariert
- UI-Seiten — bestehende Tabellen zeigen Daten automatisch via Realtime

## Erwartetes Ergebnis

1. Scheduler laeuft taeglich 06:00-07:30 UTC automatisch
2. Pro Tag max ~500 neue, nicht-duplizierte Kontakte
3. 3-Schicht-Dedupe verhindert doppelte Eintraege zuverlaessig
4. Credit-System stoppt automatisch bei Budget-Ueberschreitung
5. Kosten transparent im Dashboard: Credits/Tag, EUR/Woche, Effizienz
6. Region-Rotation sorgt fuer systematische Deutschland-Abdeckung in ~10 Tagen

