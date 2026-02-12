

# Strukturelle Anpassungen: Selbstauskunft, Kapitaldienstfaehigkeit und Rente

## 1. Selbstauskunft-Kachel aufteilen

**Aktuell**: Eine grosse Kachel mit allen Sections (Person, Beschaeftigung, Bankverbindung, Einnahmen, Ausgaben, Vermoegen).

**Neu**: Zwei separate Kacheln:

```text
+--- Kachel 1: Selbstauskunft ------------------------------------------------+
| [User] Selbstauskunft                                                        |
| Persoenliche Daten, Beschaeftigung und Bankverbindung der Antragsteller      |
+--- DualHeader: Feld | 1. Antragsteller | 2. Antragsteller ------------------+
| PersonSection                                                                |
| EmploymentSection (ohne eigenen DualHeader)                                  |
| BankSection (ohne eigenen DualHeader)                                        |
+------------------------------------------------------------------------------+

+--- Kachel 2: Einnahmen, Ausgaben & Vermoegen --------------------------------+
| [Banknote] Einnahmen, Ausgaben & Vermoegen                                    |
| Monatliche Einnahmen/Ausgaben und Vermoegenswerte der Antragsteller           |
+--- DualHeader: Feld | 1. Antragsteller | 2. Antragsteller -------------------+
| IncomeSection (ohne eigenen DualHeader)                                       |
| ExpensesSection (ohne eigenen DualHeader)                                     |
|  --- Unterueberschrift: "Vermoegen und Verbindlichkeiten" ---                 |
| AssetsSection (ohne eigenen DualHeader)                                       |
+-------------------------------------------------------------------------------+
```

## 2. Doppelte "1. Antragsteller / 2. Antragsteller"-Header entfernen

Jede Section (IncomeSection, ExpensesSection, AssetsSection, EmploymentSection, BankSection) rendert aktuell ihren eigenen `DualHeader`. Dieser wird nur einmal ganz oben pro Kachel gebraucht.

**Loesung**: Allen Sections eine neue optionale Prop `hideHeader?: boolean` geben. In `FMFinanzierungsakte.tsx` wird `hideHeader={true}` an alle Sections uebergeben ausser der jeweils ersten pro Kachel. Alternativ (einfacher): Den DualHeader direkt in der Kachel rendern und allen Sections `hideHeader` uebergeben.

## 3. "Rente" umbenennen in "Altersrente"

In `EmploymentSection` (Zeile 486): `SectionHeaderRow title="Rente"` aendern zu `title="Altersrente"`.

## 4. Kapitaldienstfaehigkeit: Bessere Ergebnisdarstellung + Armstrong-Integration

Der Ergebnisblock wird erweitert:

```text
+--- Ergebnis (nach Berechnung) -----------------------------------------------+
| Verfuegbares Einkommen:  +2.450,00 EUR (gruen/rot)                           |
| Kapitaldienstfaehigkeit: [CheckCircle] Tragfaehig                            |
+--- KI-Bewertung (blau, nach Berechnung sichtbar) ----------------------------+
| "Nach aktuellem Stand erscheint die Finanzierung vorstellbar. Die            |
|  Kapitaldienstfaehigkeit ist mit einem Ueberschuss von 2.450 EUR             |
|  gegeben. Empfehlung: Unterlagen vollstaendig einreichen."                   |
|                                                [Armstrong oeffnen]           |
+------------------------------------------------------------------------------+
```

**Ablauf**: Beim Klick auf "Berechnen" wird:
1. Die Berechnung ausgefuehrt (wie bisher)
2. Ein kurzer KI-Bewertungstext generiert (ueber Armstrong/Lovable AI)
3. Ein "Armstrong oeffnen"-Button angezeigt, der das Armstrong-Sheet oeffnet mit dem Kontext der Finanzierungsakte

Die KI-Bewertung wird als statischer Textblock dargestellt (kein Chat), mit einer Ampel-Logik:
- Gruen: "Nach jetzigem Stand erscheint die Finanzierung vorstellbar."
- Gelb: "Die Finanzierung ist grenzwertig. Bitte pruefen Sie..."
- Rot: "Die Kapitaldienstfaehigkeit ist nicht gegeben."

**Einfachere Alternative (empfohlen fuer Phase 1)**: Statt KI-Aufruf zunachst eine regelbasierte Textgenerierung basierend auf den berechneten Werten (Ueberschuss-Quote, fehlende Felder). Der "Armstrong oeffnen"-Button kann trotzdem integriert werden, damit der Manager bei Rueckfragen direkt Armstrong konsultieren kann.

## 5. Floating Save Button: Abstand zum Ergebnis

Der Button `fixed bottom-6 right-6` ueberlappt die Kapitaldienstfaehigkeit. Loesung: Am Ende der Seite einen unsichtbaren Spacer (`h-20`) einfuegen, damit der Content nicht verdeckt wird.

## 6. Hochgeladene PDF: Immobilienaufstellung

Das Dokument zeigt ein Standard-Bankformular fuer die Immobilienaufstellung (Bestandsimmobilien mit Verbindlichkeiten). Dies koennte spaeter als eigene Section in der Selbstauskunft oder als separater Tab integriert werden. Fuer diese Iteration wird es notiert aber nicht implementiert.

---

## Technische Umsetzung

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `ApplicantPersonFields.tsx` | `hideHeader`-Prop an alle Sections; "Rente" zu "Altersrente" umbenennen |
| `FMFinanzierungsakte.tsx` | Selbstauskunft in 2 Kacheln aufteilen; DualHeader nur 1x pro Kachel; Spacer unten einfuegen |
| `HouseholdCalculationCard.tsx` | Ergebnis-Block erweitern mit regelbasierter Bewertung und Armstrong-Button |

### Aenderungen im Detail

**`ApplicantPersonFields.tsx`**:
- Alle exportierten Sections (`PersonSection`, `EmploymentSection`, `BankSection`, `IncomeSection`, `ExpensesSection`, `AssetsSection`) erhalten `hideHeader?: boolean` in ihren Props
- Wenn `hideHeader={true}`, wird der interne `{isDual && <DualHeader />}` uebersprungen
- Zeile 486: `"Rente"` wird zu `"Altersrente"`

**`FMFinanzierungsakte.tsx`**:
- Block 2 (Zeilen 250-268) wird in zwei Cards aufgeteilt:
  - Kachel 1: Gemeinsamer DualHeader + PersonSection + EmploymentSection + BankSection (alle mit `hideHeader`)
  - Kachel 2: Eigener Titel "Einnahmen, Ausgaben & Vermoegen" + DualHeader + IncomeSection + ExpensesSection + SectionHeaderRow "Vermoegen und Verbindlichkeiten" + AssetsSection (alle mit `hideHeader`)
- Am Seitenende: `<div className="h-20" />` als Spacer vor dem Floating Button

**`HouseholdCalculationCard.tsx`**:
- Ergebnis-Block (Zeilen 291-318) wird erweitert um eine regelbasierte Bewertungsbox:
  - Gruener/gelber/roter Hinweistext basierend auf `disposable` und Ueberschuss-Quote
  - Pruefung auf fehlende Felder (alle Nullen = "Bitte zuerst Daten erfassen")
  - "Armstrong oeffnen"-Button (ruft `onOpenArmstrong` Callback auf)
- Neue Prop: `onOpenArmstrong?: () => void`

