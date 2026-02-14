# Backlog V8 — Konsolidiert: MOD-04 Verwaltung + MOD-18 Finanzanalyse

## Status-Legende
- 🔴 TODO — Noch nicht begonnen
- 🟡 WIP — In Arbeit
- 🟢 DONE — Abgeschlossen

---

## PHASE 1: MOD-04 Verwaltung (/portal/immobilien/verwaltung)

### 1-1: Backlog-Datei erstellen 🟢
- Datei: `src/docs/backlog-consolidated-v8.md`

### 1-2: DB-Migration — Templates seeden + BIC 🟢
- `ALTER TABLE msv_bank_accounts ADD COLUMN IF NOT EXISTS bic text;`
- INSERT 5 Textvorlagen in `msv_templates`:
  - ZAHLUNGSERINNERUNG (Stufe 1)
  - MAHNUNG (Stufe 2)
  - LETZTE_MAHNUNG (Stufe 3)
  - MIETERHOEHUNG
  - KONTAKT_RUECKFRAGE

### 1-3: Hook useMSVData 🟢
- Datei: `src/hooks/useMSVData.ts`
- Liest: Properties (rental_managed), Units, Leases, Contacts
- Liest: msv_rent_payments, msv_book_values, msv_bwa_entries
- Berechnet: Zahlstatus-Ampel, säumige Fälle, Mieterhöhungs-Kandidaten, Monatshistorie
- Demo-Fallback bei GP-VERWALTUNG Toggle

### 1-4: VerwaltungTab komplett umbauen 🟢
- Datei: `src/pages/portal/immobilien/VerwaltungTab.tsx`
- Ersetzt alte SectionCards (ObjekteTab/MieteingangTab/VermietungTab) durch:
  - WidgetGrid mit echten Properties + Demo-Widget
  - selectedPropertyId filtert 3 Kacheln
  - MietlisteTable, AufgabenSection, BWAControllingSection direkt eingebunden

### 1-5: Kachel 1 — MietlisteTable DB-Anbindung 🟢
- Datei: `src/components/msv/MietlisteTable.tsx`
- Props: propertyId für Filterung
- DB statt DEMO_UNITS via useMSVData
- PaymentBookingDialog integriert → schreibt msv_rent_payments
- Expand-Panel mit echter Monatshistorie
- Premium-Lock für Automatisierung

### 1-6: Kachel 2 — AufgabenSection Mahnstufen 🟢
- Datei: `src/components/msv/AufgabenSection.tsx`
- Props: propertyId
- Säumige Fälle aus DB via useMSVData (Fälligkeit + Grace)
- Mahnstufen-Buttons erzeugen letter_drafts aus msv_templates
- Mieterhöhung: 36-Monate-Prüfung mit Draft-Erzeugung

### 1-7: Kachel 3 — BWAControllingSection DB-Persistenz 🟢
- Datei: `src/components/msv/BWAControllingSection.tsx`
- Props: propertyId
- Liest/schreibt msv_book_values + msv_bwa_entries
- AfA-Recalc, KI-Schätzung Bestätigung, Stichtag-Workflow

### 1-8: Template-Integration MOD-02 🟢
- TemplateWizard Platzhalter-Auto-Fill (in AufgabenSection integriert)
- Draft-Erzeugung in letter_drafts
- Disclaimer-Footer

### 1-9: Legacy Redirects aufräumen 🟢
- MSVPage.tsx bleibt als Redirect
- Alte Tab-Imports aus VerwaltungTab entfernt

---

## PHASE 2: MOD-18 Finanzanalyse (/portal/finanzanalyse/)

### 2-1: DB-Migration — Analyse-Tabellen 🟢
- analytics_budget_settings ✅
- analytics_category_overrides ✅
- analytics_notes ✅

### 2-2: Routing-Umbau 🟢
- routesManifest.ts Tiles aktualisiert:
  - dashboard → "Übersicht" ✅
  - reports → "Cashflow & Budget" ✅
  - szenarien → "Verträge & Fixkosten" ✅
  - settings → "Risiko & Absicherung" ✅

