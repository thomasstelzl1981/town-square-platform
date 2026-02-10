

# Miety Redesign: Eufy Integration, quadratische Widgets und Smart Home API

## Zusammenfassung

Vier Bereiche werden ueberarbeitet:
1. **Uebersicht**: Schnellzugriff-Kacheln (Row 2) entfernen, Kamera-Widgets quadratisch machen
2. **Versorgung & Versicherungen**: IST/SOLL-Kacheln quadratisch und identisch gross machen
3. **Smart Home**: Arlo komplett durch Eufy ersetzen (Produkte, Shop, Branding), funktionale API-Anbindung via `eufy-security-client` vorbereiten
4. **Assets**: Arlo-Bilder durch Eufy-Produktbilder ersetzen

---

## 1. Uebersicht — Schnellzugriff entfernen, Kameras quadratisch

### Aenderungen in `MietyPortalPage.tsx` (UebersichtTile)

**Entfernen (Zeilen 353-376):**
- Der gesamte "Schnellzugriff"-Block mit den 4 kleinen Kacheln (Strom, Internet, Hausrat, Zaehler) wird entfernt
- Die zugehoerige `quickCards`-Variable und `getContractStatus`-Hilfsfunktion werden ebenfalls entfernt

**Kamera-Widgets quadratisch machen (Zeilen 310-344):**
- `aspect-video` wird zu `aspect-square` geaendert
- Das Kamera-Grid bleibt `grid-cols-3`, aber jede Kachel bekommt `aspect-square` wie die Adress-/Maps-Kacheln in Row 1

---

## 2. Versorgung — IST/SOLL Kacheln quadratisch

### Aenderungen in `MietyPortalPage.tsx` (VersorgungTile)

- Jede IST- und SOLL-Karte bekommt `aspect-square` und identische Hoehe
- Das Grid `grid-cols-1 sm:grid-cols-2` bleibt, aber beide Karten werden mit `aspect-square flex flex-col` versehen
- Inhalte werden mit `justify-between` vertikal verteilt, damit die Karten nicht unterschiedlich hoch sind
- "Nicht verfügbar"-Placeholder-Karten (Gas, Wasser, Internet SOLL) bekommen ebenfalls `aspect-square`

---

## 3. Versicherungen — IST/SOLL Kacheln quadratisch

### Aenderungen in `MietyPortalPage.tsx` (VersicherungenTile)

- Gleiche Logik wie Versorgung: `aspect-square` auf alle IST- und SOLL-Karten
- Neo Digital Vergleichskarten bekommen identische Groesse wie die IST-Karten

---

## 4. Smart Home — Arlo durch Eufy ersetzen

### 4a. Branding und Produkte austauschen

**Produkt-Daten aktualisieren (SmartHomeTile):**

Bisherige Arlo-Produkte werden durch echte Eufy-Produkte ersetzt:

| Alt (Arlo) | Neu (Eufy) | Preis | Badges |
|------------|-----------|-------|--------|
| Arlo Pro 5S 2K | eufy SoloCam S340 | ab 159,99 EUR | 3K, Solar, WLAN, 360 Grad |
| Arlo Pro 5S 2K (Duplikat) | eufy Floodlight Cam E340 | ab 179,99 EUR | 3K, Flutlicht, WLAN, 360 Grad |
| Arlo Pro 5S 2K (Duplikat) | eufy Indoor Cam S350 | ab 59,99 EUR | 4K, Pan&Tilt, WLAN, Dual-Cam |
| Arlo SmartHub | eufy HomeBase S380 | ab 149,99 EUR | WiFi, 16TB, Lokal-KI |

**Texte anpassen:**
- "Arlo Shop" wird zu "eufy Shop"
- "Bei Arlo kaufen" wird zu "Bei eufy kaufen"
- "Arlo Konto verbinden" wird zu "eufy Konto verbinden"
- "Starter Set — Arlo Premium" wird zu "Starter Set — eufy Security"
- Preise und Links werden auf eufy.com angepasst
- TileShell description: "Kamera-Verwaltung und eufy Smart Home"

