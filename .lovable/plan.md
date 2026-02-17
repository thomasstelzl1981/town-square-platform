

## Kalender-Verbesserungen + Buchungs-Workflow fuer Pension

### 1. Sticky Zimmer-Spalte + breitere Spalten

Die Zimmer-Spalte ist bereits `sticky left-0` im Code, aber die Spaltenbreiten sind zu schmal. Aenderungen:
- Zimmer-Spalte: `minWidth` von 180px auf **200px** erhoehen
- Datumsspalten: `minWidth` von 72px auf **100px** erhoehen
- Zellenhoehe von 28px auf **32px** erhoehen

### 2. Halbtags-Darstellung (Anreise/Abreise)

Jede Datumszelle wird vertikal in **zwei Haelften** geteilt (obere Haelfte = Vormittag/Anreise, untere Haelfte = Nachmittag/Abreise). So kann an einem Tag sowohl ein Tier abreisen (obere Haelfte frei) als auch ein neues ankommen (untere Haelfte belegt) -- doppelte Buchung am selben Tag wird moeglich.

```text
┌──────────┐
│  AM/Abr. │  <- Check-out Tier A (halber Tag)
├──────────┤
│  PM/Anr. │  <- Check-in Tier B (halber Tag)
└──────────┘
```

### 3. Header-Buttons aendern

- **Haus-Icon** (Home) statt Plus-Icon fuer "Neues Zimmer anlegen"
- **Zweiter Button** mit Plus-Icon fuer "Neue Buchung anlegen"
- Beide als `variant="glass" size="icon-round"` gemaess Standard

### 4. Buchungs-Dialog

Ein neuer Inline-Dialog / Overlay (wie die Zimmerakte) zum Anlegen einer Pension-Buchung:
- **Felder:** Hund (Auswahl aus bestehenden Hunden/Kunden), Zimmer, Anreise-Datum, Abreise-Datum, Notizen
- Beim Speichern: `pet_bookings` INSERT mit `booking_area = 'pension'` + `pet_room_assignments` INSERT mit `room_id`, `check_in_at`, `check_out_at`
- Die Buchung erscheint dann automatisch im Kalender als farbiger Balken mit Hundename

### 5. Kalender-Zellen zeigen Buchungen

Statt nur "marked dots" werden echte Buchungen angezeigt:
- Farbiger Hintergrund-Balken ueber den Buchungszeitraum
- Hundename als Text in der Zelle
- Klick auf belegte Zelle oeffnet die Buchung zur Bearbeitung (gleicher Dialog wie Anlage, vorausgefuellt)
- Halbtags-Logik: Anreisetag zeigt nur untere Haelfte belegt, Abreisetag nur obere Haelfte

### 6. Datenmodell-Erweiterung

`pet_room_assignments` hat bereits `check_in_at` und `check_out_at` -- diese werden fuer die Kalender-Darstellung genutzt. Keine Schema-Aenderung noetig. Die Buchungsdaten kommen aus dem JOIN von `pet_room_assignments` mit `pets` (Hundename).

Der bestehende `useRoomAssignments` Hook muss erweitert werden, um auch zukuenftige Buchungen zu laden (aktuell filtert er `check_out_at IS NULL`). Neuer Hook `usePensionCalendarData` laedt alle Assignments in einem Datumsbereich.

### Technische Umsetzung

| Datei | Aenderung |
|-------|-----------|
| `PMPension.tsx` | Spaltenbreiten erhoehen, Halbtags-Zellen, Header-Buttons (Haus + Plus), Buchungs-Overlay, Klick-auf-Buchung |
| `usePetRooms.ts` | Neuer Hook `usePensionCalendarAssignments(providerId, startDate, endDate)` ohne `check_out_at IS NULL` Filter |
| Kein DB-Migration noetig | Bestehendes Schema reicht aus |

### Ablauf einer Buchung

```text
[+] Button klicken
    -> Buchungs-Overlay oeffnet sich
    -> Hund auswaehlen (aus pets-Tabelle)
    -> Zimmer auswaehlen
    -> Anreise + Abreise Datum
    -> Speichern
        -> INSERT pet_bookings (booking_area='pension')
        -> INSERT pet_room_assignments (room_id, pet_id, booking_id, check_in_at, check_out_at)
    -> Kalender zeigt Balken mit Hundename
    -> Klick auf Balken -> Overlay mit Daten vorausgefuellt -> Bearbeiten/Loeschen
```
