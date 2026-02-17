
## Service-Kalender Umbau: Individuelle 30-Minuten-Slot-Zeilen pro Mitarbeiter

### Skizze der neuen Seite

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Services - Terminkalender und Dienstleistungen          [👤 Mitarbeiter] [+]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ◀  01. Mar – 30. Mai 2026  ▶  [Heute]                                        │
│                                                                                 │
│  ┌────────────────┬──────────┬──────────┬──────────┬──────────┬─────── ...      │
│  │ Mitarbeiter    │ Mo 01.03 │ Di 02.03 │ Mi 03.03 │ Do 04.03 │                │
│  ├────────────────┼──────────┼──────────┼──────────┼──────────┼─────── ...      │
│  │ ▼ Anna Meier   │          │          │          │ URLAUB   │                │
│  │   08:00        │          │ ████████ │          │ ░░░░░░░░ │                │
│  │   08:30        │          │ ████████ │          │ ░░░░░░░░ │                │
│  │   09:00        │ ████████ │          │          │ ░░░░░░░░ │                │
│  │   09:30        │ ████████ │          │          │ ░░░░░░░░ │                │
│  │   10:00        │          │          │ ████████ │ ░░░░░░░░ │                │
│  │   10:30        │          │          │ ████████ │ ░░░░░░░░ │                │
│  │   ...          │          │          │          │ ░░░░░░░░ │                │
│  │   16:00        │          │          │          │ ░░░░░░░░ │                │
│  ├────────────────┼──────────┼──────────┼──────────┼──────────┤                │
│  │ ▼ Tom Schmidt  │          │          │  Frei    │          │                │
│  │   09:00        │ ████████ │          │ ░░░░░░░░ │          │                │
│  │   09:30        │          │          │ ░░░░░░░░ │          │                │
│  │   10:00        │          │ ████████ │ ░░░░░░░░ │ ████████ │                │
│  │   ...          │          │          │ ░░░░░░░░ │          │                │
│  │   13:00        │          │          │ ░░░░░░░░ │          │                │
│  └────────────────┴──────────┴──────────┴──────────┴──────────┘                │
│                                                                                 │
│  Legende: ████ = gebucht   ░░░░ = frei/Urlaub (ausgegraut)                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Erklaerung:** Jeder Mitarbeiter wird als Gruppe dargestellt. Die erste Zeile zeigt den Namen (klappbar), darunter folgen die individuellen 30-Minuten-Slots basierend auf seinen Arbeitszeiten. Anna arbeitet z.B. 08:00-16:30 = 17 Zeilen. Tom arbeitet 09:00-13:30 = 9 Zeilen. An freien Tagen und Urlaubstagen ist die gesamte Spalte grau.

Gebuchte Slots zeigen einen farbigen Balken mit Hundename/Service. Klick auf leeren Slot oeffnet den Buchungs-Dialog vorausgefuellt mit Mitarbeiter, Datum und Uhrzeit.

### Implementierungsplan

**Datei: `src/pages/portal/petmanager/PMServices.tsx`** (kompletter Umbau der Tabelle)

1. **Zeilen-Struktur aendern**: Statt einer Zeile pro Mitarbeiter wird jeder Mitarbeiter zu einer Gruppe mit:
   - Header-Zeile: Mitarbeitername (sticky left, klappbar via State)
   - Sub-Zeilen: Eine Zeile pro 30-Min-Slot (z.B. 08:00, 08:30, 09:00...)
   - Slot-Zeilen werden aus `work_hours` des Mitarbeiters berechnet via `generateSlots()`

2. **Zellen-Logik pro Slot-Zeile + Tag**:
   - Arbeitstag mit Work-Hours: Slot ist verfuegbar (weiss/klickbar) oder gebucht (farbig)
   - Freier Tag (kein work_hours-Eintrag): Zelle grau mit "Frei"
   - Urlaubstag: Zelle grau mit "Urlaub"
   - Gebuchte Zelle: Farbiger Hintergrund + Hundename/Service-Text

3. **Zeilenhoehe anpassen**: `CELL_HEIGHT` von 80px auf **28px** (kompakte Slot-Zeilen)

4. **Buchungs-Dialog**: Beim Klick auf leere Zelle wird der Dialog mit Mitarbeiter, Datum und Uhrzeit vorausgefuellt geoeffnet. Bestehende Buchung -> Dialog zeigt vorhandene Daten.

5. **Kollabierbar**: Jeder Mitarbeiter-Block kann ein-/ausgeklappt werden, damit die Tabelle bei vielen Mitarbeitern uebersichtlich bleibt.

Keine Datenbank-Aenderungen noetig -- die bestehenden Hooks und Tabellen reichen aus.
