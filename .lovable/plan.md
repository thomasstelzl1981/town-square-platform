
# MIETY Sichtbarkeits-Fix — Tiles mit echtem Inhalt befuellen

## Problem-Analyse

Der Code wurde zwar erstellt, aber die 5 Tile-Seiten (Dokumente, Kommunikation, Zaehlerstaende, Versorgung, Versicherungen) zeigen alle nur leere `ModuleTilePage`-Platzhalter mit `status="empty"`. Das Dossier existiert unter `/portal/miety/zuhause/:homeId`, aber die Tiles verlinken nur schwach darauf ("Zur Uebersicht"). Der User sieht daher auf jedem Tab nur "leer".

**Kern-Problem:** Alle 5 Tiles nutzen `ModuleTilePage` mit `status="empty"` — ein generischer Blueprint-Platzhalter. Keine Tile zeigt echte Daten oder leitet intelligent zum Dossier weiter.

## Loesung

Alle 5 Tiles werden von generischen Platzhaltern zu funktionalen Seiten umgebaut, die:

1. **Wenn Homes existieren:** Eine Zusammenfassung der jeweiligen Daten ueber alle Homes + direkte "Zur Akte" Navigation zeigen
2. **Wenn keine Homes existieren:** Den Create-Flow direkt einbetten (nicht nur "Zur Uebersicht" verlinken)
3. **Immer:** Quick-Action-Buttons fuer die jeweilige Funktion zeigen

## Aenderungen

### Datei: `src/pages/portal/MietyPortalPage.tsx`

Alle 5 Tile-Funktionen komplett ersetzen:

**DokumenteTile:** 
- Zeigt Home-Cards mit Dokumenten-Zaehler pro Home
- CTA "Akte oeffnen" pro Home
- Empty State: "Legen Sie zuerst ein Zuhause an" + Create-Button

**ZaehlerstaendeTile:**
- Zeigt letzte Zaehlerstaende aus `miety_meter_readings` ueber alle Homes
- Kacheln pro Zaehlertyp (Strom/Gas/Wasser/Heizung) mit letztem Wert
- CTA "Zaehlerstand erfassen" (navigiert zur Akte)

**VersorgungTile:**
- Zeigt Versorger-Vertraege aus `miety_contracts` (Kategorie strom/gas/wasser/internet)
- Karten mit Anbieter + Kosten
- CTA "Vertrag anlegen"

**VersicherungenTile:**
- Zeigt Versicherungs-Vertraege aus `miety_contracts` (Kategorie hausrat/haftpflicht)
- Karten mit Status-Badge
- CTA "Versicherung hinzufuegen"

**KommunikationTile:**
- Bleibt Platzhalter, aber mit besserem Design (kein generisches ModuleTilePage mehr)
- Zeigt "Kommt bald" mit Teaser-Inhalt

### Gemeinsames Pattern fuer alle Tiles:

```text
+------------------------------------------+
| [Icon] Titel                              |
| Beschreibungstext                         |
+------------------------------------------+
| [Home-Card 1]  [Home-Card 2]  [Home-Card] |
|  - Zaehler: 3   - Zaehler: 0             |
|  [Akte oeffnen] [Akte oeffnen]            |
+------------------------------------------+
| ODER (wenn keine Homes):                  |
| "Legen Sie zuerst ein Zuhause an"         |
| [Zuhause anlegen Button]                  |
+------------------------------------------+
```

### Technische Details:

- Jede Tile bekommt einen eigenen `useQuery` Hook fuer die relevanten Daten
- `miety_homes` wird in allen Tiles abgefragt (als Grundlage)
- `miety_contracts` wird in Versorgung/Versicherungen gefiltert nach `category`
- `miety_meter_readings` wird in Zaehlerstaende mit letztem Wert pro Typ abgefragt
- Navigation zur Akte via `navigate(/portal/miety/zuhause/${home.id})`
- `ModuleTilePage` Import wird komplett entfernt — keine generischen Platzhalter mehr

### Padding/Container:

Alle Tiles bekommen `container max-w-5xl mx-auto p-4` fuer konsistentes Layout, mit einem schlichten Header (Titel + Beschreibung in `text-h2` + `text-sm text-muted-foreground`).

## Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/MietyPortalPage.tsx` | Alle 5 Tile-Funktionen komplett neu schreiben (DokumenteTile, KommunikationTile, ZaehlerstaendeTile, VersorgungTile, VersicherungenTile) — `ModuleTilePage` durch echte Daten-Abfragen + Karten ersetzen |

Keine neuen Dateien noetig. Keine Datenbank-Aenderungen.
