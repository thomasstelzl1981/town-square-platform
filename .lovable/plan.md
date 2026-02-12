

# Dokumentenerfassung nach Magic Intake nach oben verschieben

## Idee

Nach Aktivierung von Magic Intake wird die **GenerateCaseCard** (Dokumentenerfassung/Datenraum) nicht mehr unten angezeigt, sondern rueckt direkt unter die Magic Intake / Kaufy-Zeile — also UEBER Eckdaten und Finanzierungskalkulator. So hat der Nutzer sofort Zugriff auf den Datenraum, ohne scrollen zu muessen.

## Umsetzung

### Datei: `FMFinanzierungsakte.tsx`

1. **Scroll-Logik entfernen**: Die `setTimeout`/`scrollIntoView`-Logik in `handleMagicIntakeCreated` (Zeilen 170-172) wird entfernt.

2. **Bedingte Positionierung der GenerateCaseCard**: Die GenerateCaseCard wird an zwei moeglichen Stellen gerendert — gesteuert durch `magicIntakeResult`:

   - **Wenn Magic Intake aktiviert**: GenerateCaseCard erscheint direkt nach der Magic Intake / Kaufy-Zeile (nach Zeile 235), also VOR den Eckdaten.
   - **Wenn NICHT aktiviert**: GenerateCaseCard bleibt an ihrer bisherigen Position ganz unten (nach der Haushaltsrechnung).

3. **Konkret**: Der bestehende `<div ref={generateCaseRef}>...</div>`-Block (Zeilen 369-391) wird in eine bedingte Logik verpackt:

```text
Layout-Reihenfolge nach Magic Intake:

+----------------------------------+
| Magic Intake  |  Objekte Kaufy   |
+----------------------------------+
| GenerateCaseCard (Datenraum)     |  <-- NEU: hier wenn aktiviert
+----------------------------------+
| Eckdaten      |  Kalkulator      |
+----------------------------------+
| ... restliche Karten ...         |
+----------------------------------+
```

### Aenderungen im Detail

| Was | Wo | Aenderung |
|---|---|---|
| Scroll-Logik entfernen | `handleMagicIntakeCreated` | `setTimeout`-Block loeschen |
| GenerateCaseCard oben rendern | Nach Zeile 235 | Bedingtes Rendering wenn `magicIntakeResult` vorhanden |
| GenerateCaseCard unten ausblenden | Zeilen 369-391 | Nur rendern wenn `magicIntakeResult` NICHT vorhanden |

### Keine weiteren Aenderungen

- Keine Datenbank-Aenderungen
- Keine neuen Dateien
- Nur eine Datei betroffen: `FMFinanzierungsakte.tsx`
