

# MIETY Uebersicht: Auto-Home + Google Maps Satellitenansicht

## Problem

Obwohl die Profildaten gespeichert sind, muss der User immer noch manuell auf "Zuhause anlegen" klicken und ein Formular ausfuellen. Die Uebersicht zeigt die Adresse nicht automatisch an und es fehlt eine Kartenansicht.

## Loesung

### 1. Auto-Create Home beim Laden der Uebersicht

Wenn der User MIETY oeffnet und kein Home existiert, aber Profildaten (mindestens `city`) vorhanden sind, wird automatisch ein Home-Eintrag in `miety_homes` erstellt — OHNE Formular, OHNE Klick.

**Ablauf:**
1. `UebersichtTile` laedt `homes` und `profile`
2. Wenn `homes.length === 0` UND `profile.city` existiert → automatischer INSERT in `miety_homes` mit Profildaten
3. Query wird invalidiert → Home-Card erscheint sofort

### 2. Home-Card mit Adresse + Google Maps Satellite

Die bestehende Home-Card (Zeilen 177-198 in MietyPortalPage) wird erweitert:

- **Links:** Name, Adresse, Eigentum/Miete Badge, Flaeche (wie bisher)
- **Rechts:** Google Maps Satellite Embed als kleine Kachel (ca. 120x120px), eingebettet per iframe mit `https://www.google.com/maps?q={adresse}&t=k&output=embed` (`t=k` = Satellitenansicht)
- "Bearbeiten" Button um Daten zu aendern

### 3. Bearbeiten-Modus statt Neu-Anlegen

Da das Home automatisch existiert, wird der "Zuhause anlegen" CTA ersetzt durch einen "Bearbeiten" Button auf der Home-Card. Klick oeffnet das bestehende `MietyCreateHomeForm` im Edit-Modus (vorausgefuellt mit bestehenden Daten).

## Technische Aenderungen

| Datei | Aenderung |
|---|---|
| `src/pages/portal/MietyPortalPage.tsx` | UebersichtTile: Auto-Create Logik (useEffect + useMutation), Home-Card mit Google Maps Satellite Embed, Bearbeiten-Button statt Anlegen |
| `src/pages/portal/miety/components/MietyCreateHomeForm.tsx` | Optionale `homeId` + `initialData` Props fuer Edit-Modus (UPDATE statt INSERT) |

### Keine Datenbank-Aenderungen noetig

`miety_homes` hat alle benoetigten Spalten. Google Maps Embed ist keyless (bestehendes Pattern laut Memory).