### 2-3: Hook useFinanzanalyseData 🟢
- Datei: `src/hooks/useFinanzanalyseData.ts` ✅
- Liest bank_transactions, analytics_budget_settings, analytics_category_overrides
- Aggregiert KPIs, Fixkosten, Top Merchants, Monatsflows

### 2-4: Seite A — Übersicht (DashboardTile) 🟢
- Health-Check, KPI-Row (6 Widgets), Insights Accordion, Top Merchants, Empty States ✅

### 2-5: Seite B — Cashflow & Budget (ReportsTile) 🟢
- Recharts 12M Timeline, Budget-Editor pro Kategorie, Abweichungs-Alerts, Kategorie-Explorer ✅

### 2-6: Seite C — Verträge & Fixkosten (SzenarienTile) 🟢
- Fixkosten Summary, Abo-Erkennung (Heuristik), Wiederkehrende Zahlungen, Duplikate-Check ✅

### 2-7: Seite D — Risiko & Absicherung (EinstellungenTile) 🟢
- Versicherungskostenquote, Coverage Snapshot (8 Typen), DRV-Stub, Investment-Stub ✅

---

## PHASE 3: Golden Path Demo-Angleichung (8 Prozesse) 🟢

**Audit-Ergebnis:** Alle 8 Prozesse sind bereits Golden Path Standard V1.0 konform.

| Prozess | Modul | Status | Befund |
|---------|-------|--------|--------|
| GP-SUCHMANDAT | MOD-08 | 🟢 | Demo-Widget Pos 0 ✅, WidgetGrid ✅, Inline-Navigation zu Detail ✅ |
| GP-SIMULATION | MOD-08 | 🟢 | Demo-Widget Pos 0 ✅, WidgetGrid ✅, Portfolio-Simulation inline ✅ |
| GP-SERIEN-EMAIL | MOD-14 | 🟢 | Demo-Widget Pos 0 ✅, WidgetGrid ✅, CampaignWizard inline ✅ |
| GP-FAHRZEUG | MOD-17 | 🟢 | Demo-Daten (6 Fahrzeuge) ✅, WidgetGrid ✅, Inline-Fahrzeugakte ✅ |
| GP-PV-ANLAGE | MOD-19 | 🟢 | Demo-Widget Pos 0 ✅, WidgetGrid ✅, CTA-Widget ✅ |
| GP-FM-FALL | MOD-11 | 🟢 | Demo-Widget Pos 0 ✅, WidgetGrid ✅, DASHBOARD_HEADER ✅ |
| GP-RECHERCHE | MOD-14 | 🟢 | Demo-Order inline ✅, WidgetGrid ✅, ResearchOrderInlineFlow ✅ |
| GP-PROJEKT | MOD-13 | 🟢 | Demo-Projekt (DEMO_PROJECT) ✅, WidgetGrid ✅, ProjectCard ✅ |

---

## Textvorlagen (Referenz)

### ZAHLUNGSERINNERUNG (Stufe 1)
```
Hallo {ANREDE} {NACHNAME},

ich hoffe, es geht Ihnen gut. Laut unserer Übersicht ist die Miete für {MONAT_JAHR} für die Einheit {UNIT_ID} ({ADRESSE_KURZ}) noch nicht als Zahlung eingegangen.

Offener Betrag: {OFFENER_BETRAG}
Fälligkeitsmonat: {MONAT_JAHR}

Bitte prüfen Sie dies kurz. Falls die Überweisung bereits erfolgt ist, können Sie diese Nachricht als gegenstandslos betrachten.

Wenn die Zahlung noch aussteht, bitten wir um Überweisung bis spätestens {FRISTDATUM}.

Zahlungsdaten:
Empfänger: {EMPFAENGER_NAME}
IBAN: {IBAN}
BIC: {BIC}
Verwendungszweck: {VERWENDUNGSZWECK}

Vielen Dank und freundliche Grüße
{ABSENDER_NAME}
{ABSENDER_FUNKTION}
{ABSENDER_KONTAKT}

Hinweis: Diese Nachricht wurde automatisiert aus unserer Mietübersicht erstellt. Bitte prüfen Sie die Angaben bei Unklarheiten.
```

