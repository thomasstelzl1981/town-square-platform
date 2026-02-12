

# Einreichung: 4 eigenstaendige Kacheln

## Neue Struktur

```text
+----------------------------------------------+
| Fallauswahl (Case Widget Cards)              |
+----------------------------------------------+
| Kachel 1: Finanzierungs-Expose               |
|   (bleibt wie bisher)                         |
+----------------------------------------------+
| Kachel 2: Bankauswahl & E-Mail-Einreichung   |
|   - Oben: Bankauswahl (max. 4 Banken)        |
|     - Zone-1-Kontaktbuch (Combobox)           |
|     - KI-Vorschlaege (Platzhalter)            |
|     - Manuelle Eingabe (Name + E-Mail)        |
|   - Unten: E-Mail-Client (sofort sichtbar)    |
|     - Pro ausgewaehlter Bank ein Entwurf      |
|     - Vorausgefuellter Beispieltext           |
|     - Anhaenge-Badges                         |
+----------------------------------------------+
| Kachel 3: Status & Ergebnis                  |
|   (eigene Kachel, bleibt funktional gleich)   |
+----------------------------------------------+
| Kachel 4: API-Uebergabe (Europace)           |
|   (eigene Kachel, herausgeloest aus Kachel 2) |
+----------------------------------------------+
```

## Aenderungen im Detail

### 1. Stepper entfernen

Der bisherige 4-Step-Workflow-Stepper (`STEPS`-Array + `WorkflowStepper`-Komponente) wird entfernt, da die Kacheln jetzt eigenstaendig nebeneinander stehen und kein linearer Ablauf mehr suggeriert wird.

### 2. Kachel 1: Expose (keine Aenderung)

Bleibt exakt wie bisher.

### 3. Kachel 2: Bankauswahl + E-Mail (zusammengefuehrt)

Eine Kachel mit zwei Bereichen, getrennt durch einen Separator:

**Oberer Bereich — Bankauswahl:**
- Drei Quellen fuer Banken: Zone-1-Kontaktbuch (bestehender Hook `useFinanceBankContacts`), KI-Vorschlaege (Platzhalter-UI mit Badge "Coming soon"), manuelle Eingabe (Name + E-Mail + Button)
- Limit auf maximal 4 Banken (statt bisher 3)
- Ausgewaehlte Banken als Chips mit Entfernen-Button

**Unterer Bereich — E-Mail-Client (immer sichtbar):**
- Ohne Banken: Generischer Entwurf mit Platzhaltern als Vorschau
- Mit Banken: Pro Bank ein editierbarer E-Mail-Entwurf (An, Betreff, Body)
- Vorausgefuellter Beispieltext mit Eckdaten des Falls
- Anhaenge-Badges (Finanzierungsakte.pdf, Datenraum-Link)
- "Alle senden"-Button

### 4. Kachel 3: Status & Ergebnis (eigene Kachel)

Wird aus dem bisherigen Step 4 herausgeloest. Funktional identisch: Tabelle mit Einreichungs-Logs, Status-Dropdown, Bank-Auswahl und Archiv-Button. Steht jetzt als eigenstaendige Kachel.

### 5. Kachel 4: Europace API-Uebergabe (eigene Kachel)

Die bisherige "Externe Software"-Sektion wird aus Kachel 2 herausgeloest und als letzte eigenstaendige Kachel gerendert. Titel: "API-Uebergabe (Europace)". Inhalt: Software-Name-Feld + Uebergabe-Button.

## Betroffene Datei

| Datei | Aenderung |
|---|---|
| `FMEinreichung.tsx` | Stepper entfernen, Kachel 2 komplett neu (Bank + E-Mail kombiniert), Europace in eigene Kachel 4, Bank-Limit auf 4 erhoehen |

## Keine Datenbank-Aenderungen

Reine Frontend-Umstrukturierung. Alle Hooks und Tabellen existieren bereits.

