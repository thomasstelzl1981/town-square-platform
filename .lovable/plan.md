

# Smart Home Shop + Zuhause-Umbau

## Zusammenfassung

Zwei zusammenhaengende Aenderungen:

1. **Neuer "Smart Home" Shop-Tab** in MOD-16 (Services) mit kompatiblen IP-Kameras, die ueber unseren Snapshot-Proxy funktionieren -- mit Amazon-Affiliate-Links als Einnahmequelle
2. **Zuhause-Modul (MOD-20) bereinigen**: Versicherungen entfernen (jetzt in MOD-18 Finanzen), Eufy-Integration komplett entfernen, Snapshot-Kamera-Integration vorbereiten

---

## Phase 1: Smart Home Shop (MOD-16)

### Neuer Tab "Smart Home" im Services-Bereich

Neben Amazon Business, OTTO Office, Miete24 und Bestellungen kommt ein fuenfter Tab: **Smart Home**.

Dieser Tab zeigt eine kuratierte Auswahl an IP-Kameras, die mit unserem System kompatibel sind -- sortiert nach Einsatzbereich (Outdoor, Indoor, Babyfon).

### Produktkatalog (nur Reolink + Amcrest)

Zwei Hersteller reichen fuer den Start -- beide nutzen das gleiche CGI-Protokoll (Dahua-basiert bei Amcrest), sind preislich attraktiv und haben HTTP-Snapshot-URLs:

**Outdoor-Kameras:**
| Produkt | Hersteller | ca. Preis | Highlight |
|---------|-----------|-----------|-----------|
| RLC-810A | Reolink | 55 EUR | 4K PoE, Nachtsicht, wetterfest |
| RLC-520A | Reolink | 45 EUR | 5MP PoE Dome, kompakt |
| IP4M-1026B | Amcrest | 50 EUR | 4MP PoE Bullet, Nachtsicht |

**Indoor-Kameras:**
| Produkt | Hersteller | ca. Preis | Highlight |
|---------|-----------|-----------|-----------|
| E1 Zoom | Reolink | 50 EUR | PTZ, 5MP, WLAN |
| IP2M-841 | Amcrest | 35 EUR | PTZ, 1080p, WLAN |
| Argus PT Ultra | Reolink | 90 EUR | Akku + Solar-Option |

**Baby-Monitoring:**
| Produkt | Hersteller | ca. Preis | Highlight |
|---------|-----------|-----------|-----------|
| ASH21 (Apollo) | Amcrest | 40 EUR | Nachtlicht, Lullabies, 2-Way-Audio |
| IP2M-841B | Amcrest | 35 EUR | Indoor PTZ, leise |

### Business-Modell: Affiliate-Links

Jede Produktkarte enthaelt einen **Amazon-Affiliate-Link**. Das funktioniert ueber das **Amazon PartnerNet** (nicht AWIN -- Amazon hat ein eigenes Programm):

- Provisions-Rate: 1-3% auf Elektronik/Kameras
- Integration: Einfacher Link mit Partner-Tag (z.B. `?tag=immoportal-21`)
- Spaeter ausbaubar: Reolink bietet auch ein eigenes Affiliate-Programm (6-20% Provision)

### UI-Design

Die Produktkarten folgen dem bestehenden ShopTab-Pattern:
- Produktbild (Platzhalter/generisches Kamera-Icon initial)
- Name, Preis, Hersteller
- Kompatibilitaets-Badge ("Snapshot-kompatibel")
- Einsatzbereich-Badge (Outdoor/Indoor/Baby)
- "Bei Amazon kaufen" Button mit Affiliate-Link
- Info-Tooltip: "Dieses Geraet kann direkt in Ihrem Zuhause-Dashboard Kamerabilder anzeigen"

---

## Phase 2: Zuhause-Modul (MOD-20) bereinigen

### 2a. Versicherungen entfernen