### MAHNUNG (Stufe 2)
```
Sehr geehrte/r {ANREDE} {NACHNAME},

trotz unserer Zahlungserinnerung vom {DATUM_STUFE1} ist die Mietzahlung für {MONAT_JAHR} für die Einheit {UNIT_ID} ({ADRESSE_KURZ}) bislang nicht vollständig eingegangen.

Offener Betrag: {OFFENER_BETRAG}
Ursprüngliche Fälligkeit: {FAELLIGKEITSDATUM}

Wir bitten Sie, den offenen Betrag bis spätestens {FRISTDATUM} auszugleichen oder uns kurzfristig zu kontaktieren, falls es Rückfragen gibt.

Zahlungsdaten:
Empfänger: {EMPFAENGER_NAME}
IBAN: {IBAN}
BIC: {BIC}
Verwendungszweck: {VERWENDUNGSZWECK}

Mit freundlichen Grüßen
{ABSENDER_NAME}
{ABSENDER_FUNKTION}
{ABSENDER_KONTAKT}

Hinweis: Dieses Schreiben ist eine standardisierte Mahnvorlage. Bitte prüfen Sie die Inhalte vor Versand. Keine Rechtsberatung.
```

### LETZTE_MAHNUNG (Stufe 3)
```
Sehr geehrte/r {ANREDE} {NACHNAME},

leider ist die Mietzahlung für {MONAT_JAHR} für die Einheit {UNIT_ID} ({ADRESSE_KURZ}) weiterhin nicht vollständig eingegangen.

Offener Betrag: {OFFENER_BETRAG}
Bisherige Kontaktversuche:
- Zahlungserinnerung vom {DATUM_STUFE1}
- Mahnung vom {DATUM_STUFE2}

Wir setzen Ihnen hiermit eine letzte Frist zur Zahlung bis spätestens {FRISTDATUM}.
Bitte kontaktieren Sie uns umgehend, falls Sie Rückfragen haben oder eine Klärung erforderlich ist.

Zahlungsdaten:
Empfänger: {EMPFAENGER_NAME}
IBAN: {IBAN}
BIC: {BIC}
Verwendungszweck: {VERWENDUNGSZWECK}

Freundliche Grüße
{ABSENDER_NAME}
{ABSENDER_FUNKTION}
{ABSENDER_KONTAKT}

Hinweis: Dieses Schreiben ist eine standardisierte Vorlage. Bitte prüfen Sie die Angaben vor Versand. Keine Rechtsberatung.
```

### MIETERHOEHUNG
```
Hallo {ANREDE} {NACHNAME},

wir prüfen turnusmäßig die Mietkonditionen für die Einheit {UNIT_ID} ({ADRESSE_KURZ}).
Die letzte dokumentierte Anpassung liegt vom {DATUM_LETZTE_MIETERHOEHUNG}.

Wir möchten die monatliche Miete ab {WIRKSAM_AB} wie folgt anpassen:

Bisherige Miete: {MIETE_ALT}
Neue Miete: {MIETE_NEU}
Änderung: {DIFFERENZ}

Bitte geben Sie uns bis spätestens {FRISTDATUM} eine kurze Rückmeldung.
Wenn Sie Fragen haben oder eine Klärung wünschen, melden Sie sich gern – wir besprechen das unkompliziert.

Freundliche Grüße
{ABSENDER_NAME}
{ABSENDER_FUNKTION}
{ABSENDER_KONTAKT}

Hinweis: Dieses Schreiben ist eine standardisierte Vorlage. Bitte prüfen Sie die Angaben vor Versand. Keine Rechtsberatung.
```

### KONTAKT_RUECKFRAGE
```
Hallo {ANREDE} {NACHNAME},
kurze Rückfrage: Wir sehen aktuell noch keinen vollständigen Zahlungseingang für {MONAT_JAHR}. Können Sie kurz bestätigen, ob die Zahlung bereits veranlasst wurde?

Danke & viele Grüße
{ABSENDER_NAME}
```
