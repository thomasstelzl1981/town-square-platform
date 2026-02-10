
# MOD-13 Projekte: Analyse und Reparaturplan

## Befunde

### 1. Routing: Grundsaetzlich korrekt, aber Legacy-Link fehlerhaft

Die Routing-Struktur ist intakt:
- `/portal/projekte` leitet korrekt auf `/portal/projekte/dashboard` weiter
- 4 Tiles (Dashboard, Projekte, Vertrieb, Marketing) werden in der SubTabs-Navigation angezeigt -- das entspricht dem 4-Tile-Pattern aus der MOD-13-Spezifikation
- `kontexte` ist bewusst als "hidden route" konfiguriert (nur ueber Einstellungen erreichbar)

**Problem gefunden:** Die `ProjectDetailPage` hat einen Back-Button der auf `/portal/projekte/portfolio` zeigt (Zeile 73 und 100). Das ist eine **alte Route**, die per Legacy-Redirect auf `/portal/projekte/projekte` umgeleitet wird. Das funktioniert, erzeugt aber einen unnoetigem Redirect-Hop und wuerde brechen, wenn die Legacy-Redirects irgendwann entfernt werden.

**Fix:** Back-Links in `ProjectDetailPage.tsx` aendern von `/portal/projekte/portfolio` auf `/portal/projekte/projekte`.

### 2. Leere Seiten ohne Seed-Daten: Kein Bug, aber verbesserbar

Alle Tabs haben bereits Empty States:
- **Dashboard:** Zeigt "Laden Sie oben ein Expose hoch" mit Magic-Intake-Widget
- **Projekte (Portfolio):** Zeigt EmptyState-Komponente mit "Keine Projekte" + Button
- **Vertrieb:** Zeigt EmptyState "Keine Reservierungen"
- **Marketing:** Zeigt EmptyState "Keine Projekte"

Die Grundstruktur ist also erkennbar. Falls die Seiten aber komplett leer erscheinen, koennte das ein **RLS-Problem** sein (kein `tenantId` im Profil = leere Queries = aber die UI zeigt trotzdem die Struktur). Das muss auf dem echten Account getestet werden.

### 3. Storage-Tree-Abgleich: DISKREPANZ GEFUNDEN

Es gibt eine **Inkonsistenz** zwischen zwei Stellen:

**storageManifest.ts (entity_sub_folders fuer MOD_13):**
```
01_Expose, 02_Kalkulation, 03_Vertrag, 04_Due_Diligence, 
05_Gutachten, 06_Fotos, 07_Sonstiges
```

**sot-project-intake Edge Function (PROJECT_FOLDERS):**
```
01_expose, 02_preisliste, 03_bilder_marketing, 
04_kalkulation_exports, 05_reservierungen, 06_vertraege, 99_sonstiges
```

Die Edge Function ist die **korrekte SSOT** gemaess der Memory-Eintraege. Die `storageManifest.ts` hat noch alte/generische Ordnernamen. Das bedeutet:
- Wenn ein anderer Code-Pfad (z.B. DMS-Modul, universeller Upload) die `storageManifest.ts` nutzt, wuerden falsche Ordner erstellt werden
- Die Edge Function selbst nutzt ihre eigenen Konstanten, nicht die aus storageManifest

**Fix:** `storageManifest.ts` MOD_13 `entity_sub_folders` an die Edge Function angleichen.

### 4. Unit-Ordner-Struktur: Korrekt

Die Edge Function erstellt bei Projektanlage:
- `{projectCode}/` (Projektordner unter MOD_13-Root)
- `{projectCode}/01_expose/` bis `{projectCode}/99_sonstiges/`
- `{projectCode}/Einheiten/{WE-001}/01_grundriss/` bis `99_sonstiges/`

Das entspricht exakt der dokumentierten Hierarchie.

---

## Aenderungen

### Datei 1: `src/pages/portal/projekte/ProjectDetailPage.tsx`
- Zeile 73: `/portal/projekte/portfolio` aendern zu `/portal/projekte/projekte`
- Zeile 100: `/portal/projekte/portfolio` aendern zu `/portal/projekte/projekte`

### Datei 2: `src/config/storageManifest.ts`
- MOD_13 `entity_sub_folders` aktualisieren auf die korrekten Ordnernamen:
```
'01_expose', '02_preisliste', '03_bilder_marketing',
'04_kalkulation_exports', '05_reservierungen', '06_vertraege', '99_sonstiges'
```
- `required_docs` entsprechend anpassen:
```
{ name: 'Projekt-Expose', folder: '01_expose' },
{ name: 'Preisliste', folder: '02_preisliste' },
```

### Datei 3: Keine weiteren Aenderungen noetig

Die 4-Tile-Navigation, das Routing und die Empty States funktionieren korrekt. Es gibt kein Routing-Problem bei den Tabs -- alle 4 Tiles (Dashboard, Projekte, Vertrieb, Marketing) sind im Manifest definiert und werden von der SubTabs-Komponente korrekt gerendert.
