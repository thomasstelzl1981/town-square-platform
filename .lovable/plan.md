
# V+V Daten-Abgleich: Bugs + KI-gestuetzter Pre-Fill

## Analyse: Warum werden die Daten nicht geladen?

Es gibt **3 kritische Datenbankschema-Mismatches** im Hook `useVVSteuerData.ts`, die verhindern, dass die Formulardaten befuellt werden:

### Bug 1: `leases` hat KEINE Spalte `property_id`
Der Hook fragt `leases` mit `.eq('property_id', propertyId)` ab — diese Spalte existiert aber nicht. Die `leases`-Tabelle verknuepft ueber `unit_id`, und `units` hat die `property_id`. Ergebnis: **Kaltmiete und NK-Vorauszahlungen sind immer 0**.

### Bug 2: `nk_periods` hat KEINE Spalte `year`
Der Hook fragt `.eq('year', taxYear)` ab — die Tabelle hat aber `period_start` und `period_end`. Ergebnis: **Alle NK-Daten (Grundsteuer, nicht umlagefaehige Kosten) sind immer 0**.

### Bug 3: `property_financing` ist leer (0 Zeilen)
Die Tabelle existiert, hat aber keine Demo-Daten. Selbst wenn Daten existieren wuerden, fehlt eine Berechnung der jaehrlichen Zinsen aus Zinssatz und Restschuld, wenn `annual_interest` nicht manuell gepflegt ist. Ergebnis: **Schuldzinsen sind immer 0**.

---

## Loesungsstrategie: 3 Ebenen

### Ebene 1: Schema-Bugs fixen (useVVSteuerData.ts)

**Leases via Units joinen:**
```text
VORHER (kaputt):
  supabase.from('leases').select(...).eq('property_id', propertyId)

NACHHER (korrekt):
  1. Units fuer Property laden: supabase.from('units').select('id').eq('property_id', pid)
  2. Leases fuer diese Units laden: supabase.from('leases').select(...).in('unit_id', unitIds)
```

**NK-Periods nach Datumsbreich filtern:**
```text
VORHER (kaputt):
  supabase.from('nk_periods').eq('year', taxYear)

NACHHER (korrekt):
  supabase.from('nk_periods')
    .gte('period_start', `${taxYear}-01-01`)
    .lte('period_end', `${taxYear}-12-31`)
```

**Financing Fallback:**
Wenn `annual_interest` leer ist, berechnen aus: `current_balance * interest_rate / 100`

### Ebene 2: Demo-Daten fuer Finanzierungen (Migration)

3 Demo-Eintraege in `property_financing` fuer die 3 Demo-Objekte, damit der V+V-Flow sofort sichtbare Zinsen zeigt.

### Ebene 3: KI-gestuetzter Plausibilitaets-Check (Edge Function)

Eine neue Edge Function `sot-vv-prefill-check` die per Lovable AI die aggregierten Daten plausibilisiert, bevor sie dem User praesentiert werden:

**Ablauf:**
1. Frontend sammelt alle automatisch aggregierten Daten (Miete, NK, Zinsen, AfA)
2. Sendet diese an die Edge Function
3. Die Edge Function prueft per KI:
   - Ist die Kaltmiete plausibel fuer Lage/Groesse? (z.B. 850 EUR fuer 75qm Berlin = OK)
   - Stimmt das Verhaeltnis NK-Vorauszahlung zu tatsaechlichen NK-Kosten?
   - Sind die Schuldzinsen plausibel fuer den Darlehensbetrag?
   - Fehlen offensichtliche Kostenpositionen (z.B. Verwaltungskosten bei WEG)?
4. Gibt strukturiertes Feedback zurueck: Warnungen, Hinweise, Korrekturen

**Warum KI hier sinnvoll ist:**
- Einfaches Tabellen-Matching kann nur pruefen "ist der Wert > 0?"
- KI kann kontextbezogen pruefen: "850 EUR Kaltmiete fuer 75qm in Berlin-Schadowstr. ist plausibel" vs. "850 EUR fuer 120qm in Muenchen-Leopoldstr. koennte zu niedrig sein"
- KI kann fehlende Positionen erkennen: "Es gibt NK-Posten fuer Verwaltung, aber keine Verwaltungskosten in den manuellen Werbungskosten — uebernehmen?"
- KI kann die Zinslast plausibilisieren: "280.000 EUR Kaufpreis mit 0 EUR Zinsen — fehlt eine Finanzierung?"

**UI-Integration:**
- Nach dem Laden der Formulardaten: "Plausibilitaet pruefen"-Button
- Ergebnis als Hinweis-Banner ueber dem Formular mit Warnungen/Tipps
- Keine automatische Aenderung — der User entscheidet

---

## Technische Umsetzung

### Datei 1: `src/hooks/useVVSteuerData.ts`
- Leases-Query umbauen: Erst Units laden, dann Leases per `unit_id`
- NK-Periods-Query fixen: `period_start`/`period_end` statt `year`
- Financing-Fallback: `annual_interest` berechnen wenn NULL
- Units-Daten cachen fuer Lease-Property-Zuordnung

### Datei 2: SQL-Migration (Demo-Finanzierungen)
- 3 Eintraege in `property_financing` fuer BER-01, MUC-01, HH-01
- Realistische Werte (z.B. BER-01: 224.000 EUR Darlehen, 2.8% Zins, 525 EUR/Monat)

### Datei 3: `supabase/functions/sot-vv-prefill-check/index.ts` (NEU)
- Empfaengt: `{ propertyId, propertyName, address, city, areaSqm, yearBuilt, purchasePrice, income: {...}, costs: {...}, afa: {...} }`
- Sendet an Lovable AI (google/gemini-3-flash-preview) mit deutschem System-Prompt fuer Steuerplausibilisierung
- Nutzt Tool-Calling fuer strukturiertes Output: `{ warnings: [], suggestions: [], missingItems: [] }`
- Gibt JSON zurueck mit Plausibilitaets-Feedback

### Datei 4: `src/components/vv/VVAnlageVForm.tsx`
- "Plausibilitaet pruefen"-Button neben "Speichern"
- Ergebnis-Banner mit Warnungen (gelb) und Hinweisen (blau)
- Vorschlaege koennen per Klick uebernommen werden (z.B. "Verwaltungskosten aus NK uebernehmen: 3.600 EUR")

### Datei 5: `supabase/config.toml`
- Neue Function `sot-vv-prefill-check` registrieren

---

## Erwartetes Ergebnis

- **Sofort sichtbar**: Kaltmieten, NK-Vorauszahlungen, Grundsteuer, nicht umlagefaehige Kosten werden korrekt in die Formulare geladen
- **Demo-Daten**: Schuldzinsen zeigen realistische Werte
- **KI-Check**: User kann vor dem Bestaetigen die Daten auf Plausibilitaet pruefen lassen
- **Keine automatische Aenderung**: KI macht Vorschlaege, User entscheidet
