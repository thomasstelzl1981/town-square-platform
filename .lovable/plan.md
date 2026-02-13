

# Zuhause: Alle Inhalte inline + Smart Home Widget-Link zu Amazon Business

## Was sich aendert

### 1. MietyPortalPage — Von Router zu Inline-Stack

Aktuell rendert `MietyPortalPage` die Tiles als separate Routen mit Sub-Navigation. Stattdessen werden alle 5 Tiles (inkl. Smart Home) untereinander auf einer einzigen Seite gerendert.

**Datei:** `src/pages/portal/MietyPortalPage.tsx`

- Routes-Struktur komplett entfernen
- Alle 5 Tiles direkt untereinander rendern: `UebersichtTile`, `VersorgungTile`, `VersicherungenTile`, `SmartHomeTile`, `KommunikationTile`
- Smart Home **bleibt** hier (wird NICHT zu Services verschoben)
- Die Route `zuhause/:homeId` fuer das Dossier wird in ImmobilienPage separat behandelt

### 2. ImmobilienPage — Dossier-Route separat

**Datei:** `src/pages/portal/ImmobilienPage.tsx`

- `path="zuhause"` -> `MietyPortalPage` (alle Tiles gestapelt, kein Sub-Router)
- `path="zuhause/:homeId"` -> `MietyHomeDossier` (Einzelansicht, eigene Route)

### 3. SmartHomeTile — Widget-Link zu Amazon Business

**Datei:** `src/pages/portal/miety/tiles/SmartHomeTile.tsx`

Anstatt die eufy-Produkte direkt als Shop darzustellen, wird der Produkt-Grid-Bereich durch einen kompakten **Widget-Link** ersetzt, der auf Amazon Business verweist:

- Das "Starter Set"-Banner und der Produkt-Grid (`eufyProducts`) werden entfernt
- Stattdessen: Eine kompakte `ContentCard` / Link-Card mit:
  - Amazon-Business-Icon (ShoppingCart)
  - Text: "eufy Geraete bei Amazon Business finden"
  - Beschreibung: "Kameras, HomeBase und Zubehoer direkt ueber Amazon Business bestellen"
  - Button: "Bei Amazon Business suchen" -> Link zu `/portal/services/amazon` (interner Link zum Amazon-Shop-Tab)
- Die **EufyConnectCard** (API-Verbindung) und **Kamera-Verwaltung** (Meine Kameras) bleiben unveraendert

Ergebnis: Smart Home zeigt nur noch die eigenen Geraete/Kameras und die Eufy-Konto-Verbindung. Fuer den Kauf wird auf Amazon Business verlinkt.

### 4. Manifest — Kein Verschieben von SmartHome

**Datei:** `src/manifests/routesManifest.ts`

- SmartHome bleibt in MOD-20 (kein Verschieben nach MOD-16)
- Keine Aenderungen an der MOD-16 Service-Struktur

---

## SmartHomeTile Layout (nach Umbau)

```text
PageShell
  ModulePageHeader ("Smart Home", "Kamera-Verwaltung und eufy Smart Home")

  Card: "Meine Kameras"          (bleibt unveraendert)
    - Kamera-Liste mit Toggles

  Card: Widget-Link               (NEU — ersetzt Starter Set + Produkt-Grid)
    - Icon: ShoppingCart
    - "eufy Geraete bei Amazon Business finden"
    - Button -> /portal/services/amazon

  EufyConnectCard                  (bleibt unveraendert)
    - E-Mail / Passwort Login
    - Verbundene Geraete anzeigen
```

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| EDIT | `src/pages/portal/MietyPortalPage.tsx` — Router entfernen, alle 5 Tiles inline stapeln |
| EDIT | `src/pages/portal/ImmobilienPage.tsx` — Separate Route fuer `zuhause/:homeId` |
| EDIT | `src/pages/portal/miety/tiles/SmartHomeTile.tsx` — Produkt-Grid durch Widget-Link zu Amazon Business ersetzen |

Keine neuen Dateien. Keine Datenbank-Aenderungen. ServicesPage bleibt unveraendert.