- `VersicherungenTile` aus `MietyPortalPage.tsx` entfernen
- `VersicherungenTile.tsx` Datei kann bestehen bleiben (toter Code), oder geloescht werden
- Tile "versicherungen" aus `routesManifest.ts` MOD-20 entfernen
- Versicherungen sind bereits in MOD-18 (Finanzen) unter "sachversicherungen" abgebildet

### 2b. Eufy-Integration komplett entfernen

Folgende Bestandteile werden entfernt:
- `EufyConnectCard` Komponente aus `SmartHomeTile.tsx`
- Amazon-Business-Link-Card fuer Eufy aus `SmartHomeTile.tsx`
- `demoCameras.ts` -- Demo-Kameradaten entfernen
- Demo-Kamera-Anzeige aus `UebersichtTile.tsx` (Zeilen 253-287)
- Edge Function `eufy-connect` loeschen

Die DB-Tabelle `miety_eufy_accounts` bleibt vorerst bestehen (keine destruktive Schema-Aenderung noetig, da leer).

### 2c. Snapshot-Integration vorbereiten

**SmartHomeTile** wird umgebaut zu:
- "Meine Kameras" -- Leerzustand mit Hinweis: "Verbinden Sie eine kompatible IP-Kamera"
- Link zum Smart Home Shop: "Kompatible Kameras ansehen"
- Platzhalter fuer kuenftige Kamera-CRUD (Name, Snapshot-URL, Auth)

**UebersichtTile** -- Kamera-Bereich wird zu:
- Platzhalter mit "Kameras einrichten" wenn keine Kameras konfiguriert
- Vorbereitet fuer echte Snapshot-Bilder (Phase 3: DB-Tabelle `miety_cameras` + Edge Function `camera-snapshot-proxy`)

---

## Aenderungen im Detail

### Neue/Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/ServicesPage.tsx` | Neuer Route: `smart-home` |
| `src/pages/portal/services/ShopTab.tsx` | Neuer Shop-Key `smart-home` mit Produktkatalog |
| `src/manifests/routesManifest.ts` | MOD-16: Tile `smart-home` hinzufuegen; MOD-20: Tile `versicherungen` entfernen |
| `src/pages/portal/MietyPortalPage.tsx` | `VersicherungenTile` Import + Render entfernen |
| `src/pages/portal/miety/tiles/SmartHomeTile.tsx` | Eufy komplett raus, Snapshot-Vorbereitung rein |
| `src/pages/portal/miety/tiles/UebersichtTile.tsx` | Demo-Kameras entfernen, Platzhalter fuer echte Kameras |

### Zu loeschende Dateien/Functions

| Datei | Grund |
|-------|-------|
| `supabase/functions/eufy-connect/index.ts` | Eufy-Integration wird entfernt |
| `src/pages/portal/miety/shared/demoCameras.ts` | Keine Demo-Kameras mehr noetig |
| Demo-Kamera-Assets (`cam-entrance.jpg` etc.) | Nicht mehr referenziert |

---

## Business-Chancen: Smart Home als Plattform-Feature

1. **Affiliate-Einnahmen**: Jede Kamera-Bestellung ueber unseren Shop generiert Provision (Amazon PartnerNet: 1-3%, Reolink direkt: 6-20%)
2. **Kundenbindung**: Nutzer, die Kameras ueber uns kaufen und einrichten, haben einen konkreten taeglichen Grund, die Plattform zu oeffnen
3. **Upselling**: Smart-Home-Nutzer sind empfaenglicher fuer weitere Services (Versicherungen, Energieberatung, Handwerker)
4. **Differenzierung**: Kaum eine Immobilien-Plattform bietet Kamera-Integration -- das ist ein Alleinstellungsmerkmal
5. **Skalierung**: Spaeter erweiterbar um Sensoren (Tuer/Fenster, Rauchmelder, Thermostate) -- gleiches Affiliate-Modell

