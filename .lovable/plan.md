
# Designanpassungen: Kunden-Eingabe in Kachel 2 + Bereinigung

## Was sich aendert

### 1. Kunden-Zeile entfernen (Zeilen 508-525)
Die separate Eingabezeile "Kunde / Mandant" mit dem Kontaktbuch-Button oberhalb der Kacheln wird komplett entfernt. Sie sieht nicht gut aus und passt nicht ins CI.

### 2. Separators (Trennstriche) entfernen (Zeilen 508, 690)
Die `<Separator />`-Elemente zwischen den Sektionen werden entfernt — sie sind nicht im CI verankert.

### 3. Mandanten-Eingabefeld in Kachel 2 (Ankaufsprofil)
In der Kachel "Ankaufsprofil" (oben rechts) wird ein grosses Textarea-Eingabefeld eingefuegt — gleiche Groesse wie das Freitext-Feld in Kachel 1 (6 Zeilen). Dort kann der User im Freitext den Mandanten beschreiben (Name, Firma, Daten) oder ueber einen kleinen Button "Kontaktbuch" einen bestehenden Kontakt suchen und uebernehmen.

Dieses Feld ist **immer sichtbar** (auch vor der KI-Generierung) und ersetzt die bisherige Kunden-Zeile. Es dient als primaere Mandanten-Erfassung.

### 4. Layout-Anpassung Kachel 2
Die Kachel 2 zeigt nun immer:
- Oben: Mandanten-Textarea (6 Zeilen) + Kontaktbuch-Button
- Darunter: Entweder Platzhalter (vor KI-Generierung) oder die strukturierten Profildaten + editierbare Zusammenfassung + "Ankaufsprofil uebernehmen" Button

## Technische Details

### Datei: `src/pages/portal/akquise-manager/AkquiseMandate.tsx`

| Bereich | Aenderung |
|---------|-----------|
| Zeilen 508 | `<Separator />` entfernen |
| Zeilen 510-525 | Kunden-Zeile komplett entfernen |
| Zeile 690 | `<Separator />` entfernen |
| Zeilen 593-639 (Kachel 2) | Mandanten-Textarea (rows=6) mit Kontaktbuch-Button oben einfuegen, `clientName` State wird weiterhin genutzt |

Der `clientName` State wird jetzt aus dem Textarea befuellt. Der Kontaktbuch-Button (`BookOpen`-Icon) bleibt funktional und oeffnet den bestehenden `ContactBookDialog`.
