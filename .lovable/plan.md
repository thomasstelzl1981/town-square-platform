

# Portal Header Redesign — ARMSTRONG Wordmark + Glas-Buttons

## Ueberblick

Der SystemBar wird komplett umgebaut: 3 runde Glas-Buttons links, zentrierter ARMSTRONG-Schriftzug, 3 runde Glas-Buttons rechts. Alle Buttons erhalten identisches Design. Digitale Uhr, Standort-Label und Hoehenmeter werden entfernt.

## Visuelles Konzept

```text
[ Home ] [ Theme ] [ Temp ]     ARMSTRONG     [ Uhr ] [ Armstrong ] [ Profil ]
```

Alle 6 Buttons: rund (`rounded-full`), gleiche Groesse (`h-10 w-10`), Glas-Stil (`variant="glass" + rounded-full`).

## Aenderungen im Detail

### 1. Entfernen

- Standort-Anzeige (MapPin, Stadt, Hoehe) — komplett raus
- Digitale Uhr (formattedTime) — wird ersetzt durch analoge Uhr
- Geolocation-Fetching (nominatim API call) — bleibt intern fuer Temperatur, aber Stadtanzeige faellt weg
- Mountain-Icon und Altitude-Anzeige

### 2. Links — 3 runde Glas-Buttons

| # | Funktion | Icon | Aktion |
|---|----------|------|--------|
| 1 | Home | `Home` | navigate('/portal'), setActiveArea(null) |
| 2 | Theme Toggle | `Sun`/`Moon` | setTheme toggle |
| 3 | Temperatur | Thermometer oder Temperaturwert | Zeigt aktuelle Aussentemperatur (OpenMeteo API, kein API-Key noetig) |

**Temperatur-Button:** Nutzt die bereits vorhandene Geolocation (latitude/longitude) um ueber die freie OpenMeteo API (`https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current_weather=true`) die aktuelle Temperatur abzurufen. Anzeige als z.B. "12°" direkt im Button oder als Tooltip.

### 3. Mitte — ARMSTRONG Schriftzug

- Reiner Text-Schriftzug "ARMSTRONG" (kein Bild-Asset)
- CSS-Styling: `font-size` passend zur Button-Hoehe (~14-16px), `letter-spacing: 0.2em`, `font-weight: 500-600`
- Futuristisch/technisch durch breites Letter-Spacing und eine geometrische Schriftart (System-Font `font-sans` mit Tracking)
- Light Mode: `text-foreground` (dunkel)
- Dark Mode: `text-foreground` (hell) — folgt automatisch dem Theme
- Kein Logo-Asset, kein Icon, kein Emblem

### 4. Rechts — 3 runde Glas-Buttons (von innen nach aussen)

| # | Funktion | Inhalt | Aktion |
|---|----------|--------|--------|
| 1 | Analoge Uhr | Mini-SVG-Uhr (Stunden+Minutenzeiger) | Rein dekorativ, zeigt aktuelle Uhrzeit analog |
| 2 | Armstrong Chatbot | `Rocket`-Icon | Toggle Armstrong Sidebar (bestehende Logik) |
| 3 | Profil | Initialen (z.B. "TS") im Avatar | Dropdown-Menue (bestehende Logik) |

**Analoge Uhr:** Ein kleines SVG-Element (~24x24px) innerhalb des runden Glas-Buttons. Drei Elemente: Kreis (Ziffernblatt), Stundenzeiger, Minutenzeiger. CSS `transform: rotate()` basierend auf `currentTime`. Update jede Minute.

### 5. Einheitlicher Button-Stil

Alle 6 Buttons bekommen exakt denselben Stil:
```
className="h-10 w-10 rounded-full bg-white/30 dark:bg-white/10 
           backdrop-blur-md border border-white/20 dark:border-white/10 
           shadow-[inset_0_1px_0_hsla(0,0%,100%,0.15)] 
           hover:bg-white/45 dark:hover:bg-white/15 
           flex items-center justify-center transition-all"
```

Das `ThemeToggle`-Komponent wird inline integriert (kein separates Komponent mehr noetig, oder es wird angepasst um den neuen Stil zu uebernehmen).

## Technische Umsetzung

### Dateien

| Datei | Aenderung |
|---|---|
| `src/components/portal/SystemBar.tsx` | Komplett-Umbau: 3 Zonen, 6 Glas-Buttons, ARMSTRONG-Text, analoge Uhr-SVG, Temperatur-Fetch |
| `src/components/ui/theme-toggle.tsx` | Anpassung auf `rounded-full` Glas-Stil oder Inline-Integration |

### Keine Datenbank-Aenderungen noetig

### Neue API-Abhaengigkeit
- OpenMeteo (frei, kein API-Key): `https://api.open-meteo.com/v1/forecast` fuer Temperatur
- Geolocation bleibt bestehen (bereits implementiert), wird aber nur noch fuer Temperatur genutzt, nicht mehr fuer Stadt-Anzeige

### Analoge Uhr — SVG-Implementierung
- Inline-SVG mit `viewBox="0 0 24 24"`
- Kreis als Rahmen
- Zwei Linien (Stunden-/Minutenzeiger) mit dynamischem `rotate` basierend auf `new Date()`
- Update-Intervall: 60 Sekunden (bestehender Timer wird wiederverwendet)

