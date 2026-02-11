

# ScopeDefinitionPanel — Layout und Flow korrigieren

## Problem

Die aktuelle Reihenfolge der Elemente ist unlogisch:

1. **Oben**: "Ihre Beschreibung" — nur lesbar, nicht editierbar
2. **Mitte**: DMS-Optionen (collapsible), dann Leistungsverzeichnis
3. **Darunter**: Kostenschaetzung
4. **Ganz unten**: Freitext-Beschreibung fuer Ausschreibung (editierbar)

Der Nutzer kann oben nichts eingeben, die editierbare Beschreibung ist ganz unten versteckt, und die Kostenschaetzung steht vor der Ausschreibungsbeschreibung.

## Neuer Flow (logische Reihenfolge)

```text
1. Freitext-Eingabe (editierbar)     ← "Was moechten Sie sanieren?"
   [Leistungsverzeichnis generieren]
   
2. KI-generierte Beschreibung       ← Professionelle Ausschreibungsbeschreibung
   (editierbar, wird von KI befuellt)

3. Leistungsverzeichnis              ← Positionen-Tabelle (KI-generiert, editierbar)

4. Kostenschaetzung                  ← KI-gestuetzt, ganz unten
   [Kostenschaetzung anfordern]

5. Weitere Optionen (DMS/Upload)     ← Collapsible, sekundaer

6. Aktions-Leiste                    ← Speichern / Weiter
```

## Technische Aenderungen (1 Datei)

**`src/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel.tsx`**

### Block 1: Freitext-Eingabe (NEU — editierbar)
- Die bisherige "Ihre Beschreibung"-Karte wird durch ein editierbares Textarea ersetzt
- Vorausgefuellt mit `serviceCase.description`
- Neuer lokaler State `userDescription` (initialisiert aus `serviceCase.description`)
- Der "Leistungsverzeichnis generieren"-Button nutzt diesen editierbaren Text
- Diktierfunktion (Mikrofon-Button) daneben
- Ueberschrift: "Was soll saniert werden?"

### Block 2: Ausschreibungsbeschreibung (nach oben verschoben)
- Das bisherige Textarea "Freitext-Beschreibung fuer Ausschreibung" wandert von ganz unten direkt unter den Generieren-Button
- Wird von der KI befuellt, ist aber editierbar
- Ueberschrift: "Beschreibung fuer Ausschreibung"
- "Aus LV generieren"-Button bleibt

### Block 3: Leistungsverzeichnis (bleibt)
- Position bleibt gleich (nach der Beschreibung)
- Keine inhaltlichen Aenderungen

### Block 4: Kostenschaetzung (bleibt unten)
- Wird nach dem LV angezeigt — passt schon

### Block 5: Weitere Optionen (bleibt collapsible, nach unten)
- DMS-Dokumente und Upload-Bereich bleiben als Collapsible
- Werden nach der Kostenschaetzung angezeigt (ganz unten vor den Aktions-Buttons)

### Zusammenfassung der Verschiebungen

| Element | Vorher | Nachher |
|---|---|---|
| Freitext-Eingabe (editierbar) | -- (nur lesbar oben) | Position 1 |
| Generieren-Button | Bei "Ihre Beschreibung" | Bei Freitext-Eingabe |
| Ausschreibungsbeschreibung | Position 5 (ganz unten) | Position 2 |
| Leistungsverzeichnis | Position 3 | Position 3 (bleibt) |
| Kostenschaetzung | Position 4 | Position 4 (bleibt) |
| DMS/Upload (collapsible) | Position 2 | Position 5 (nach unten) |

Keine neuen Dateien, keine DB-Aenderungen, keine neuen Dependencies.