**Produkt-Bilder:**
- Neue Placeholder-Bilder werden von der eufy-Website heruntergeladen und in `src/assets/miety/` abgelegt:
  - `eufy-solocam-s340.jpg` (ersetzt `arlo-pro5s.jpg`)
  - `eufy-homebase-s380.jpg` (ersetzt `arlo-smarthub.jpg`)
- Alte Arlo-Bilder werden entfernt

### 4b. Produkt-Grid quadratisch machen

- Alle Produkt-Kacheln im Smart Home Shop bekommen `aspect-square`
- Grid bleibt `grid-cols-2`, Kacheln werden identisch gross

### 4c. Funktionale eufy-API-Anbindung vorbereiten

**Neue Edge Function: `supabase/functions/eufy-connect/index.ts`**

Die Anbindung erfolgt ueber die `eufy-security-client` Bibliothek (NPM). Da Edge Functions auf Deno laufen, wird ein REST-basierter Ansatz verwendet:

- Edge Function nimmt E-Mail + Passwort entgegen
- Verbindet sich mit der eufy Cloud API (HTTPS-Endpunkte)
- Gibt die Liste der Kameras und deren Status zurueck
- Zugangsdaten werden verschluesselt in der DB gespeichert (Tabelle `miety_eufy_accounts`)

**Neue DB-Tabelle: `miety_eufy_accounts`**

```text
id          UUID PK
user_id     UUID FK -> auth.users(id)
tenant_id   UUID FK -> tenants(id)
email       TEXT (verschluesselt)
token       TEXT (API-Token nach Login)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

RLS: Nur der eigene User kann seine Zeile lesen/schreiben.

**Login-Flow im Frontend (SmartHomeTile):**

1. User gibt eufy E-Mail + Passwort ein
2. Klick auf "Verbindung herstellen"
3. Edge Function wird aufgerufen, authentifiziert bei eufy Cloud
4. Bei Erfolg: Token wird in `miety_eufy_accounts` gespeichert
5. Kameras werden geladen und im "Meine Kameras"-Bereich angezeigt
6. Status-Badge wechselt auf "Verbunden"

**Kamera-Daten nach Login:**
- Die Edge Function gibt Kamera-Metadaten zurueck (Name, Modell, Status, Seriennummer)
- Diese ersetzen dann die Demo-Kameras in der Uebersicht
- Livestream-URLs werden nicht direkt unterstuetzt (eufy P2P), aber Snapshot-URLs koennen abgerufen werden

---

## 5. Assets-Verwaltung

| Aktion | Datei |
|--------|-------|
| Loeschen | `src/assets/miety/arlo-pro5s.jpg` |
| Loeschen | `src/assets/miety/arlo-smarthub.jpg` |
| Neu (von eufy.com) | `src/assets/miety/eufy-solocam-s340.jpg` |
| Neu (von eufy.com) | `src/assets/miety/eufy-homebase-s380.jpg` |

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/MietyPortalPage.tsx` | Stark editiert (alle 4 Tile-Funktionen) |
| `src/assets/miety/eufy-solocam-s340.jpg` | Neu |
| `src/assets/miety/eufy-homebase-s380.jpg` | Neu |
| `src/assets/miety/arlo-pro5s.jpg` | Entfernen |
| `src/assets/miety/arlo-smarthub.jpg` | Entfernen |
| `supabase/functions/eufy-connect/index.ts` | Neu (Edge Function) |
| DB-Migration: `miety_eufy_accounts` Tabelle | Neu |

## Umfang

- 1 grosse Datei editieren (MietyPortalPage.tsx)
- 2 neue Assets, 2 alte loeschen
- 1 neue Edge Function
- 1 DB-Migration (neue Tabelle + RLS)

