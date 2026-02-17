

## Mobile UX Overhaul — Aktualisierter Plan

### Uebersicht der 4 Aenderungen

---

### 1. Manager-Area (operations) auf Mobile entfernen

Die `MobileBottomBar` filtert die `operations`-Area heraus. Ergebnis: 4 Buttons (Home + Base, Client, Service).

**Dateien:**
- `src/config/mobileConfig.ts`: Neue Konstante `MOBILE_HIDDEN_AREAS = ['operations']`
- `src/components/portal/MobileBottomBar.tsx`: `areaConfig.filter(a => !MOBILE_HIDDEN_AREAS.includes(a.key))`

---

### 2. SystemBar auf Mobile minimieren

Kompakte Mobile-Leiste (h-10 statt h-12):
- Links: Nur Home-Button
- Mitte: "ARMSTRONG"
- Rechts: Nur Profil-Avatar
- Entfernt auf Mobile: Theme-Toggle, Temperatur, Uhr, Armstrong-Rocket

**Datei:** `src/components/portal/SystemBar.tsx`

---

### 3. NEUES KONZEPT: SubTabs als vertikale Zwischenseite statt horizontaler Pillen

**Problem:** Die horizontalen Pillen (z.B. bei Finanzanalyse: Uebersicht, Investment, Versicherungen, Vorsorge, KV, Abos, Vorsorge & Testament, Darlehen) sind auf Mobile zu viele und zu breit. Das fuehlt sich nach Browser an, nicht nach App.

**Loesung:** Auf Mobile werden die SubTabs NICHT als horizontale Leiste angezeigt. Stattdessen:

1. Wenn man ein Modul oeffnet, erscheint eine **vertikale Listenansicht** mit allen Sub-Tabs als grosse, tippbare Zeilen
2. Tippt man auf einen Eintrag, slided die Zielseite von rechts rein
3. Ein Zurueck-Button bringt einen zur Liste zurueck

**Skizze am Beispiel /portal/finanzanalyse:**

```text
+----------------------------------+
| [Home]    ARMSTRONG    [Avatar]   |  <- SystemBar (h-10)
+----------------------------------+
|                                  |
|   FINANZEN                       |  <- Modul-Titel
|                                  |
|   +----------------------------+ |
|   | > Uebersicht               | |  <- Tippbare Zeilen
|   +----------------------------+ |
|   | > Investment               | |
|   +----------------------------+ |
|   | > Sachversicherungen       | |
|   +----------------------------+ |
|   | > Vorsorge                 | |
|   +----------------------------+ |
|   | > Krankenversicherung      | |
|   +----------------------------+ |
|   | > Abonnements             | |
|   +----------------------------+ |
|   | > Vorsorge & Testament     | |
|   +----------------------------+ |
|   | > Darlehen                 | |
|   +----------------------------+ |
|                                  |
+----------------------------------+
| [Home] [Base] [Client] [Service] |  <- BottomBar
| [Mic] [+] [Nachricht...] [Send] |
+----------------------------------+
```

**Nach Klick auf "Investment":**

```text
+----------------------------------+
| [<]       ARMSTRONG    [Avatar]   |  <- Zurueck-Pfeil
+----------------------------------+
|                                  |
|   Investment-Tab Inhalt          |  <- Volle Seite, kein
|   (Charts, Kacheln etc.)         |     SubTab-Balken oben
|   ...                            |
|   ...                            |
|                                  |
+----------------------------------+
| [Home] [Base] [Client] [Service] |
| [Mic] [+] [Nachricht...] [Send] |
+----------------------------------+
```

**Technische Umsetzung:**

- Neue Komponente: `src/components/portal/MobileModuleMenu.tsx`
  - Empfaengt `module: ModuleDefinition` und `moduleBase: string`
  - Zeigt Modul-Name als Header + alle Tiles als vertikale Liste
  - Klick navigiert zum Tile-Route
- `src/components/portal/PortalLayout.tsx` (Mobile-Bereich):
  - Wenn auf einer Modul-Basis-Route (z.B. `/portal/finanzanalyse`) und kein konkreter Tile aktiv: Zeige `MobileModuleMenu` statt `Outlet`
  - Wenn ein konkreter Tile aktiv (z.B. `/portal/finanzanalyse/investment`): Zeige `Outlet` ohne SubTabs
- `src/components/portal/SubTabs.tsx`: Auf Mobile komplett ausblenden (`if (isMobile) return null`)
- `src/components/portal/SystemBar.tsx`: Auf Mobile, wenn in einem Tile: Home-Button wird zu Zurueck-Pfeil (navigiert zum Modul-Menue)

---

### 4. MobileBottomBar: Glass-Button-Styling

Die Buttons bekommen Glass-Effekt (backdrop-blur, transparenter Hintergrund, subtle border) fuer schwebendes App-Feeling.

**Datei:** `src/components/portal/MobileBottomBar.tsx`

---

### Zusammenfassung aller Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/config/mobileConfig.ts` | `MOBILE_HIDDEN_AREAS` hinzufuegen |
| `src/components/portal/MobileBottomBar.tsx` | Operations filtern, Glass-Styling |
| `src/components/portal/SystemBar.tsx` | Mobile: h-10, nur Home/Zurueck + Armstrong + Avatar |
| `src/components/portal/SubTabs.tsx` | Mobile: komplett ausblenden |
| `src/components/portal/MobileModuleMenu.tsx` | NEU: Vertikale Tile-Liste als Zwischenseite |
| `src/components/portal/PortalLayout.tsx` | Mobile: MobileModuleMenu bei Modul-Basis-Route anzeigen |

6 Dateien (1 neu, 5 geaendert), keine DB-Aenderungen.

### Funktionstest nach Implementierung

Kompletter Mobile-Walkthrough mit Screenshots:
1. Home — Chat-Ansicht, 4 Buttons (kein Manager)
2. Client-Area — Module-Karten
3. Finanzanalyse oeffnen — Vertikale Tile-Liste
4. "Investment" antippen — Inhalt ohne SubTab-Leiste
5. Zurueck zum Modul-Menue
6. Andere Module stichprobenartig pruefen
7. SystemBar auf allen Seiten pruefen

