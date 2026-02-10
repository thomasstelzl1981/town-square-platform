
# MIETY Uebersicht: 3-Kachel-Layout + Kommunikation-Redesign

## Aenderung 1: Uebersicht — 3 quadratische Kacheln nebeneinander

Die aktuelle Home-Card (eine einzelne breite Karte) wird ersetzt durch **3 gleichgrosse, quadratische Kacheln** nebeneinander (wie Dashboard-Widgets, `aspect-square`):

### Kachel 1: Adresse + Name
- **Zeile 1:** Vorname + Nachname (aus `profile.first_name` + `profile.last_name`)
- **Zeile 2:** Strasse + Hausnummer
- **Zeile 3:** PLZ + Stadt
- Schrift etwas groesser als bisher, untereinander angeordnet
- Badges (Miete/Eigentum, Flaeche, Zimmer) darunter
- "Bearbeiten" Button

### Kachel 2: Foto / Google Street View
- Quadratisches Feld fuer Foto-Upload (Drag & Drop oder Klick)
- Wenn kein eigenes Foto: Versuch Google Street View Embed zu laden (`https://www.google.com/maps?q={adresse}&layer=c&output=embed`)
- Fallback: Upload-Platzhalter mit Kamera-Icon

### Kachel 3: Google Earth / Satellitenansicht
- Der bisherige kleine Satellite-Embed wird zur eigenen quadratischen Kachel
- `https://www.google.com/maps?q={adresse}&t=k&z=18&output=embed`
- Rundung und Overflow wie die anderen Kacheln

**Layout:** `grid grid-cols-1 sm:grid-cols-3 gap-4`, jede Kachel `aspect-square`

## Aenderung 2: Tab-Reihenfolge — Dokumente raus, Kommunikation nach rechts

Die "Dokumente"-Tab wird entfernt (redundant mit den anderen Ordnern). Neue Reihenfolge:

1. Uebersicht
2. Zaehlerstaende
3. Versorgung
4. Versicherungen
5. Kommunikation (ganz rechts)

### routesManifest.ts MOD-20 tiles:
```
uebersicht, zaehlerstaende, versorgung, versicherungen, kommunikation
```

5 Tiles statt 6 (Dokumente entfaellt).

## Aenderung 3: Kommunikation-Tab komplett neu (3 Kacheln)

### Kachel 1: WhatsApp Business
- WhatsApp-Icon (gruen)
- Feld fuer Vermieter-Telefonnummer
- "Nachricht senden" Button
- Info: "Verfuegbar wenn Ihr Vermieter WhatsApp Business nutzt"
- Farblich leicht abgehoben wenn verbunden (gruener Rand/Hintergrund)

### Kachel 2: E-Mail
- Mail-Icon
- Feld fuer Vermieter E-Mail-Adresse
- Betreff + Nachrichtenfeld
- "E-Mail senden" Button
- Direkter Versand per `mailto:` Link oder kuenftig ueber Backend

### Kachel 3: KI-Uebersetzer
- Languages/Globe-Icon
- Textfeld fuer Eingabe
- Sprachauswahl (Deutsch → Englisch, Tuerkisch, Arabisch, Ukrainisch etc.)
- "Uebersetzen" Button
- Uebersetztes Ergebnis mit "Kopieren" Button
- User kann dann per Copy & Paste in WhatsApp oder E-Mail einfuegen

Die Vermieter-Verlinkung (Einladungscode) bleibt als kleiner Bereich oberhalb der 3 Kacheln. Wenn verbunden, werden die Kontaktdaten des Vermieters automatisch in WhatsApp/E-Mail eingetragen und die Kacheln farblich abgehoben.

## Technische Aenderungen

| Datei | Aenderung |
|---|---|
| `src/pages/portal/MietyPortalPage.tsx` | UebersichtTile: 3-Kachel-Grid mit Adresse/Foto/Satellite. KommunikationTile: Komplett neu mit WhatsApp/E-Mail/KI-Uebersetzer. DokumenteTile entfernen. |
| `src/manifests/routesManifest.ts` | MOD-20 tiles: Dokumente entfernen, Kommunikation ans Ende (5 Tiles) |

### Keine Datenbank-Aenderungen noetig
- Profile-Daten werden nur gelesen (SELECT)
- Google Maps Embeds sind keyless
- KI-Uebersetzung wird spaeter an Armstrong/Edge Function angebunden (vorerst UI-Platzhalter)
