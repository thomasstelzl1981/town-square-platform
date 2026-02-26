

## Shop-Qualitaetsaudit: Befunde & Bereinigungsplan

### Analyse aller 12 Shop-Keys (exkl. pet-style, pet-tracker)

| Shop-Key | Produkte | Fehlende Bilder | Fehlende Beschreibung | Bild-Qualitaet | Sonstiges |
|-----------|----------|-----------------|----------------------|----------------|-----------|
| amazon | 6 | 0 | 0 | OK (Unsplash) | OK |
| bueroshop24 | 6 | 0 | 0 | OK (Unsplash) | Beschreibungen sehr kurz |
| miete24 | 6 | 0 | 0 | OK (Unsplash) | OK |
| miete24-autos | 9 | 0 | 0 | OK (miete24.com) | OK |
| bmw-fokus | 7 | 0 | 0 | OK (helming-sohn.de) | OK |
| boote | 14 | 3 | 0 | OK (hallerexperiences.com) | 3 Add-ons ohne Bild (by design) |
| privatjet | 11 | 2 | 0 | OK | 2 Add-ons ohne Bild (by design) |
| smart-home | 16 | 0 | **16** | Reolink-CDN | Alle description = NULL |
| pet-ernaehrung | 12 | **5** | 0 | Lakefields-CDN | 5 Lakefields-Produkte ohne Bild |
| pet-fressnapf | 6 | 0 | **6** | **60x60px** | Alle description = NULL, Bilder viel zu klein |
| pet-style | 16 | — | — | — | **AUSGENOMMEN** |
| pet-tracker | 6 | — | — | — | **AUSGENOMMEN** |

### Kritische Probleme (3 Shops)

**1. pet-ernaehrung — 5 fehlende Bilder**
Betroffen:
- Lakefields Trockenfleisch-Menü Rind 150g
- Lakefields Leckerli vom Hirsch 50g
- Lakefields Leckerli vom Weiderind 50g
- Lakefields Leckerli vom Weiderind 150g
- Lakefields SUPERFOOD Trockenfutter Lamm 1kg

Fix: Bilder von lakefields.b-cdn.net recherchieren und UPDATE ausfuehren.

**2. pet-fressnapf — 6 fehlende Beschreibungen + winzige Bilder (60x60px)**
Alle 6 Produkte (KONG Classic, KONG Frisbee, AniOne Tau, AniOne Schlange, Trixie Flip Board, Trixie Schnueffelteppich) haben:
- `description = NULL`
- `image_url` mit 60x60px (viel zu klein fuer Karten-Darstellung)
- `sub_category = NULL` (keine Gruppierung)

Fix: Beschreibungen ergaenzen, Bilder auf hoehere Aufloesung (533x533 oder groesser) aktualisieren, sub_category setzen.

**3. smart-home — 16 fehlende Beschreibungen**
Alle Reolink-Produkte haben `description = NULL`. Die `metadata.notes` enthalten interne Notizen, aber keine kundenfreundliche Beschreibung.

Fix: Professionelle Kurzbeschreibungen fuer alle 16 Produkte ergaenzen.

### Kleinere Inkonsistenzen

**4. bueroshop24 — Beschreibungen zu kurz**
Beispiel: "5.000 Blatt, 80g/m²" — eher ein Untertitel als eine Beschreibung.
Fix: Professionelle Einzeiler ergaenzen.

**5. boote + privatjet Add-ons — kein Bild**
By Design (Icon-Karten in der UI). Kein Fix noetig.

### Umsetzungsschritte

| # | Aktion | Anzahl Updates |
|---|--------|---------------|
| 1 | pet-ernaehrung: 5x image_url setzen (Lakefields CDN) | 5 UPDATEs |
| 2 | pet-fressnapf: 6x description + image_url (hoehere Aufloesung) + sub_category | 6 UPDATEs |
| 3 | smart-home: 16x description ergaenzen | 16 UPDATEs |
| 4 | bueroshop24: 6x description professionalisieren | 6 UPDATEs |
| 5 | Screenshots aller Shop-Bereiche nach Bereinigung | Browser-Tests |

Gesamt: ~33 UPDATE-Statements, 0 Schema-Aenderungen, 0 neue Dateien.

Keine UI-Code-Aenderungen noetig — die Komponenten rendern bereits korrekt, sobald die Daten vollstaendig sind.

