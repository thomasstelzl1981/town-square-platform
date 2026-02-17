


## Pet Manager -- Scroll-Fix + Excel-Kalender fuer Pension

### Aufgabe 1: Scroll-Fix Mitarbeiter (PMPersonal.tsx)

Die Akte-Spalte rechts bekommt `md:max-h-[calc(100vh-220px)] md:overflow-y-auto`, damit sie unabhaengig scrollbar ist.

### Aufgabe 2: Excel-Belegungskalender (PMPension.tsx)

Kompletter Umbau des Kalender-Bereichs zu einem Excel-artigen Grid:

```text
┌──────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─── ...
│              │17.02 │18.02 │19.02 │20.02 │21.02 │22.02 │23.02 │
├──────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼─── ...
│ Zimmer 1     │      │      │      │      │      │      │      │
│ (Kap. 1)     │ Slot │      │      │      │      │      │      │
├──────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼─── ...
│ Zimmer 2     │ Slot │      │      │      │      │      │      │
│ (Kap. 2)     │ Slot │      │      │      │      │      │      │
├──────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼─── ...
│ Zimmer 4     │ Slot │      │      │      │      │      │      │
│ (Kap. 3)     │ Slot │      │      │      │      │      │      │
│              │ Slot │      │      │      │      │      │      │
└──────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴─── ...
                ◄──────── horizontal endlos scrollbar ────────►
```

### Kalender-Details

- **Sichtbare Tage:** 14 Tage ab `currentDate`, horizontal scrollbar per CSS `overflow-x-auto`
- **Zeitraum:** Mindestens 1 Jahr in die Zukunft navigierbar (kein kuenstliches Limit). Zurueck bis zum Erstellungsdatum.
- **Zimmer-Spalte:** `position: sticky; left: 0` damit sie beim Scrollen sichtbar bleibt
- **Sub-Zeilen:** Jedes Zimmer erzeugt `capacity` Zeilen. Erste Zeile zeigt Zimmernamen per `rowSpan`
- **Navigation:** Pfeil-Buttons verschieben `currentDate` um 7 Tage, "Heute"-Button springt zurueck
- **Dynamisch:** Kalender-Zeilen werden direkt aus `pensionRooms` generiert
- **Zimmerakte:** Oeffnet sich als Overlay-Card ueber dem Kalender
- **Manuelle Bearbeitung:** Jede Zelle ist direkt klickbar/editierbar (Buchung eintragen, aendern, loeschen). Aenderungen werden ueber einen **schwebenden Speichern-Button** (`position: fixed`, unten rechts) gesammelt und erst bei Klick persistiert. Button erscheint nur bei ungespeicherten Aenderungen (dirty state).

### Technische Umsetzung

| Datei | Aenderung |
|-------|-----------|
| `PMPersonal.tsx` | overflow-y-auto + max-h auf Akte-Spalte |
| `PMPension.tsx` | Kalender-Umbau: Excel-Grid mit sticky Spalte, Sub-Zeilen, horizontalem Scroll, schwebendem Speichern-Button |
