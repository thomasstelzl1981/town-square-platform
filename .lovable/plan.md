

## Neue Sektion: "Unsere Websites" im Profil-Tab

### Was wird gebaut

Unterhalb des AppDownloadWidget im ProfilTab wird eine neue Sektion mit 4 CI-Kacheln eingefuegt, die die verbleibenden Zone-3-Websites (Kaufy, System of a Town, Acquiary, FutureRoom) als klickbare Kacheln mit Links darstellen.

### Layout

```text
+--------------------------------------------------+
| ModulePageHeader: "Stammdaten"                    |
+--------------------------------------------------+
| RecordCard (Profildaten)                          |
| OutboundIdentityWidget                            |
+--------------------------------------------------+
| AppDownloadWidget                                 |
+--------------------------------------------------+
| NEU: "Unsere Websites"                            |
|  [Kaufy]  [System of a Town]  [Acquiary]  [FR]   |
|  Glass-Cards, je mit Icon, Name, kurzer           |
|  Beschreibung und Link-Button                     |
+--------------------------------------------------+
| Sticky Save Button                                |
+--------------------------------------------------+
```

### Technische Umsetzung

**Datei: `src/pages/portal/stammdaten/ProfilTab.tsx`**

1. Neue Komponente `WebsitesSection` innerhalb der Datei (oder als `ProfileWidget`-Nutzung):
   - 4 `glass-card` Kacheln im `grid grid-cols-2 lg:grid-cols-4 gap-4`
   - Jede Kachel:
     - Website-Name als Titel (text-sm font-semibold)
     - Kurzbeschreibung (text-xs text-muted-foreground)
     - Icon aus lucide (Globe, ShoppingBag, Building2, Lightbulb)
     - Klick oeffnet `/website/{slug}` in neuem Tab (`target="_blank"`)
   - Platzierung: zwischen `AppDownloadWidget` (Zeile 487) und dem Sticky-Save-Button (Zeile 492)

2. Website-Daten als statisches Array:
   - `kaufy`: "Kaufy" — E-Commerce & Shopping
   - `sot`: "System of a Town" — Investment-Plattform  
   - `acquiary`: "Acquiary" — Akquise & Vertrieb
   - `futureroom`: "FutureRoom" — Zukunftstechnologien

3. Jede Kachel nutzt das bestehende `ProfileWidget`-Pattern oder direkt eine `Card` mit `glass-card` Klasse

### Aenderungen

- Nur eine Datei: `src/pages/portal/stammdaten/ProfilTab.tsx`
- Keine neuen Dateien, keine DB-Aenderungen
- Import: `ExternalLink` Icon aus lucide ergaenzen
- Kacheln als `<a href="/website/..." target="_blank">` oder `react-router Link`

