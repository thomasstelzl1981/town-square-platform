
# Plan: `/kaufy/immobilien` Route entfernen — Homepage `/kaufy` als einzige Immobilien-Seite

## Problemanalyse

Die Kaufy-Website hat aktuell zwei Immobilien-Seiten mit unterschiedlichen Designs:

| Route | Komponente | Problem |
|-------|------------|---------|
| `/kaufy` (Homepage) | `KaufyPropertyCard` | ✅ Korrektes Design |
| `/kaufy/immobilien` | `InvestmentResultTile` | ❌ Falsches Design (MOD-08 Portal-Kachel) |

**Ihr Design (`KaufyPropertyCard`)** ist das saubere, durchdachte Design mit:
- 4:3 Bildformat
- Vertikale Metrik-Anzeige (Cashflow, Steuervorteil, Netto-Belastung)
- Zone3-Styling (--z3-* Variablen)
- Eigener Netto-Belastungs-Footer mit farbigem Hintergrund

Die `/kaufy/immobilien`-Seite verwendet stattdessen `InvestmentResultTile` — das ist die **Portal-Kachel für MOD-08**, nicht für die öffentliche Website.

## Lösung: Route entfernen und Links anpassen

### Phase 1: Route aus Manifest entfernen

**Datei:** `src/manifests/routesManifest.ts`

Die Route `{ path: "immobilien", component: "KaufyImmobilien" }` wird entfernt.
Die dynamische Exposé-Route `{ path: "immobilien/:publicId", component: "KaufyExpose" }` bleibt.

### Phase 2: Navigation anpassen

**Datei:** `src/pages/zone3/kaufy/KaufyLayout.tsx`

Alle Links, die auf `/kaufy/immobilien` zeigen, werden auf `/kaufy` umgeleitet:
- Header-Navigation (Zeile 15): "Immobilien" → `/kaufy`
- Footer (Zeile 143): "Immobilien" → `/kaufy`

### Phase 3: "Alle anzeigen" Button entfernen

**Datei:** `src/pages/zone3/kaufy/KaufyHome.tsx`

Der Button "Alle anzeigen →" (Zeilen 219-226) wird entfernt, da es keine separate Übersichtsseite mehr gibt. Die Homepage IST die Übersicht.

### Phase 4: Weitere Links im Codebase anpassen

Folgende Dateien werden geprüft und Links zu `/kaufy/immobilien` auf `/kaufy` geändert:
- `src/pages/zone3/kaufy/KaufyExpose.tsx` — "Zurück"-Link
- `src/pages/zone3/kaufy/KaufyModule.tsx` — CTA-Links
- `src/pages/zone3/kaufy/KaufyBeratung.tsx` — Evtl. Links

### Phase 5: Komponente löschen

**Datei:** `src/pages/zone3/kaufy/KaufyImmobilien.tsx`

Die Datei wird gelöscht, da sie nicht mehr verwendet wird.

## Routen-Struktur nach der Änderung

| Route | Inhalt |
|-------|--------|
| `/kaufy` | Homepage mit Hero, Investment-Suche, `KaufyPropertyCard` |
| `/kaufy/immobilien/:publicId` | Einzelnes Exposé (bleibt) |
| `/kaufy/vermieter` | Statische Seite (unverändert) |
| `/kaufy/verkaeufer` | Statische Seite (unverändert) |
| `/kaufy/vertrieb` | Statische Seite (unverändert) |
| ... | Alle anderen Routen bleiben |

**Entfernt:**
- `/kaufy/immobilien` (redundante Übersichtsseite)

## Dateien-Änderungen

| Datei | Aktion |
|-------|--------|
| `src/manifests/routesManifest.ts` | Route entfernen |
| `src/pages/zone3/kaufy/KaufyLayout.tsx` | Nav-Links anpassen |
| `src/pages/zone3/kaufy/KaufyHome.tsx` | "Alle anzeigen" Button entfernen |
| `src/pages/zone3/kaufy/KaufyExpose.tsx` | Zurück-Link prüfen |
| `src/pages/zone3/kaufy/KaufyModule.tsx` | CTA-Links prüfen |
| `src/pages/zone3/kaufy/KaufyImmobilien.tsx` | Löschen |
| `src/router/ManifestRouter.tsx` | Import entfernen |

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | `/kaufy` aufrufen | Homepage zeigt `KaufyPropertyCard` (Ihr Design) |
| 2 | Investment-Suche durchführen | Kacheln zeigen berechnete Metriken |
| 3 | Auf Kachel klicken | Navigation zu `/kaufy/immobilien/{publicId}` (Exposé) |
| 4 | Navigation "Immobilien" klicken | Führt zu `/kaufy` |
| 5 | `/kaufy/immobilien` aufrufen | 404 (Route existiert nicht mehr) |
| 6 | Alle statischen Kaufy-Seiten | Funktionieren weiterhin |
