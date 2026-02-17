

# Mobile Startseite: Modul-Liste mit Chat-Umschaltung

## Zusammenfassung

Die mobile Startseite (/portal) zeigt aktuell nur den Armstrong-Chat. Wir bauen sie um zu einer **scrollbaren Modul-Liste** mit **Chat-Eingabe unten**. Beim Tippen/Senden wechselt die Ansicht zum Vollbild-Chat. Der "Zurueck"-Button bringt die Modul-Liste wieder.

## Aufbau der neuen Startseite

```text
+----------------------------------+
| SystemBar                        |
+----------------------------------+
| Headline / Begruessung           |
+----------------------------------+
| Finanzueberblick          >      |
| Immobilien                >      |
| Konten                    >      |
| Datenraum                 >      |
| Posteingang               >      |
| Sparen                    >      |
| Versicherungen            >      |
| Fahrzeuge                 >      |
| Mehr                      >      |
| Armstrong Tasks           >      |
+----------------------------------+
| [Mic] [+] [Eingabe...] [Send]   |
+----------------------------------+
```

Beim Senden einer Nachricht oder Tippen:

```text
+----------------------------------+
| SystemBar                        |
+----------------------------------+
| [Zurueck zur Liste]              |
| Chat-Nachrichten (scrollbar)     |
|                                  |
|                                  |
+----------------------------------+
| [Mic] [+] [Eingabe...] [Send]   |
+----------------------------------+
```

## Aenderungen

### 1. Neue Komponente: `MobileHomeModuleList.tsx`

- Liest Module aus `routesManifest.ts` und `areaConfig.ts`
- Filtert nach `mobileConfig.ts` (versteckte Module ausblenden)
- Zeigt eine konfigurierbare Liste von Modulen/Tiles als vertikale Karten
- Jede Karte navigiert zum entsprechenden Modul oder Tile
- Konfiguration der angezeigten Eintraege ueber ein Array (welche Module, welche Tiles)

### 2. Anpassung: `MobileHomeChatView.tsx`

- Bekommt einen "Zurueck"-Button oben, der zum Modul-Modus wechselt
- Wird nur angezeigt, wenn der Chat aktiv ist

### 3. Anpassung: `PortalLayout.tsx` (Mobile Dashboard-Bereich)

- Neuer State: `mobileHomeMode: 'modules' | 'chat'`
- Dashboard zeigt standardmaessig `MobileHomeModuleList`
- Wechselt zu `MobileHomeChatView` wenn eine Nachricht gesendet wird
- Die `MobileBottomBar` bleibt immer sichtbar

### 4. Anpassung: `MobileBottomBar.tsx`

- Die Area-Navigationsbuttons (Home, Client, Manager, Service, Base) bleiben unveraendert
- `onChatActivated`-Callback wird hinzugefuegt: Wenn der User eine Nachricht sendet und auf der Startseite ist, wechselt die Ansicht zum Chat

### 5. Konfiguration: `mobileHomeConfig.ts` (neu)

Zentrales Config-Array das bestimmt, welche Eintraege auf der mobilen Startseite erscheinen:

```typescript
export const mobileHomeEntries = [
  { type: 'module', code: 'MOD-18', label: 'Finanzueberblick' },
  { type: 'module', code: 'MOD-04', label: 'Immobilien' },
  { type: 'tile', code: 'MOD-02', tile: 'konten', label: 'Konten' },
  { type: 'module', code: 'MOD-03', label: 'Datenraum' },
  // ... etc.
];
```

So koennen Sie frei bestimmen, welche Module oder einzelne Menüpunkte auf der Startseite erscheinen.

## Technische Details

**Betroffene Dateien:**
- `src/components/portal/MobileHomeModuleList.tsx` (NEU)
- `src/config/mobileHomeConfig.ts` (NEU)
- `src/components/portal/MobileHomeChatView.tsx` (Zurueck-Button hinzufuegen)
- `src/components/portal/PortalLayout.tsx` (State-Logik modules/chat)
- `src/components/portal/MobileBottomBar.tsx` (Chat-Aktivierung Callback)

**Keine Aenderungen an:**
- Routing / ManifestRouter
- Desktop-Layout
- Bestehende Module/Tiles
- Datenbank / Backend

