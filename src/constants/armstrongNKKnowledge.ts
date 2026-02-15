/**
 * Armstrong Knowledge Base — NK-Abrechnung Seed Data
 * 
 * 7 KB-Eintraege fuer deterministische + KI-gestuetzte Assistenz
 * bei der Nebenkostenabrechnung.
 */

export const ARMSTRONG_NK_KNOWLEDGE = [
  {
    item_code: 'NK.GLOSSAR.001',
    category: 'immobilien',
    title: 'Glossar Nebenkostenabrechnung',
    scope: 'nk_abrechnung',
    content: `## Glossar Nebenkostenabrechnung

**Warmmiete** = Kaltmiete + NK-Vorauszahlung + Heizkosten-Vorauszahlung. Der Mieter ueberweist einen Betrag.

**Kaltmiete** (Nettokaltmiete) = Grundmiete ohne Nebenkosten. Vertraglich vereinbart im Mietvertrag.

**NK-Vorauszahlung** = Monatlicher Abschlag des Mieters fuer umlagefaehige Betriebskosten. Wird jaehrlich abgerechnet.

**Heizkosten-Vorauszahlung** = Monatlicher Abschlag fuer Heizung/Warmwasser. Wird separat oder zusammen mit NK abgerechnet.

**Hausgeld** = Monatsbetrag, den der WEG-Eigentuemer an die Hausverwaltung zahlt. Enthalt umlagefaehige + nicht umlagefaehige Kosten + Ruecklage.

**WEG** = Wohnungseigentuemergemeinschaft. Verwaltet Gemeinschaftseigentum.

**MEA** = Miteigentumsanteil. Bruchteil am Gemeinschaftseigentum (z.B. 85,5/1000).

**BetrKV** = Betriebskostenverordnung. Regelt welche Kosten auf Mieter umgelegt werden duerfen (§2 Nr. 1-17).

**Umlagefaehig** = Kosten, die der Vermieter auf den Mieter umlegen darf (z.B. Grundsteuer, Wasser, Muell).

**Nicht umlagefaehig** = Kosten, die der Vermieter selbst tragen muss (z.B. Verwaltung, Ruecklage, Instandhaltung).

**Grundsteuerbescheid** = Jaehrlicher Bescheid vom Finanzamt. Grundsteuer wird direkt vom Eigentuemer bezahlt und ist umlagefaehig.`,
  },
  {
    item_code: 'NK.KOSTENARTEN.001',
    category: 'immobilien',
    title: 'Kostenarten-Katalog mit Umlagefaehigkeit',
    scope: 'nk_abrechnung',
    content: `## Kostenarten-Katalog (BetrKV §2)

### Umlagefaehige Kosten:
1. Grundsteuer (§2 Nr. 1) — Schluessel: MEA oder Flaeche
2. Wasserversorgung (§2 Nr. 2) — Schluessel: Personen oder Verbrauch
3. Entwaesserung/Abwasser (§2 Nr. 3) — Schluessel: Personen oder Verbrauch
4. Heizkosten (§2 Nr. 4a) — Schluessel: Verbrauch (70/30-Regel)
5. Warmwasser (§2 Nr. 5a) — Schluessel: Verbrauch
6. Aufzug (§2 Nr. 7) — Schluessel: Einheiten oder MEA
7. Strassenreinigung/Winterdienst (§2 Nr. 8) — Schluessel: Flaeche
8. Muellbeseitigung (§2 Nr. 8) — Schluessel: Personen oder Einheiten
9. Gebaeudereinigung (§2 Nr. 9) — Schluessel: Flaeche
10. Gartenpflege (§2 Nr. 10) — Schluessel: Flaeche oder MEA
11. Beleuchtung/Allgemeinstrom (§2 Nr. 11) — Schluessel: MEA oder Einheiten
12. Schornsteinfeger (§2 Nr. 12) — Schluessel: Einheiten
13. Sach-/Gebaeudeversicherung (§2 Nr. 13) — Schluessel: MEA oder Flaeche
14. Hauswart/Hausmeister (§2 Nr. 14) — Schluessel: MEA oder Flaeche
15. Gemeinschaftsantenne/Kabel (§2 Nr. 15) — Schluessel: Einheiten
16. Wascheinrichtung (§2 Nr. 16) — Schluessel: Einheiten oder Nutzung
17. Sonstige Betriebskosten (§2 Nr. 17) — Muss im Mietvertrag vereinbart sein

### Nicht umlagefaehige Kosten:
- Verwaltungskosten (Hausverwaltung)
- Instandhaltungsruecklage
- Instandhaltung/Reparaturen
- Bankgebuehren der WEG`,
  },
  {
    item_code: 'NK.MAPPING.001',
    category: 'immobilien',
    title: 'Keyword-Mapping-Regeln (label_raw → category_code)',
    scope: 'nk_abrechnung',
    content: `## Mapping-Regeln fuer WEG-Abrechnungspositionen

Die Engine mappt Rohtexte aus WEG-Abrechnungen auf normierte Kategorien:

| Keywords (case-insensitive) | → Kategorie |
|---|---|
| Grundsteuer | grundsteuer |
| Wasser, Frischwasser, Kaltwasser, Trinkwasser | wasser |
| Abwasser, Entwaesserung, Kanal | abwasser |
| Heizung, Heizkosten, Fernwaerme, Heizoel, Gas | heizung |
| Warmwasser | warmwasser |
| Aufzug, Fahrstuhl, Lift | aufzug |
| Strassenreinigung, Winterdienst | strassenreinigung |
| Muell, Abfall, Entsorgung | muell |
| Gebaeudereinigung, Treppenhausreinigung | gebaeudereinigung |
| Garten, Gruenpflege | gartenpflege |
| Beleuchtung, Allgemeinstrom, Hausstrom | beleuchtung |
| Schornsteinfeger, Kaminkehrer | schornsteinfeger |
| Versicherung, Gebaeudeversicherung | sachversicherung |
| Hausmeister, Hauswart | hausmeister |
| Antenne, Kabel | antenne_kabel |
| Verwaltung, Verwalter, Hausverwaltung | verwaltung (NICHT umlagefaehig!) |
| Ruecklage, Erhaltungsruecklage | ruecklage (NICHT umlagefaehig!) |
| Instandhaltung, Reparatur | instandhaltung (NICHT umlagefaehig!) |

**Achtung**: "Verwaltung", "Ruecklage" und "Instandhaltung" sind NICHT umlagefaehig und muessen herausgefiltert werden!`,
  },
  {
    item_code: 'NK.ALLOCATION.001',
    category: 'immobilien',
    title: 'Verteilerschluessel-Erklaerung',
    scope: 'nk_abrechnung',
    content: `## Verteilerschluessel (Allocation Keys)

### Berechnungsformel:
Anteil Einheit = Gesamtkosten × (Basis Einheit / Basis Gesamt)

### Schluessel-Typen:
- **MEA** (Miteigentumsanteil): Haeufigster Schluessel in WEG. Anteil = MEA_Einheit / MEA_Gesamt
- **Flaeche (m²)**: Wohnflaeche. Anteil = m²_Einheit / m²_Gesamt
- **Personen**: Bewohnerzahl. Anteil = Personen_Einheit / Personen_Gesamt
- **Verbrauch**: Zaehlerablesung (Heizung, Wasser). Direkte Zuordnung.
- **Einheiten**: Gleichverteilung. Anteil = 1 / Anzahl_Einheiten

### Unterjaehrigkeit:
Bei Mieterwechsel innerhalb der Abrechnungsperiode wird der Anteil zeitanteilig berechnet:
Anteil_zeitanteilig = Anteil × (Miet_Tage / Perioden_Tage)`,
  },
  {
    item_code: 'NK.FORMELL.001',
    category: 'immobilien',
    title: 'Formelle Anforderungen wirksame Abrechnung',
    scope: 'nk_abrechnung',
    content: `## Formelle Anforderungen (BGH-konform)

Eine Nebenkostenabrechnung ist nur wirksam, wenn sie folgende Elemente enthaelt:

1. **Zusammenstellung der Gesamtkosten** — Jede Kostenart mit Gesamtbetrag
2. **Angabe des Verteilerschluessels** — Welcher Schluessel wurde verwendet
3. **Berechnung des Mieteranteils** — Nachvollziehbare Herleitung
4. **Abzug der Vorauszahlungen** — Geleistete NK-Vorauszahlungen
5. **Saldo** — Nachzahlung oder Guthaben

### Fristen:
- Abrechnung muss spaetestens 12 Monate nach Ende der Abrechnungsperiode zugehen (§556 Abs. 3 BGB)
- Mieter hat 12 Monate Einspruchsfrist nach Zugang

### Abrechnungsperiode:
- Maximal 12 Monate
- Ueblicherweise Kalenderjahr (01.01. – 31.12.)`,
  },
  {
    item_code: 'NK.FEHLER.001',
    category: 'immobilien',
    title: 'Typische Fehler und Recovery',
    scope: 'nk_abrechnung',
    content: `## Typische Fehler bei der NK-Abrechnung

### 1. Nicht umlagefaehige Kosten einbezogen
**Problem**: Verwaltung oder Ruecklage wurden als umlagefaehig markiert
**Recovery**: Engine filtert automatisch. Bei unsicherer Zuordnung → needs_review

### 2. Falscher Verteilerschluessel
**Problem**: z.B. Wasser nach MEA statt nach Personen
**Recovery**: Engine uebernimmt Schluessel aus WEG-Abrechnung. Warnung wenn unueblich.

### 3. Fehlende Basiswerte
**Problem**: total_area_sqm = 0 oder mea_total = 0
**Recovery**: Engine gibt Warning. Berechnung mit 0 ergibt 0 → User muss Stammdaten pflegen.

### 4. Unterjaehrigkeit nicht beruecksichtigt
**Problem**: Mieter zog unterjährig ein/aus, Vorauszahlungen nicht angepasst
**Recovery**: Engine berechnet automatisch anteilige Tage.

### 5. Grundsteuerbescheid fehlt
**Problem**: Grundsteuer kann nicht in Abrechnung aufgenommen werden
**Recovery**: Blocker im Readiness-Check. Berechnung erst nach Upload + Akzeptanz.

### 6. WEG-Abrechnung nicht akzeptiert
**Problem**: Dokument vorhanden aber nicht reviewed
**Recovery**: link_status muss auf 'accepted' stehen. User wird zur Pruefung aufgefordert.`,
  },
  {
    item_code: 'NK.ERKLAERTEXT.001',
    category: 'immobilien',
    title: 'Textbausteine fuer PDF und UI',
    scope: 'nk_abrechnung',
    content: `## Textbausteine

### PDF-Betreff:
"Betriebskostenabrechnung für den Zeitraum {period_start} – {period_end}"

### PDF-Einleitung:
"Sehr geehrte/r {tenant_name}, hiermit erhalten Sie die Abrechnung der Betriebskosten für die von Ihnen gemietete Wohnung {unit_label} im Objekt {property_address}."

### Nachzahlung:
"Es ergibt sich eine Nachzahlung in Höhe von {balance} EUR. Bitte überweisen Sie den Betrag innerhalb von 30 Tagen."

### Guthaben:
"Es ergibt sich ein Guthaben zu Ihren Gunsten in Höhe von {balance} EUR. Der Betrag wird Ihnen erstattet."

### Rechtshinweis:
"Einwendungen gegen diese Abrechnung sind innerhalb von 12 Monaten nach Zugang geltend zu machen (§ 556 Abs. 3 BGB)."

### UI-Tooltips:
- "MEA = Miteigentumsanteil. Ihr Anteil an den Gesamtkosten des Hauses."
- "Nicht umlagefähig = Diese Kosten trägt der Eigentümer selbst."
- "Grundsteuer wird direkt vom Eigentümer bezahlt und als umlagefähige Position hinzugefügt."`,
  },
];
