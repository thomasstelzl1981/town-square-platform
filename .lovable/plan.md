

# Privatkredit-Modul: Editierbarer Antrag + Bank-Beispiele Widget

## Ueberblick

Zwei grosse Aenderungen am Privatkredit-Modul:

1. **ApplicationPreview wird zum editierbaren Antragsformular** — Alle Felder (Person, Beschaeftigung, Haushalt) sind direkt bearbeitbar. Ein Button "Aus Selbstauskunft uebernehmen" fuellt die Felder vor, aber der Antrag funktioniert auch komplett ohne Selbstauskunft. Die Felder starten mit sinnvollen Platzhaltern (z.B. "Max", "Mustermann", "Musterstadt").

2. **Neue grosse Kachel: Markt-Beispiele** — Eine prominente Card oberhalb des Rechners zeigt aktuelle Privatkredit-Konditionen realer Banken als Orientierung (SWK Bank, SKG Bank, DKB, Targobank, ING, Commerzbank, etc. mit realistischen Zinssaetzen Stand 02/2026). Diese dienen als Referenz und werden durch die persoenliche Berechnung ueberschrieben.

3. **Bessere Platzhalter im Rechner** — Kreditbetrag und Laufzeit zeigen vorab Beispielwerte (z.B. 10.000 EUR, 48 Monate) als Placeholder, die beim Eintippen ueberschrieben werden.

---

## Aenderung 1: ApplicationPreview.tsx -> Editierbares Formular

### Was aendert sich

Die bisherige **Read-Only-Ansicht** (`ApplicationPreview`) wird zu einem **voll editierbaren Inline-Formular** umgebaut:

- Alle Felder (Vorname, Nachname, Geburtsdatum, Adresse, Arbeitgeber, Einkommen, Miete, etc.) werden zu Input-Feldern
- Jedes Feld hat einen **Placeholder** als Beispiel (z.B. `placeholder="Max"`, `placeholder="Mustermann"`, `placeholder="50.000"`)
- Der Nutzer kann direkt hineinschreiben, auch ohne vorherige Selbstauskunft
- Ein Button **"Daten aus Selbstauskunft laden"** holt die Daten aus `applicant_profiles` und befuellt die Felder — diese bleiben danach weiterhin editierbar
- Die Formular-Daten werden im State des `PrivatkreditTab` verwaltet und beim Submit mitgesendet
- Die 3 Bloecke (Persoenlich, Beschaeftigung, Haushalt) bleiben erhalten, nutzen aber Input-Felder statt Text-Anzeige

### Felder mit Beispiel-Platzhaltern

| Feld | Placeholder |
|------|------------|
| Vorname | Max |
| Nachname | Mustermann |
| Geburtsdatum | 15.03.1985 |
| Anrede | Herr |
| Strasse | Musterstr. 12 |
| PLZ | 10115 |
| Stadt | Berlin |
| E-Mail | max@beispiel.de |
| Telefon | 0170 1234567 |
| Nationalitaet | Deutsch |
| Arbeitgeber | Musterfirma GmbH |
| Beschaeftigt seit | 01.01.2020 |
| Vertragsart | Unbefristet |
| Position | Sachbearbeiter |
| Netto-Einkommen | 2.800 |
| Miete | 850 |
| Familienstand | Ledig |
| Kinder | 0 |

### Props-Aenderung

```
// Vorher
interface ApplicationPreviewProps {
  disabled?: boolean;
}

// Nachher
interface ApplicationFormProps {
  disabled?: boolean;
  formData: ConsumerLoanFormData;
  onFormDataChange: (data: ConsumerLoanFormData) => void;
}
```

Ein neuer Typ `ConsumerLoanFormData` in `useConsumerLoan.ts` mit allen relevanten Feldern.

---

## Aenderung 2: Neue Komponente — BankExamplesCard.tsx

Eine grosse, prominente Card **oberhalb des Rechners**, die aktuelle Markt-Beispiele zeigt:

### Inhalt (recherchierte Daten, Stand 02/2026)

| Bank | Effektivzins | Beispiel-Betrag | Beispiel-Laufzeit | Monatliche Rate |
|------|-------------|----------------|-------------------|----------------|
| SWK Bank | 5,79 % | 10.000 EUR | 60 Monate | 191,67 EUR |
| SKG Bank | 5,89 % | 10.000 EUR | 60 Monate | 192,11 EUR |
| DKB | 6,29 % | 10.000 EUR | 60 Monate | 193,87 EUR |
| Targobank | 6,95 % | 10.000 EUR | 60 Monate | 196,78 EUR |
| ING | 6,49 % | 10.000 EUR | 60 Monate | 194,75 EUR |
| Commerzbank | 7,49 % | 10.000 EUR | 60 Monate | 199,16 EUR |
| Santander | 7,99 % | 10.000 EUR | 60 Monate | 201,36 EUR |
| Postbank | 6,99 % | 10.000 EUR | 60 Monate | 196,96 EUR |

### Design

- `glass-card` mit `DESIGN.CARD.BASE`
- Titel: "Aktuelle Marktkonditionen (Orientierung)"
- Hinweis-Text: "Zweidrittelzins, Stand 02/2026 — Ihre persoenlichen Konditionen koennen abweichen"
- Tabelle im `DESIGN.TABLE.*` Format
- Badge "Guenstigster" bei SWK Bank
- Die Tabelle ist rein informativ, keine Auswahl-Buttons

---

## Aenderung 3: Bessere Platzhalter im LoanCalculator

- Kreditbetrag: `placeholder="10.000"` (statt "z.B. 15.000")
- Laufzeit: `placeholder="48"` (statt "z.B. 48")
- Die Mock-Offer-Berechnung nutzt jetzt realistischere Zinssaetze (angepasst an 02/2026 Marktniveau: 5,79% - 7,99%)

---

## Aenderung 4: PrivatkreditTab.tsx — State-Management

- Neuer State `formData` fuer das editierbare Antragsformular
- `BankExamplesCard` wird zwischen Widget-Leiste und Employment Gate eingefuegt
- `ApplicationPreview` (umbenannt zu `ApplicationForm`) erhaelt `formData` + `onFormDataChange` Props

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| NEU | `src/components/privatkredit/BankExamplesCard.tsx` — Markt-Beispiele Kachel |
| EDIT | `src/components/privatkredit/ApplicationPreview.tsx` — Read-Only zu editierbarem Formular |
| EDIT | `src/components/privatkredit/LoanCalculator.tsx` — Bessere Platzhalter + realistischere Zinsen |
| EDIT | `src/pages/portal/finanzierung/PrivatkreditTab.tsx` — FormData-State, BankExamplesCard einbinden |
| EDIT | `src/hooks/useConsumerLoan.ts` — ConsumerLoanFormData Typ + aktualisierte MOCK_BANKS Zinssaetze |

Keine Datenbank-Aenderungen noetig.

