
# Reparaturplan: Sanierung Demo — Vollstaendiger Flow

## Problem

Die Demo-Ansicht zeigt nur 3 statische SectionCards mit Tabellen. Der echte Flow (`SanierungDetailInner`) hat wesentlich mehr Inhalt:

1. **Leistungsumfang** mit KI-Beschreibungsfeld, Kostenschaetzung (Min/Mid/Max), Line-Items-Editor und Ausschreibungsbeschreibung
2. **Dienstleister & Ausschreibung** mit Suchfeld, Ergebnisliste, ausgewaehlten Anbietern UND Ausschreibungs-E-Mail-Entwurf
3. **Angebote & Vergabe** mit Vergleichstabelle und Empfehlung

## Loesung

Den Demo-Block in `SanierungTab.tsx` so umbauen, dass er die **gleiche visuelle Struktur** wie `SanierungDetailInner` zeigt — nur mit statischen, vorausgefuellten Demo-Daten statt interaktiver Panels.

### Aufbau (von oben nach unten, scrollbar)

**1. Header** (bleibt wie jetzt)
- "Kernsanierung WE-B01 — Schadowstr., Berlin"
- Badges: Demo, offers_received

**2. Stepper** (bleibt wie jetzt)
- Status: `offers_received` (Schritte 1-3 erledigt, Schritt 4 aktiv)

**3. Section: Leistungsumfang** — erweitert um:
- **Links (FORM_GRID):** Vorausgefuelltes Beschreibungsfeld (read-only Textarea) mit dem Text "Kernsanierung der 85 m² ETW: Neue Boeden in allen Raeumen, komplette Badsanierung und Gaeste-WC, Malerarbeiten..."
- **Rechts:** Kostenschaetzungs-Card (Min: 18.500 EUR / Mid: 22.500 EUR / Max: 27.000 EUR) — gleiche Card-Struktur wie `CostEstimateCard`
- **Darunter full-width:** Line-Items-Tabelle (5 Positionen wie bisher, aber im gleichen Layout wie `LineItemsEditor`)
- **Darunter full-width:** Ausschreibungsbeschreibung (read-only Textarea mit professionellem Text)

**4. Section: Dienstleister & Ausschreibung** — erweitert um:
- **Links:** Suchfeld (deaktiviert, vorausgefuellt "Handwerker Sanierung"), Location "Berlin", dann 3 Suchergebnisse mit Ratings/Telefon/E-Mail (wie `ProviderSearchPanel`), darunter "Ausgewaehlt (3)" Liste
- **Rechts:** E-Mail-Entwurf mit Betreff, Anrede, Ausschreibungstext, Tender-ID Referenz, PDF-Anlagen-Badges (wie `TenderDraftPanel`)

**5. Section: Angebote & Vergabe** (bleibt wie jetzt)
- Vergleichstabelle + Empfehlung

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/immobilien/SanierungTab.tsx` | Demo-Block (Zeilen 159-294) komplett ersetzen mit erweitertem Layout |

### Keine neuen Dateien oder Komponenten noetig — alles wird mit bestehenden UI-Primitiven (Card, Badge, Input, Textarea, SectionCard) nachgebaut, nur read-only und vorausgefuellt.
