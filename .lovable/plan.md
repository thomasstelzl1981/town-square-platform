
# Reparaturplan: Sanierung Demo-Daten an echtes MOD-04 Objekt koppeln

## Ist-Zustand

Das Demo-Widget und die Inline-Akte zeigen ein frei erfundenes "EFH Berlin, Prenzlauer Allee 88" mit energetischer Sanierung (Fassade, Fenster, Dach, Waermepumpe). Dieses Objekt existiert nicht in der Datenbank.

## Soll-Zustand

Die Demo-Sanierung referenziert das echte MOD-04-Demo-Objekt **BER-01** (Schadowstr., 10117 Berlin, ETW, 85 m², WE-B01) und zeigt eine **Kernsanierung der Wohnung** mit neuen Boeden und neuen Baedern im mittleren Standard.

## Aenderungen

### 1. goldenPathProcesses.ts — Widget-Metadaten aktualisieren

Die `demoWidget`-Felder fuer `GP-SANIERUNG` anpassen:
- **title**: "Demo: Kernsanierung BER-01" (statt "Sanierung EFH Berlin")
- **subtitle**: "Schadowstr., Berlin — Boeden und Baeder, mittlerer Standard"
- **badgeLabel**: bleibt "DEMO"

### 2. SanierungTab.tsx — Inline-Detail komplett ueberarbeiten

Die hartkodierten Demo-Daten (Zeilen 138-227) ersetzen durch realistische Kernsanierung fuer BER-01:

**Header:**
- Titel: "Kernsanierung WE-B01 — Schadowstr., Berlin"
- Adresse: Schadowstr., 10117 Berlin, ETW, 85 m²
- Kategorie: Kernsanierung (statt "Energetisch")

**Leistungsverzeichnis (linke Spalte) — 5 Positionen, mittlerer Standard:**

| Pos | Leistung | Kosten |
|-----|----------|--------|
| 1 | Bodenbelag Wohnraeume (Eiche Landhausdiele, 65 m²) | 5.850 EUR |
| 2 | Bodenbelag Nassraeume (Feinsteinzeug 60x60, 20 m²) | 2.400 EUR |
| 3 | Badsanierung komplett (Dusche, WC, Waschtisch, Armaturen) | 8.500 EUR |
| 4 | Gaeste-WC Sanierung (WC, Handwaschbecken, Spiegel) | 3.200 EUR |
| 5 | Malerarbeiten Waende und Decken (85 m² Wohnflaeche) | 2.550 EUR |
| | **Gesamt** | **22.500 EUR** |

**Dienstleister und Angebote (rechte Spalte):**

| Firma | Status | Betrag |
|-------|--------|--------|
| Berliner Badsanierung GmbH | Angebot erhalten | 21.800 EUR |
| Boden- und Fliesenwerk Mitte | Angebot erhalten | 23.900 EUR |
| Sanierung Plus Berlin | Ausstehend | – |

Bestes Angebot: Berliner Badsanierung GmbH — 21.800 EUR (3% unter Budget)

**Widget-Footer:** Budget: 22.500 EUR, 5 Positionen

### 3. demoDataManifest.ts — Beschreibung anpassen

Consumer-Description aendern von "Demo-Guard fuer EFH Berlin" auf "Demo: Kernsanierung BER-01 Schadowstr."

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/goldenPathProcesses.ts` | Widget title/subtitle |
| `src/pages/portal/immobilien/SanierungTab.tsx` | Komplettes Inline-Detail (Zeilen 66-227) |
| `src/manifests/demoDataManifest.ts` | Consumer-Description |
