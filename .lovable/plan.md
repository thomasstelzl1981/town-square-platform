
# Erweiterung: E-Mail-Vorschau, Empfaenger speichern, Schalter fuer Reservierungen

## 1. E-Mail-Vorschau-Dialog

**Datei:** `src/components/projekte/SalesStatusReportWidget.tsx`

Beim Klick auf "Report senden" oeffnet sich ein Dialog (aus `@/components/ui/dialog`) mit:

- **An:** Liste der Empfaenger
- **Betreff:** "Vertriebsstatusreport — [Projektname] — [Datum]"
- **Anschreiben-Vorschau:** Das vorgefertigte Anschreiben als gerenderter Text
- **Buttons:** "Abbrechen" und "Jetzt senden"

Erst "Jetzt senden" ruft die Edge Function auf.

### Technisch

- Neuer State: `showSendDialog: boolean`
- `handleSendReport` setzt nur `showSendDialog = true` (nach Empfaenger-Validierung)
- Neue Funktion `handleConfirmSend()` fuehrt den eigentlichen Versand durch und schliesst den Dialog

---

## 2. Empfaenger-Adressen speichern

Aktuell gehen hinzugefuegte E-Mail-Adressen bei Seitenwechsel verloren, da sie nur im lokalen State liegen.

### Loesung: localStorage-Persistenz

- Beim Laden der Komponente: `recipients` aus `localStorage.getItem('sot-report-recipients-{projectName}')` lesen
- Bei jeder Aenderung (hinzufuegen/entfernen): `localStorage.setItem(...)` aktualisieren
- Neuer **"Speichern"-Button** neben dem Empfaenger-Bereich ist damit nicht noetig — das Speichern passiert automatisch
- Alternativ, falls ein expliziter Button gewuenscht ist: Ein kleiner "Speichern"-Button neben der Empfaenger-Liste, der in localStorage schreibt und `toast.success('Empfänger gespeichert')` zeigt

### Umsetzung

- `useEffect` beim Mount: localStorage lesen und `setRecipients` setzen
- `addRecipient` und `removeRecipient` schreiben zusaetzlich in localStorage
- Key-Format: `sot-report-recipients-${projectName}`

---

## 3. Fehlender Switch bei "Reservierungen automatisch bestaetigen"

Der Switch ist im Code vorhanden (Zeile 278-284), aber es gibt ein UI-Problem: Alle drei Automatisierungs-Eintraege nutzen dasselbe Layout. Der "Reservierungen automatisch bestaetigen"-Eintrag hat aktuell `defaultChecked: false`, der Switch ist also da, aber moeglicherweise visuell schwer erkennbar.

### Loesung: Visuell hervorheben

- Den Eintrag "Reservierungen automatisch bestaetigen" aus dem generischen Array herausnehmen
- Eigenes Layout mit deutlicherem Styling: leicht farbiger Hintergrund (`bg-amber-50 dark:bg-amber-950/20`), Rahmen, und Icon (z.B. `ShieldCheck`)
- Damit wird der Switch klar als eigener Schalter sichtbar, nicht nur als Zeile in der Liste

---

## 4. Zusammenfassung der Aenderungen

| Nr | Was | Datei |
|----|-----|-------|
| 1 | E-Mail-Vorschau-Dialog mit "Jetzt senden" | `SalesStatusReportWidget.tsx` |
| 2 | Empfaenger in localStorage persistieren | `SalesStatusReportWidget.tsx` |
| 3 | "Reservierungen bestaetigen" als eigener hervorgehobener Schalter | `SalesStatusReportWidget.tsx` |

Nur eine Datei betroffen. Keine neuen Abhaengigkeiten, keine DB-Aenderungen.
