
# Kaufy: Finanzierung direkt aus dem Expose beantragen

## Konzept

Der Kunde befindet sich bereits im Kaufy-Immobilienexpose und hat ueber die Investment Engine sein Finanzierungskonzept entwickelt (Eigenkapital, Tilgung, Zinsbindung, monatliche Rate). Wenn er "Finanzierung beantragen" klickt, ist das Objekt bereits vollstaendig definiert — er muss nur noch seine Selbstauskunft ausfuellen.

```text
FLOW:
Kaufy Suche → Expose oeffnen → Investment Engine konfigurieren
  → "Finanzierung beantragen" klicken
  → Selbstauskunft ausfuellen (Objekt ist bereits gesetzt)
  → Live-Kapitaldienstfaehigkeits-Vorcheck sehen
  → "Finanzierung einreichen"
  → Bestaetigung + E-Mail mit Datenraum-Link kommt automatisch
```

## Was der Kunde NICHT eingeben muss

- Objekt-Typ, Adresse, Flaeche, Baujahr (kommt aus dem Listing)
- Kaufpreis, Eigenkapital, Darlehen, Zinssatz, Tilgung, Rate (kommt aus der Engine)
- Nebenkosten (berechnet die Engine)

## Was der Kunde eingeben muss (Selbstauskunft)

Drei kompakte Abschnitte, KEIN Zwischenschritt fuer Kontaktdaten — die Kontaktdaten sind Teil der Selbstauskunft:

**Abschnitt 1 — Persoenliche Daten:**
- Anrede, Vorname, Nachname
- Geburtsdatum, Geburtsort
- Adresse (Strasse, PLZ, Ort)
- Telefon, E-Mail
- Familienstand

**Abschnitt 2 — Beschaeftigung und Einkommen:**
- Beschaeftigungsart (Angestellt/Selbstaendig/Beamter)
- Arbeitgeber, beschaeftigt seit
- Nettoeinkommen monatlich
- Sonstige Einnahmen (Mieteinnahmen, Kindergeld etc.)

**Abschnitt 3 — Ausgaben und Vermoegen:**
- Aktuelle Kaltmiete (faellt bei Eigennutzung weg)
- Lebenshaltungskosten
- Sonstige Fixkosten (Leasing, Unterhalt)
- Vermoegen (Ersparnisse, Wertpapiere, LV)

## Live-Kapitaldienstfaehigkeits-Vorcheck

Waehrend der Kunde die Selbstauskunft ausfuellt, wird live die Kapitaldienstfaehigkeit berechnet — identische Logik wie in der bestehenden HouseholdCalculationCard:

- Einnahmen vs. Ausgaben + neue Darlehensrate
- Ampel-System: Gruen (tragfaehig), Gelb (knapp), Rot (nicht tragfaehig)
- Der Kunde sieht sofort, ob die Finanzierung realistisch ist

## Einreichung

- Nutzt die bestehende Edge Function `sot-futureroom-public-submit` mit `source: 'zone3_kaufy_expose'`
- Objektdaten und Engine-Ergebnisse werden automatisch aus dem Expose mitgegeben
- Selbstauskunft-Daten werden als `applicant_snapshot` gespeichert
- Anfrage landet in Zone 1 zur Triage

## Nach Einreichung

- Bestaetigung mit Public-ID (SOT-F-...)
- Hinweis: "Sie erhalten in Kuerze eine E-Mail mit einem Link zu Ihrem persoenlichen Datenraum, wo Sie Ihre Unterlagen hochladen koennen. Alternativ koennen Sie uns die Unterlagen auch per E-Mail zusenden."
- Kein Datenraum-Upload direkt auf der Website (fluechtig)

## Technische Umsetzung

### Datei 1 (NEU): `src/components/zone3/KaufyFinanceRequestSheet.tsx`

Ein Sheet (von rechts einfahrend, volle Hoehe), das die reduzierte Selbstauskunft enthaelt:

- **Props:**
  - `open: boolean`
  - `onClose: () => void`
  - `listing: ListingData` (Objekt-Stammdaten aus Expose)
  - `engineParams: { equity, interestRate, repaymentRate, monthlyRate, loanAmount, purchasePrice, transferTax, notaryCosts, totalCosts }`

- **Interner State:**
  - `formData` — reduzierte Version von `ApplicantFormData` (nur die relevanten Felder)
  - `currentSection` — 'personal' | 'income' | 'expenses'
  - `submitting`, `submitted`, `publicId`

- **Layout:**
  - Header: Kompakte Objekt-Zusammenfassung (1 Zeile: Typ, Adresse, Preis — read-only)
  - 3 Accordion-Sektionen fuer die Selbstauskunft
  - Rechts/unten: Live-KDF-Ampel (Kapitaldienstfaehigkeits-Vorcheck)
  - Footer: "Finanzierung einreichen" Button

- **Submit:** Ruft `sot-futureroom-public-submit` auf mit `source: 'zone3_kaufy_expose'` und mappt die Daten in das bestehende Schema (contact, object, request, calculation, household)

- **Nach Submit:** Bestaetigung mit Public-ID und Datenraum-Hinweis

### Datei 2 (EDIT): `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx`

- Import von `KaufyFinanceRequestSheet`
- Neuer State: `showFinanceRequest: boolean`
- CTA-Button im Sticky-Sidebar-Panel (unter InvestmentSliderPanel): "Finanzierung beantragen" in Teal/Primary
- Zweiter CTA-Button in der mobilen Ansicht (unter dem Content)
- Uebergibt `listing` und berechnete Engine-Parameter an das Sheet
- Engine-Parameter werden aus `params` und `calcResult` extrahiert

### Datei 3 (EDIT): `src/pages/zone3/futureroom/FutureRoomHome.tsx`

- Prozess-Schritte von 3 auf 4 erweitern:
  1. "Anfrage stellen" — Online-Formular ausfuellen (bestehend)
  2. "Vorpruefung erhalten" — Sofortige Kapitaldienstfaehigkeits-Einschaetzung
  3. "Unterlagen einreichen" — NEU: "Nach Ihrer Anfrage erhalten Sie per E-Mail einen Link zu Ihrem persoenlichen Datenraum. Dort laden Sie Ihre Unterlagen sicher und dauerhaft hoch — nicht fluechtig im Browser, sondern in Ihrem persoenlichen Finanzierungsordner. Alternativ koennen Sie uns die Unterlagen auch per E-Mail zusenden."
  4. "Finanzierung erhalten" — Bankfertige Aufbereitung und Einreichung (bestehend)

### Keine DB-Aenderungen

Die bestehende Edge Function `sot-futureroom-public-submit` und die Tabellen `finance_requests` / `finance_mandates` werden wiederverwendet. Das `source`-Feld unterscheidet die Herkunft (`zone3_kaufy_expose`). Die Selbstauskunft-Daten werden im bestehenden `applicant_snapshot` JSON-Feld gespeichert.
